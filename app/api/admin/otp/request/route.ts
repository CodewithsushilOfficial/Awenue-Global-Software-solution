/**
 * POST /api/admin/otp/request
 *
 * Step 1 of Admin 2FA Login:
 * Verifies Admin Email + Password against database / permanent Super Admin credentials.
 * If credentials match, generates a 6-digit OTP and emails it to the admin.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  getActiveOtpChallenge,
  invalidatePreviousChallenges,
} from "@/lib/otp-store";
import { verifyAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OTP_SECRET_KEY =
  process.env.OTP_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  "awenue_otp_secret_change_in_production";

const OTP_TTL_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let password = "";

    try {
      const body = await request.json();
      email = typeof body.email === "string" ? body.email : "";
      password = typeof body.password === "string" ? body.password : "";
    } catch {
      return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid admin email address." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Please enter your admin password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify Admin Email & Password
    const authResult = await verifyAdminPassword(normalizedEmail, password);

    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json(
        { error: "Invalid admin email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const admin = authResult.admin;

    // 2. Resend Cooldown Check (60 seconds)
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

    // 3. Invalidate Previous Challenges
    try {
      await invalidatePreviousChallenges(normalizedEmail);
    } catch (err) {
      console.warn("[OTP REQUEST] Invalidation warning:", err);
    }

    // 4. Generate Cryptographically Secure 6-Digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 5. Create Stateless HMAC Challenge Token
    const expiresAtMs = Date.now() + OTP_TTL_MS;
    const hmacPayload = `${normalizedEmail}:${rawOtp}:${expiresAtMs}`;
    const hmacSignature = crypto
      .createHmac("sha256", OTP_SECRET_KEY)
      .update(hmacPayload)
      .digest("hex");
    const challengeToken = `${hmacSignature}.${expiresAtMs}`;

    // 6. Store Hashed OTP Challenge
    try {
      await createOtpChallenge(admin.id, normalizedEmail, rawOtp);
    } catch (err) {
      console.warn("[OTP REQUEST] Challenge store warning:", err);
    }

    // 7. Send OTP Email via Nodemailer
    const emailResult = await sendAdminOtpEmail(normalizedEmail, rawOtp);
    if (!emailResult.success) {
      console.error("[OTP REQUEST] Email delivery notice:", emailResult.error);
      return NextResponse.json(
        {
          error: `Failed to send verification code email (${emailResult.error || "SMTP issue"}). Please try again or check email settings.`,
        },
        { status: 400 }
      );
    }

    const messageSent = `Verification code sent to ${normalizedEmail}.`;
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
    console.error("[OTP REQUEST] Exception:", msg);
    return NextResponse.json(
      { error: `Login request failed: ${msg}` },
      { status: 400 }
    );
  }
}
