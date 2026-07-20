import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid admin email is required." }, { status: 400 });
    }

    const targetEmail = (process.env.ADMIN_EMAIL || email).toLowerCase();

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiration

    // Store in Firestore 'adminOtps' collection
    await adminDb.collection("adminOtps").add({
      email: targetEmail,
      otpCode,
      expiresAt,
      verified: false,
      createdAt: new Date().toISOString(),
    });

    // Send email via Nodemailer
    const emailResult = await sendAdminOtpEmail(targetEmail, otpCode);

    if (!emailResult.success) {
      console.warn("OTP email failed to send, but OTP record was saved for verification.");
    }

    return NextResponse.json(
      {
        success: true,
        message: `OTP verification code has been sent to ${targetEmail}`,
        email: targetEmail,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API /api/admin/send-otp error:", err);
    return NextResponse.json(
      { error: "Failed to generate or send 2FA OTP code. Please try again." },
      { status: 500 }
    );
  }
}
