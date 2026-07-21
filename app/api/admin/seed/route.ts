import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, ensureServerSignedIn } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "Codewithsushil7236@gmail.com").toLowerCase();
    const body = await request.json().catch(() => ({}));
    const password = body.password || "Sushil@7236";

    // Attempt to sign in fallback client if user exists
    await ensureServerSignedIn().catch(() => {});

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail);
      if (password) {
        userRecord = await adminAuth.updateUser(userRecord.uid, {
          password,
          emailVerified: true,
          displayName: "AWENUE Administrator",
        });
      }
    } catch {
      userRecord = await adminAuth.createUser({
        email: adminEmail,
        password,
        emailVerified: true,
        displayName: "AWENUE Administrator",
      });
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin", admin: true });

    // Sync to Firestore 'admins' collection
    await adminDb.collection("admins").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: adminEmail,
        role: "admin",
        displayName: "AWENUE Administrator",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Admin account provisioned successfully in Firebase Auth & Firestore for ${adminEmail}`,
        uid: userRecord.uid,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error("API /api/admin/seed error:", errorDetails);
    return NextResponse.json({ error: errorDetails || "Failed to seed admin user." }, { status: 500 });
  }
}

