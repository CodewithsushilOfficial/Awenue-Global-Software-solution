import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getActiveOtpChallenge, updateOtpChallengeState } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

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

    // Retrieve active challenge from Hybrid OTP Store (Memory + Firestore)
    const activeChallenge = await getActiveOtpChallenge(normalizedEmail);

    if (!activeChallenge) {
      return NextResponse.json(
        { error: "No active verification request found for this email. Please request a code." },
        { status: 400 }
      );
    }

    const { otpHash, expiresAt, attempts = 0, maxAttempts = 5, used } = activeChallenge;

    // 0. Check if already used or superseded
    if (used) {
      return NextResponse.json(
        { error: "This verification code has already been used or superseded. Please request a fresh code." },
        { status: 400 }
      );
    }

    // 1. Check max verification attempts (Brute-force lockout)
    if (attempts >= maxAttempts) {
      await updateOtpChallengeState(normalizedEmail, { used: true });
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please request a new verification code." },
        { status: 429 }
      );
    }

    // 2. Check 5-minute expiration timestamp
    if (new Date(expiresAt) <= now) {
      await updateOtpChallengeState(normalizedEmail, { used: true });
      return NextResponse.json(
        { error: "Verification code has expired (valid for 5 minutes). Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Verify OTP SHA-256 Hash
    if (inputHash !== otpHash) {
      const newAttempts = attempts + 1;
      const remaining = maxAttempts - newAttempts;
      await updateOtpChallengeState(normalizedEmail, { attempts: newAttempts });

      if (remaining <= 0) {
        await updateOtpChallengeState(normalizedEmail, { used: true });
        return NextResponse.json(
          { error: "Maximum verification attempts exceeded. Please request a new verification code." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Invalid verification code. ${remaining} attempt(s) remaining.` },
        { status: 400 }
      );
    }

    // 4. Mark challenge doc as single-use verified
    await updateOtpChallengeState(normalizedEmail, { used: true });

    // 5. Retrieve or Provision Admin User in Firebase Auth
    let userUid = "admin_" + crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 12);
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
      }
    } catch (authErr) {
      console.warn("[OTP VERIFY] Firebase Admin Auth provision skipped:", authErr);
    }

    // 6. Generate Firebase Custom Auth Token or fallback token
    let customToken = "";
    try {
      if (adminAuth) {
        customToken = await adminAuth.createCustomToken(userUid, {
          role: "admin",
          admin: true,
        });
      }
    } catch (tokErr) {
      console.warn("[OTP VERIFY] Custom token generation skipped:", tokErr);
    }

    // 7. Create Audit Log
    try {
      await adminDb.collection("adminAuditLogs").add({
        type: "ADMIN_LOGIN_SUCCESS",
        adminEmail: normalizedEmail,
        uid: userUid,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        createdAt: nowISO,
      });
    } catch (auditErr) {
      console.warn("[OTP VERIFY] Audit log write skipped:", auditErr);
    }

    // 8. Create Response with Secure HttpOnly Session Cookie
    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        customToken: customToken && customToken.split(".").length === 3 ? customToken : null,
        message: "OTP verified successfully.",
      },
      { status: 200 }
    );

    // Set secure HttpOnly session cookie
    response.cookies.set({
      name: "awenue_admin_session",
      value: `verified_${userUid}_${Date.now()}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/otp/verify error:", errorDetails);
    return NextResponse.json(
      { error: errorDetails || "An error occurred during verification." },
      { status: 500 }
    );
  }
}
