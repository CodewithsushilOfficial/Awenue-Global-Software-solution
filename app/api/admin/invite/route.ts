import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { sendAdminInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: Retrieve list of all authorized admins
export async function GET() {
  try {
    const adminDocs: Array<{
      id: string;
      email: string;
      fullName?: string;
      role?: string;
      status: string;
      createdAt: string;
      invitedBy?: string;
    }> = [];

    // Include primary environment admin
    const defaultAdminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      "Codewithsushil7236@gmail.com"
    ).toLowerCase();

    adminDocs.push({
      id: "super_admin_primary",
      email: defaultAdminEmail,
      fullName: "Primary Super Administrator",
      role: "Super Admin",
      status: "active",
      createdAt: new Date(2026, 0, 1).toISOString(),
      invitedBy: "System Root",
    });

    try {
      const db = getAdminDb();
      if (db) {
        const snap = await db.collection("admins").get();
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.email && data.email.toLowerCase() !== defaultAdminEmail) {
            adminDocs.push({
              id: doc.id,
              email: data.email,
              fullName: data.fullName || "Administrator",
              role: data.role || "Administrator",
              status: data.status || "active",
              createdAt: data.createdAt || new Date().toISOString(),
              invitedBy: data.invitedBy || "Admin",
            });
          }
        });
      }
    } catch (dbErr) {
      console.warn("Firestore fetch admins notice:", dbErr);
    }

    return NextResponse.json({ success: true, admins: adminDocs }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load admins.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Invite a new Admin
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request payload." }, { status: 400 });
    }

    const { email, fullName, role, invitedBy } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid admin email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanFullName = fullName ? String(fullName).trim() : "Administrator";
    const cleanRole = role ? String(role).trim() : "Administrator";
    const nowISO = new Date().toISOString();
    const adminDocId = "admin_" + crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 12);

    let isAlreadyRegistered = false;

    // Save to Firestore 'admins' collection safely
    try {
      const db = getAdminDb();
      if (db) {
        const existingSnap = await db
          .collection("admins")
          .where("email", "==", normalizedEmail)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          isAlreadyRegistered = true;
        } else {
          await db.collection("admins").doc(adminDocId).set({
            email: normalizedEmail,
            fullName: cleanFullName,
            role: cleanRole,
            status: "active",
            createdAt: nowISO,
            invitedBy: invitedBy || "Super Admin",
          });
        }
      }
    } catch (dbErr) {
      console.warn("[ADMIN INVITE] Firestore admin save notice:", dbErr);
    }

    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: `An administrator with email ${normalizedEmail} is already registered.` },
        { status: 400 }
      );
    }

    // Set Firebase Auth custom claims if available
    try {
      const auth = getAdminAuth();
      if (auth) {
        let userUid = adminDocId;
        try {
          const userRecord = await auth.getUserByEmail(normalizedEmail);
          userUid = userRecord.uid;
        } catch {
          const newUser = await auth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            displayName: cleanFullName,
          });
          userUid = newUser.uid;
        }
        await auth.setCustomUserClaims(userUid, { role: "admin", admin: true });
      }
    } catch (authErr) {
      console.warn("[ADMIN INVITE] Firebase Admin Auth setup notice:", authErr);
    }

    // Send Admin Invitation Email via Nodemailer
    let emailResult = { success: true };
    try {
      emailResult = await sendAdminInviteEmail({
        recipientEmail: normalizedEmail,
        fullName: cleanFullName,
        role: cleanRole,
        invitedByName: invitedBy || "Super Administrator",
      });
    } catch (emailErr) {
      console.warn("[ADMIN INVITE] Nodemailer error notice:", emailErr);
    }

    // Audit log entry
    try {
      const db = getAdminDb();
      if (db) {
        await db.collection("adminAuditLogs").add({
          type: "ADMIN_INVITED",
          invitedEmail: normalizedEmail,
          fullName: cleanFullName,
          role: cleanRole,
          invitedBy: invitedBy || "Super Admin",
          createdAt: nowISO,
        });
      }
    } catch (auditErr) {
      console.warn("[ADMIN INVITE] Audit log failed:", auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Admin invitation sent to ${normalizedEmail} successfully!`,
        emailSent: emailResult.success,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to invite admin.";
    console.error("API /api/admin/invite error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE: Revoke Admin Privileges
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json({ error: "Missing admin ID or email parameter." }, { status: 400 });
    }

    const db = getAdminDb();
    let docId = id;

    if (db) {
      if (!docId && email) {
        const snap = await db
          .collection("admins")
          .where("email", "==", email.toLowerCase().trim())
          .limit(1)
          .get();
        if (!snap.empty) {
          docId = snap.docs[0].id;
        }
      }

      if (docId) {
        await db.collection("admins").doc(docId).delete();
      }
    }

    return NextResponse.json(
      { success: true, message: "Admin access revoked successfully." },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke admin access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
