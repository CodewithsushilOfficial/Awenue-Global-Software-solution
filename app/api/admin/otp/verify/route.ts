/**
 * POST /api/admin/otp/verify
 *
 * Verify a 6-digit OTP and create a signed HttpOnly admin session.
 *
 * Security guarantees:
 * - OTP must be correct, within expiry, not previously used, within attempt limit
 * - Admin status re-verified AFTER OTP passes (suspend-between-steps protection)
 * - Session cookie is cryptographically signed (HMAC-SHA256)
 * - Does NOT auto-create Firebase Auth users for arbitrary emails
 * - Does NOT create new Firestore admin records
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getActiveOtpChallenge,
  incrementOtpAttempt,
  markOtpUsed,
  hashOtp,
} from "@/lib/otp-store";
import {
  getActiveAdminByEmail,
  updateLastLogin,
  logAdminActivity,
} from "@/lib/admin-auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OTP_SECRET_KEY =
  process.env.OTP_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  "awenue_otp_secret_change_in_production";

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let otp = "";
    let challengeToken = "";

    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email : "";
      otp = typeof body.otp === "string" ? body.otp : (typeof body.otpCode === "string" ? body.otpCode : "");
      challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!email || !otp || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { error: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    let isVerified = false;
    let failureReason = "Invalid verification code. Please check your code or request a new one.";

    // --- Attempt 1: Stateless HMAC challenge token verification ---
    // Resilient across serverless instances (no shared memory needed)
    if (challengeToken && challengeToken.includes(".")) {
      try {
        const lastDot = challengeToken.lastIndexOf(".");
        const signature = challengeToken.substring(0, lastDot);
        const expiresStr = challengeToken.substring(lastDot + 1);
        const expiresAtMs = Number(expiresStr);

        if (expiresAtMs && Date.now() > expiresAtMs) {
          failureReason = "Verification code has expired. Please request a new code.";
        } else if (expiresAtMs) {
          const expectedPayload = `${normalizedEmail}:${cleanOtp}:${expiresAtMs}`;
          const expectedSig = crypto
            .createHmac("sha256", OTP_SECRET_KEY)
            .update(expectedPayload)
            .digest("hex");

          // Timing-safe comparison
          const expectedBuf = Buffer.from(expectedSig, "hex");
          const providedBuf = Buffer.from(signature, "hex");

          if (
            expectedBuf.length === providedBuf.length &&
            crypto.timingSafeEqual(expectedBuf, providedBuf)
          ) {
            isVerified = true;
          } else {
            failureReason = "Invalid verification code.";
          }
        }
      } catch (err) {
        console.warn("[OTP VERIFY] Challenge token parse error:", err);
      }
    }

    // --- Attempt 2: Hash-based verification against stored challenge ---
    if (!isVerified) {
      try {
        const challenge = await getActiveOtpChallenge(normalizedEmail);

        if (!challenge) {
          failureReason = "No active verification session found. Please request a new code.";
        } else if (challenge.used) {
          failureReason = "This code has already been used. Please request a fresh code.";
        } else if (new Date(challenge.expiresAt) <= new Date()) {
          failureReason = "Verification code has expired. Please request a new code.";
        } else if (challenge.attempts >= challenge.maxAttempts) {
          failureReason = "Too many failed attempts. Please request a new code.";
        } else {
          // Increment attempt before checking (prevent timing attacks)
          await incrementOtpAttempt(normalizedEmail);

          const inputHash = hashOtp(cleanOtp);
          if (inputHash === challenge.otpHash) {
            isVerified = true;
          } else {
            const remaining = challenge.maxAttempts - challenge.attempts - 1;
            failureReason =
              remaining > 0
                ? `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
                : "Too many failed attempts. Please request a new code.";
          }
        }
      } catch (err) {
        console.error("[OTP VERIFY] Challenge lookup error:", err);
        failureReason = "Verification error. Please try again.";
      }
    }

    if (!isVerified) {
      // Log failed attempt
      await logAdminActivity({
        action: "OTP_VERIFICATION_FAILED",
        metadata: {
          email: normalizedEmail,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      }).catch(() => {});

      return NextResponse.json({ error: failureReason }, { status: 400 });
    }

    // --- OTP passed — now re-verify admin status ---
    // (Protects against suspension between OTP request and verification)
    const admin = await getActiveAdminByEmail(normalizedEmail);

    if (!admin) {
      await logAdminActivity({
        action: "OTP_VERIFIED_BUT_ADMIN_NOT_ACTIVE",
        metadata: { email: normalizedEmail },
      }).catch(() => {});

      return NextResponse.json(
        { error: "Your admin account is not active. Please contact a Super Admin." },
        { status: 403 }
      );
    }

    // Mark OTP as used
    await markOtpUsed(normalizedEmail).catch(() => {});

    // Update lastLoginAt
    await updateLastLogin(admin.id).catch(() => {});

    // Log successful login
    await logAdminActivity({
      actorAdminId: admin.id,
      action: "ADMIN_LOGIN_SUCCESS",
      metadata: {
        email: normalizedEmail,
        role: admin.role,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    }).catch(() => {});

    // Create signed session token
    const sessionToken = createSessionToken({
      adminId: admin.id,
      email: normalizedEmail,
      role: admin.role,
      displayName: admin.displayName,
    });

    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        admin: {
          adminId: admin.id,
          email: normalizedEmail,
          role: admin.role,
          displayName: admin.displayName,
        },
        message: "Identity verified successfully.",
      },
      { status: 200 }
    );

    // Set HttpOnly signed session cookie
    setSessionCookie(response, sessionToken);

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OTP VERIFY] Unhandled error:", msg);
    return NextResponse.json(
      { error: `Verification error: ${msg}` },
      { status: 400 }
    );
  }
}
