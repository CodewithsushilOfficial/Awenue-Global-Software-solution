import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminOtpEmail } from "@/lib/email";
import {
  createOtpChallenge,
  getActiveOtpChallenge,
  invalidatePreviousChallenges,
} from "@/lib/otp-store";

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

  // 2. Check Firestore 'admins' collection safely
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection("admins")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
      return !snap.empty;
    }
  } catch (err) {
    console.warn("Firestore admin check skipped, falling back to ENV authorization:", err);
  }

  return false;
}

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
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify if email is authorized for Admin access
    let isAuthorized = false;
    try {
      isAuthorized = await isAuthorizedAdminEmail(normalizedEmail);
    } catch (authErr) {
      console.warn("Admin authorization check notice:", authErr);
      isAuthorized = normalizedEmail === (process.env.ADMIN_EMAIL || "Codewithsushil7236@gmail.com").toLowerCase();
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: true,
          message: "If this email is authorized, a verification code has been sent.",
          email: normalizedEmail,
        },
        { status: 200 }
      );
    }

    // 2. Check server 60-second cooldown (safely)
    try {
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
    } catch (cooldownErr) {
      console.warn("Cooldown check skipped:", cooldownErr);
    }

    // 3. Invalidate previous active OTP challenges for this email (safely)
    try {
      await invalidatePreviousChallenges(normalizedEmail);
    } catch (invalErr) {
      console.warn("Challenge invalidation notice:", invalErr);
    }

    // 4. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    console.log(`[OTP ENGINE] Generated 6-digit OTP for ${normalizedEmail}: ${rawOtp}`);

    // 5. Store OTP challenge in Hybrid Store (Memory + Firestore safely)
    try {
      await createOtpChallenge(normalizedEmail, rawOtp);
    } catch (storeErr) {
      console.warn("OTP Challenge store notice:", storeErr);
    }

    // 6. Send OTP via Nodemailer
    let emailStatusMessage = "A 6-digit verification code has been sent to your email.";
    try {
      const emailResult = await sendAdminOtpEmail(normalizedEmail, rawOtp);
      if (!emailResult.success) {
        console.error("[OTP ENGINE] Nodemailer delivery notice:", emailResult.error);
        if (process.env.NODE_ENV !== "production") {
          emailStatusMessage = `Verification code: ${rawOtp} (Email delivery notice: ${emailResult.error || "SMTP not configured"})`;
        }
      }
    } catch (mailErr) {
      console.error("[OTP ENGINE] Email send exception:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: emailStatusMessage,
        email: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/otp/request error:", errorDetails);
    return NextResponse.json(
      { error: errorDetails || "An error occurred while generating verification code." },
      { status: 400 }
    );
  }
}
