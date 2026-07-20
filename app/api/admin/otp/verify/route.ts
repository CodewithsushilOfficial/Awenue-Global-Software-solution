import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getActiveOtpChallenge, updateOtpChallengeState } from "@/lib/otp-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OTP_SECRET_KEY = process.env.OTP_SECRET_KEY || "awenue_admin_secure_otp_key_2026_v1";

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let otp = "";
    let challengeToken = "";
    try {
      const body = await request.json();
      email = body.email || "";
      otp = body.otp || body.otpCode || "";
      challengeToken = body.challengeToken || "";
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
    const now = new Date();
    const nowISO = now.toISOString();

    let isVerified = false;
    let failureReason = "Invalid verification code. Please check your code or request a new one.";

    // 1. Try Stateless Cryptographic Verification (100% resilient across Vercel Serverless Lambdas)
    if (challengeToken && typeof challengeToken === "string" && challengeToken.includes(".")) {
      try {
        const [signature, expiresStr] = challengeToken.split(".");
        const expiresAtMs = Number(expiresStr);
        if (expiresAtMs && Date.now() <= expiresAtMs) {
          const expectedPayload = `${normalizedEmail}:${cleanOtp}:${expiresAtMs}`;
          const expectedSignature = crypto.createHmac("sha256", OTP_SECRET_KEY).update(expectedPayload).digest("hex");
          
          if (signature === expectedSignature) {
            isVerified = true;
          } else {
            failureReason = "Invalid verification code. Please re-enter or request a fresh code.";
          }
        } else if (expiresAtMs && Date.now() > expiresAtMs) {
          failureReason = "Verification code has expired. Please request a new code.";
        }
      } catch (tokenErr) {
        console.warn("[OTP VERIFY] Cryptographic token verification notice:", tokenErr);
      }
    }

    // 2. Fallback to Memory / Firestore Challenge Store if token was omitted or unverified
    if (!isVerified) {
      try {
        const activeChallenge = await getActiveOtpChallenge(normalizedEmail);
        if (activeChallenge) {
          const { otpHash, expiresAt, used } = activeChallenge;
          if (used) {
            failureReason = "This verification code has already been used. Please request a fresh code.";
          } else if (new Date(expiresAt) <= now) {
            failureReason = "Verification code has expired. Please request a new code.";
          } else {
            const inputHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
            if (inputHash === otpHash) {
              isVerified = true;
              try {
                await updateOtpChallengeState(normalizedEmail, { used: true });
              } catch {}
            }
          }
        }
      } catch (storeErr) {
        console.warn("[OTP VERIFY] Memory/Firestore lookup notice:", storeErr);
      }
    }

    if (!isVerified) {
      return NextResponse.json({ error: failureReason }, { status: 400 });
    }

    // Provision User UID
    const userUid = "admin_" + crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 12);
    let customToken: string | null = null;

    // Optional Firebase Admin Auth Claims (if configured)
    try {
      const { getAdminAuth } = await import("@/lib/firebase-admin");
      const auth = getAdminAuth();
      if (auth) {
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(normalizedEmail);
        } catch {
          userRecord = await auth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            displayName: "AWENUE Administrator",
          });
        }
        await auth.setCustomUserClaims(userRecord.uid, { role: "admin", admin: true });
        const token = await auth.createCustomToken(userRecord.uid, { role: "admin", admin: true });
        if (token && token.split(".").length === 3) {
          customToken = token;
        }
      }
    } catch (authErr) {
      console.warn("[OTP VERIFY] Firebase Admin Auth notice (proceeding with session):", authErr);
    }

    // Optional Audit Logging (if configured)
    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const db = getAdminDb();
      if (db) {
        await db.collection("adminAuditLogs").add({
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

    // Create Response with Secure HttpOnly Session Cookie (1-Year Duration for Device Auto-Login)
    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        customToken,
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
      maxAge: 60 * 60 * 24 * 365, // 1 year session duration for persistent auto-login
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
