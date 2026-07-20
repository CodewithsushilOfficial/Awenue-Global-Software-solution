import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveOtpChallenge, updateOtpChallengeState } from "@/lib/otp-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let otpCode = "";
    try {
      const body = await request.json();
      email = body.email || "";
      otpCode = body.otpCode || body.otp || "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!email || !otpCode || otpCode.trim().length !== 6) {
      return NextResponse.json({ error: "Please enter the 6-digit OTP code sent to your email." }, { status: 400 });
    }

    const targetEmail = (process.env.ADMIN_EMAIL || email).toLowerCase();
    const cleanOtp = otpCode.trim();

    // 1. Try global memory store first
    let verifiedInStore = false;
    try {
      const activeChallenge = await getActiveOtpChallenge(targetEmail);
      if (activeChallenge && !activeChallenge.used) {
        const inputHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
        if (inputHash === activeChallenge.otpHash && new Date(activeChallenge.expiresAt) > new Date()) {
          verifiedInStore = true;
          await updateOtpChallengeState(targetEmail, { used: true });
        }
      }
    } catch (storeErr) {
      console.warn("Memory store verify notice:", storeErr);
    }

    // 2. Try Firestore fallback if not verified in memory store
    if (!verifiedInStore) {
      try {
        if (adminDb) {
          const snap = await adminDb
            .collection("adminOtps")
            .where("email", "==", targetEmail)
            .where("verified", "==", false)
            .where("otpCode", "==", cleanOtp)
            .get();

          if (!snap.empty) {
            let validDocRef: FirebaseFirestore.DocumentReference | null = null;
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              if (new Date(data.expiresAt) > new Date()) {
                validDocRef = docSnap.ref;
              }
            });

            if (validDocRef) {
              verifiedInStore = true;
              await (validDocRef as FirebaseFirestore.DocumentReference).update({
                verified: true,
                verifiedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn("Firestore verify notice:", dbErr);
      }
    }

    if (!verifiedInStore) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code. Please check your email or request a new OTP." },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        verified: true,
        message: "2FA OTP verified successfully.",
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "awenue_admin_session",
      value: `verified_${Date.now()}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: unknown) {
    console.error("API /api/admin/verify-otp error:", err);
    return NextResponse.json(
      { error: "Failed to verify 2FA OTP code. Please try again." },
      { status: 400 }
    );
  }
}
