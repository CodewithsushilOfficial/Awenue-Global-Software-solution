import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  getActiveOtpChallenge,
  invalidatePreviousChallenges,
} from "@/lib/otp-store";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper function to check if email is an authorized admin
async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check against environment configured admin emails
  const envAdminEmail = (process.env.ADMIN_EMAIL || "Codewithsushil7236@gmail.com").toLowerCase();
  const publicAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

  if (normalizedEmail === envAdminEmail || (publicAdminEmail && normalizedEmail === publicAdminEmail)) {
    return true;
  }

  // 2. Check Firestore 'admins' collection
  try {
    const snap = await adminDb
      .collection("admins")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();
    return !snap.empty;
  } catch (err) {
    console.warn("Firestore admin check skipped, falling back to ENV authorization:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = NextResponse.json(
      {
        success: true,
        message: "If this email is authorized, a verification code has been sent.",
        email: normalizedEmail,
      },
      { status: 200 }
    );

    // 1. Verify if email is authorized for Admin access
    const isAuthorized = await isAuthorizedAdminEmail(normalizedEmail);
    if (!isAuthorized) {
      return genericResponse;
    }

    // 2. Check server 60-second cooldown
    const existingChallenge = await getActiveOtpChallenge(normalizedEmail);
    if (existingChallenge) {
      const elapsedMs = Date.now() - new Date(existingChallenge.createdAt).getTime();
      if (elapsedMs < 60 * 1000) {
        const remainingSecs = Math.ceil((60 * 1000 - elapsedMs) / 1000);
        return NextResponse.json(
          { error: `A code was recently requested. Please wait ${remainingSecs} seconds.` },
          { status: 429 }
        );
      }
    }

    // 3. Invalidate previous active OTP challenges for this email
    await invalidatePreviousChallenges(normalizedEmail);

    // 4. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    console.log(`[OTP ENGINE] Generated 6-digit OTP for ${normalizedEmail}: ${rawOtp}`);

    // 5. Store OTP challenge in Hybrid Store (Memory + Firestore)
    await createOtpChallenge(normalizedEmail, rawOtp);

    // 6. Send OTP via Nodemailer
    const emailResult = await sendAdminOtpEmail(normalizedEmail, rawOtp);
    if (!emailResult.success) {
      console.error("[OTP ENGINE] Failed to deliver Admin OTP email via Nodemailer:", emailResult.error);
    }

    return genericResponse;
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/otp/request error:", errorDetails);
    return NextResponse.json(
      { error: errorDetails || "An error occurred while generating verification code." },
      { status: 500 }
    );
  }
}
