import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getActiveOtpChallenge, updateOtpChallengeState } from "@/lib/otp-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let otp = "";
    try {
      const body = await request.json();
      email = body.email || "";
      otp = body.otp || body.otpCode || "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!email || !otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { error: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const inputHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    const now = new Date();
    const nowISO = now.toISOString();

    // 1. Retrieve active challenge from Hybrid OTP Store (Memory + Firestore)
    let activeChallenge = null;
    try {
      activeChallenge = await getActiveOtpChallenge(normalizedEmail);
    } catch (getErr) {
      console.warn("Active OTP challenge lookup notice:", getErr);
    }

    if (!activeChallenge) {
      return NextResponse.json(
        { error: "No active verification request found. Please request a new code." },
        { status: 400 }
      );
    }

    const { otpHash, expiresAt, attempts = 0, maxAttempts = 5, used } = activeChallenge;

    // Check if already used
    if (used) {
      return NextResponse.json(
        { error: "This verification code has already been used. Please request a fresh code." },
        { status: 400 }
      );
    }

    // Check max verification attempts
    if (attempts >= maxAttempts) {
      try {
        await updateOtpChallengeState(normalizedEmail, { used: true });
      } catch {}
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please request a new code." },
        { status: 429 }
      );
    }

    // Check 10-minute expiration
    if (new Date(expiresAt) <= now) {
      try {
        await updateOtpChallengeState(normalizedEmail, { used: true });
      } catch {}
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify OTP SHA-256 Hash
    if (inputHash !== otpHash) {
      const newAttempts = attempts + 1;
      const remaining = maxAttempts - newAttempts;
      try {
        await updateOtpChallengeState(normalizedEmail, { attempts: newAttempts });
        if (remaining <= 0) {
          await updateOtpChallengeState(normalizedEmail, { used: true });
        }
      } catch {}

      if (remaining <= 0) {
        return NextResponse.json(
          { error: "Maximum verification attempts exceeded. Please request a new code." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Invalid verification code. ${remaining} attempt(s) remaining.` },
        { status: 400 }
      );
    }

    // Mark challenge as single-use verified
    try {
      await updateOtpChallengeState(normalizedEmail, { used: true });
    } catch {}

    // Provision or Retrieve Admin User in Firebase Auth
    let userUid = "admin_" + crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 12);
    let customToken = "";

    try {
      if (adminAuth) {
        try {
          const userRecord = await adminAuth.getUserByEmail(normalizedEmail);
          userUid = userRecord.uid;
        } catch {
          const newUser = await adminAuth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            displayName: "AWENUE Administrator",
          });
          userUid = newUser.uid;
        }
        await adminAuth.setCustomUserClaims(userUid, { role: "admin", admin: true });
        customToken = await adminAuth.createCustomToken(userUid, { role: "admin", admin: true });
      }
    } catch (authErr) {
      console.warn("[OTP VERIFY] Firebase Admin Auth notice:", authErr);
    }

    // Create Audit Log (safely)
    try {
      if (adminDb) {
        await adminDb.collection("adminAuditLogs").add({
          type: "ADMIN_LOGIN_SUCCESS",
          adminEmail: normalizedEmail,
          uid: userUid,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          createdAt: nowISO,
        });
      }
    } catch (auditErr) {
      console.warn("[OTP VERIFY] Audit log notice:", auditErr);
    }

    // Create Response with Secure HttpOnly Session Cookie
    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        customToken: customToken && customToken.split(".").length === 3 ? customToken : null,
        message: "OTP verified successfully.",
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "awenue_admin_session",
      value: `verified_${userUid}_${Date.now()}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year session duration
    });

    return response;
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/otp/verify error:", errorDetails);
    return NextResponse.json(
      { error: errorDetails || "An error occurred during verification." },
      { status: 400 }
    );
  }
}
