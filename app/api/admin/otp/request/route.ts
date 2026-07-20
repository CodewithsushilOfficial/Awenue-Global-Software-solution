/**
 * POST /api/admin/otp/request
 *
 * Request an OTP for admin login.
 * Only sends OTP if email matches an ACTIVE admin in Firestore.
 * Returns a generic response for unauthorized emails (no enumeration).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  getActiveOtpChallenge,
  invalidatePreviousChallenges,
} from "@/lib/otp-store";
import { getActiveAdminByEmail } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// HMAC key for stateless challenge token (serverless-safe fallback)
const OTP_SECRET_KEY =
  process.env.OTP_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  "awenue_otp_secret_change_in_production";

// OTP valid for 5 minutes
const OTP_TTL_MS = 5 * 60 * 1000;

// Helper to create a fresh generic response (avoids stream reuse bugs in serverless lambdas)
function createGenericResponse() {
  return NextResponse.json(
    {
      success: true,
      message: "If this email is authorized, a verification code has been sent.",
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    let email = "";
    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email : "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify admin eligibility — must be ACTIVE in Firestore
    let admin;
    try {
      admin = await getActiveAdminByEmail(normalizedEmail);
    } catch (err) {
      console.error("[OTP REQUEST] Admin lookup error:", err);
      // On error, return generic response (fail-closed)
      return createGenericResponse();
    }

    if (!admin) {
      // Return generic response — do NOT reveal that email is unregistered
      return createGenericResponse();
    }

    // 2. Enforce 60-second resend cooldown
    try {
      const existingChallenge = await getActiveOtpChallenge(normalizedEmail);
      if (existingChallenge) {
        const elapsedMs = Date.now() - new Date(existingChallenge.createdAt).getTime();
        if (elapsedMs < 60 * 1000) {
          const remainingSecs = Math.ceil((60 * 1000 - elapsedMs) / 1000);
          return NextResponse.json(
            {
              error: `Please wait ${remainingSecs} seconds before requesting a new code.`,
            },
            { status: 429 }
          );
        }
      }
    } catch (err) {
      console.warn("[OTP REQUEST] Cooldown check warning:", err);
    }

    // 3. Invalidate any existing challenges for this email
    try {
      await invalidatePreviousChallenges(normalizedEmail);
    } catch (err) {
      console.warn("[OTP REQUEST] Invalidation warning:", err);
    }

    // 4. Generate cryptographically secure 6-digit OTP
    // NEVER log the raw OTP value
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 5. Create stateless HMAC challenge token (resilient across serverless instances)
    const expiresAtMs = Date.now() + OTP_TTL_MS;
    const hmacPayload = `${normalizedEmail}:${rawOtp}:${expiresAtMs}`;
    const hmacSignature = crypto
      .createHmac("sha256", OTP_SECRET_KEY)
      .update(hmacPayload)
      .digest("hex");
    const challengeToken = `${hmacSignature}.${expiresAtMs}`;

    // 6. Store hashed OTP challenge (memory + Firestore)
    try {
      await createOtpChallenge(admin.id, normalizedEmail, rawOtp);
    } catch (err) {
      console.warn("[OTP REQUEST] Challenge store warning:", err);
    }

    // 7. Send OTP via Nodemailer (server-side only)
    let messageSent = "A 6-digit verification code has been sent to your email.";
    try {
      const emailResult = await sendAdminOtpEmail(normalizedEmail, rawOtp);
      if (!emailResult.success) {
        console.error("[OTP REQUEST] Email delivery failed:", emailResult.error);
        if (process.env.NODE_ENV !== "production") {
          messageSent = `Dev mode: OTP generated. Email delivery notice: ${emailResult.error || "SMTP not configured"}`;
        }
      }
    } catch (mailErr) {
      console.error("[OTP REQUEST] Nodemailer exception:", mailErr);
      if (process.env.NODE_ENV !== "production") {
        messageSent = "Dev mode: OTP generated (email delivery failed — check SMTP config).";
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: messageSent,
        challengeToken,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OTP REQUEST] Unhandled error:", msg);
    return NextResponse.json(
      { error: "An error occurred while generating the verification code." },
      { status: 500 }
    );
  }
}
