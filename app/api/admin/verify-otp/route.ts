import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode } = body;

    if (!email || !otpCode || otpCode.trim().length !== 6) {
      return NextResponse.json({ error: "Please enter the 6-digit OTP code sent to your email." }, { status: 400 });
    }

    const targetEmail = (process.env.ADMIN_EMAIL || email).toLowerCase();
    const cleanOtp = otpCode.trim();
    const nowISO = new Date().toISOString();

    // Query unverified OTP records for target email
    const snap = await adminDb
      .collection("adminOtps")
      .where("email", "==", targetEmail)
      .where("verified", "==", false)
      .where("otpCode", "==", cleanOtp)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please check your Gmail or request a new OTP." },
        { status: 400 }
      );
    }

    // Check expiration on matching record
    let validDocRef: FirebaseFirestore.DocumentReference | null = null;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (new Date(data.expiresAt) > new Date()) {
        validDocRef = docSnap.ref;
      }
    });

    if (!validDocRef) {
      return NextResponse.json(
        { error: "OTP code has expired (valid for 5 minutes). Please click 'Resend OTP'." },
        { status: 400 }
      );
    }

    // Mark OTP record as verified
    await (validDocRef as FirebaseFirestore.DocumentReference).update({
      verified: true,
      verifiedAt: nowISO,
    });

    return NextResponse.json(
      {
        success: true,
        verified: true,
        message: "2FA OTP verified successfully.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API /api/admin/verify-otp error:", err);
    return NextResponse.json(
      { error: "Failed to verify 2FA OTP code. Please try again." },
      { status: 500 }
    );
  }
}
