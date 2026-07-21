import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, ensureServerSignedIn } from "@/lib/firebase-admin";
import { getAdminFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize Admin session
    const admin = await getAdminFromRequest(request);
    if (!admin || admin.status !== "active") {
      return NextResponse.json(
        { error: "Unauthorized. Valid active admin session is required." },
        { status: 401 }
      );
    }

    await ensureServerSignedIn().catch(() => {});

    // 2. Fetch users from Firestore 'users' collection
    const usersSnap = await adminDb.collection("users").get();
    const usersMap = new Map<string, Record<string, unknown>>();

    usersSnap.forEach((docSnap) => {
      usersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });

    // 3. Fetch users from Firebase Auth listUsers
    let authUsers: Record<string, unknown>[] = [];
    try {
      const listUsersResult = await adminAuth.listUsers(100);
      authUsers = listUsersResult.users.map((userRecord) => {
        const existingDoc = usersMap.get(userRecord.uid);
        return {
          id: userRecord.uid,
          uid: userRecord.uid,
          email: userRecord.email || existingDoc?.email || "No Email",
          fullName: userRecord.displayName || existingDoc?.fullName || "User Account",
          phone: userRecord.phoneNumber || existingDoc?.phone || null,
          disabled: userRecord.disabled || false,
          status: userRecord.disabled ? "disabled" : "active",
          createdAt:
            userRecord.metadata.creationTime || existingDoc?.createdAt || new Date().toISOString(),
          lastLogin: userRecord.metadata.lastSignInTime || null,
        };
      });
    } catch (authErr) {
      console.warn("Notice: Auth user listing fallback to Firestore records:", authErr);
      authUsers = Array.from(usersMap.values()).map((userDoc) => ({
        id: userDoc.id,
        uid: userDoc.id,
        email: userDoc.email || "No Email",
        fullName: userDoc.fullName || "Registered User",
        phone: userDoc.phone || null,
        disabled: userDoc.disabled || false,
        status: userDoc.disabled ? "disabled" : "active",
        createdAt: userDoc.createdAt || new Date().toISOString(),
        lastLogin: userDoc.lastLogin || null,
      }));
    }

    return NextResponse.json({ success: true, users: authUsers }, { status: 200 });
  } catch (err: unknown) {
    console.error("API /api/admin/users GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch registered users." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize Admin session
    const admin = await getAdminFromRequest(request);
    if (!admin || admin.status !== "active") {
      return NextResponse.json(
        { error: "Unauthorized. Valid active admin session is required." },
        { status: 401 }
      );
    }

    await ensureServerSignedIn().catch(() => {});

    const body = await request.json();
    const { uid, disabled } = body;

    if (!uid) {
      return NextResponse.json({ error: "User ID (uid) is required." }, { status: 400 });
    }

    // 2. Update status in Firebase Auth via Admin SDK / Shim
    try {
      await adminAuth.updateUser(uid, { disabled: Boolean(disabled) });
    } catch (authErr) {
      console.warn("Notice: Auth user state update:", authErr);
    }

    // 3. Update status in Firestore 'users' collection
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const newStatus = disabled ? "disabled" : "active";

    if (userSnap.exists) {
      await userRef.update({
        disabled: Boolean(disabled),
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await userRef.set({
        disabled: Boolean(disabled),
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `User account has been ${disabled ? "disabled" : "enabled"}.`,
        uid,
        disabled: Boolean(disabled),
        status: newStatus,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API /api/admin/users POST error:", err);
    return NextResponse.json(
      { error: "Failed to update user account status." },
      { status: 500 }
    );
  }
}
