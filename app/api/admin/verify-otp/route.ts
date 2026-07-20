import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    let isVerified = false;

    // Cryptographic Stateless Verification
    if (challengeToken && typeof challengeToken === "string" && challengeToken.includes(".")) {
      try {
        const [signature, expiresStr] = challengeToken.split(".");
        const expiresAtMs = Number(expiresStr);
        if (expiresAtMs && Date.now() <= expiresAtMs) {
          const expectedPayload = `${normalizedEmail}:${cleanOtp}:${expiresAtMs}`;
          const expectedSignature = crypto.createHmac("sha256", OTP_SECRET_KEY).update(expectedPayload).digest("hex");
          if (signature === expectedSignature) {
            isVerified = true;
          }
        }
      } catch (err) {
        console.warn("Verify OTP token check notice:", err);
      }
    }

    // Firestore fallback
    if (!isVerified) {
      try {
        const { getAdminDb } = await import("@/lib/firebase-admin");
        const db = getAdminDb();
        if (db) {
          const snap = await db
            .collection("adminOtps")
            .where("email", "==", normalizedEmail)
            .where("otpCode", "==", cleanOtp)
            .where("verified", "==", false)
            .limit(1)
            .get();

          if (!snap.empty) {
            const doc = snap.docs[0];
            const data = doc.data();
            if (new Date(data.expiresAt) > new Date()) {
              isVerified = true;
              await doc.ref.update({ verified: true });
            }
          }
        }
      } catch (dbErr) {
        console.warn("Firestore verify OTP notice:", dbErr);
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please try again." },
        { status: 400 }
      );
    }

    const userUid = "admin_" + crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 12);
    const response = NextResponse.json(
      {
        success: true,
        verified: true,
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
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/verify-otp error:", errorDetails);
    return NextResponse.json(
      { error: "An error occurred during OTP verification." },
      { status: 400 }
    );
  }
}
