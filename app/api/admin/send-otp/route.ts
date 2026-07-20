import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminOtpEmail } from "@/lib/email";
import { createOtpChallenge } from "@/lib/otp-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OTP_SECRET_KEY = process.env.OTP_SECRET_KEY || "awenue_admin_secure_otp_key_2026_v1";

export async function POST(request: NextRequest) {
  try {
    let email = "";
    try {
      const body = await request.json();
      email = body.email || "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid admin email is required." }, { status: 400 });
    }

    const targetEmail = (process.env.ADMIN_EMAIL || email).toLowerCase();
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // Create Cryptographic Challenge Token (Stateless for Vercel Serverless)
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const hmacPayload = `${targetEmail}:${rawOtp}:${expiresAtMs}`;
    const hmacSignature = crypto.createHmac("sha256", OTP_SECRET_KEY).update(hmacPayload).digest("hex");
    const challengeToken = `${hmacSignature}.${expiresAtMs}`;

    // Store in global memory store + Firestore safely
    try {
      await createOtpChallenge(targetEmail, targetEmail, rawOtp);
    } catch (storeErr) {
      console.warn("OTP create challenge notice:", storeErr);
    }

    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const db = getAdminDb();
      if (db) {
        await db.collection("adminOtps").add({
          email: targetEmail,
          otpCode: rawOtp,
          expiresAt: new Date(expiresAtMs).toISOString(),
          verified: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("Firestore OTP save notice:", dbErr);
    }

    // Send email via Nodemailer
    let emailStatusMessage = `Verification code sent to ${targetEmail}.`;
    try {
      const emailResult = await sendAdminOtpEmail(targetEmail, rawOtp);
      if (!emailResult.success) {
        console.warn("OTP email delivery notice:", emailResult.error);
        if (process.env.NODE_ENV !== "production") {
          emailStatusMessage = `Verification code: ${rawOtp} (Email delivery notice: ${emailResult.error || "SMTP not configured"})`;
        }
      }
    } catch (emailErr) {
      console.warn("Nodemailer send notice:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: emailStatusMessage,
        email: targetEmail,
        challengeToken,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/send-otp error:", errorDetails);
    return NextResponse.json(
      { error: "Failed to generate or send 2FA OTP code. Please try again." },
      { status: 400 }
    );
  }
}
