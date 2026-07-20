/**
 * POST /api/admin/invite/accept
 *
 * Accept an admin invitation and activate the admin account.
 *
 * Flow:
 * 1. Receive token + invitationId from invitation link
 * 2. Hash token and compare with stored tokenHash
 * 3. Check invitation status === "pending" and not expired
 * 4. Create Firebase Auth user (or link existing)
 * 5. Set custom claims via Admin SDK
 * 6. Create active admin record in Firestore
 * 7. Mark invitation as accepted + invalidate token
 * 8. Log activity
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { logAdminActivity } from "@/lib/admin-auth";
import { isValidRole, type AdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let token = "";
  let invitationId = "";

  try {
    const body = await request.json();
    token = typeof body.token === "string" ? body.token.trim() : "";
    invitationId = typeof body.invitationId === "string" ? body.invitationId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!token || !invitationId) {
    return NextResponse.json(
      { error: "Invitation token and invitation ID are required." },
      { status: 400 }
    );
  }

  // Hash the provided token to compare against stored hash
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    // Fetch invitation document
    const invDoc = await db.collection("adminInvitations").doc(invitationId).get();

    if (!invDoc.exists) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link." },
        { status: 404 }
      );
    }

    const inv = invDoc.data()!;

    // Check status
    if (inv.status !== "pending") {
      const statusMessages: Record<string, string> = {
        accepted: "This invitation has already been accepted. Please log in at /admin/login.",
        revoked: "This invitation has been cancelled. Please contact a Super Admin.",
        expired: "This invitation has expired. Please contact a Super Admin to resend.",
      };
      return NextResponse.json(
        { error: statusMessages[inv.status] || "This invitation is no longer valid." },
        { status: 410 }
      );
    }

    // Check expiry
    if (new Date(inv.expiresAt) < new Date()) {
      // Mark as expired
      await invDoc.ref.update({ status: "expired" }).catch(() => {});
      return NextResponse.json(
        { error: "This invitation has expired. Please contact a Super Admin to resend." },
        { status: 410 }
      );
    }

    // Timing-safe token hash comparison
    const storedHashBuf = Buffer.from(inv.tokenHash, "hex");
    const providedHashBuf = Buffer.from(tokenHash, "hex");

    if (
      storedHashBuf.length !== providedHashBuf.length ||
      !crypto.timingSafeEqual(storedHashBuf, providedHashBuf)
    ) {
      return NextResponse.json(
        { error: "Invalid invitation link. Please use the exact link from your email." },
        { status: 403 }
      );
    }

    const normalizedEmail = inv.emailNormalized || inv.email?.toLowerCase();
    const displayName = inv.displayName || "Administrator";
    const role = isValidRole(inv.role) ? (inv.role as AdminRole) : "admin";
    const now = new Date().toISOString();

    // Check if admin record already exists
    const existingAdmin = await db
      .collection("admins")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      // Admin already activated — mark invitation accepted and return success
      await invDoc.ref.update({ status: "accepted", acceptedAt: now }).catch(() => {});
      return NextResponse.json(
        {
          success: true,
          message: "Your account is already active. Please log in at /admin/login.",
          alreadyActivated: true,
        },
        { status: 200 }
      );
    }

    // Create or get Firebase Auth user
    let uid: string | null = null;
    try {
      const auth = getAdminAuth();
      if (auth) {
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(normalizedEmail);
        } catch {
          // User doesn't exist — create them
          userRecord = await auth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            displayName,
          });
        }
        uid = userRecord.uid;

        // Set custom claims via Admin SDK only
        await auth.setCustomUserClaims(uid, {
          admin: true,
          role,
        });
      }
    } catch (authErr) {
      console.error("[ACCEPT INVITE] Firebase Auth setup error:", authErr);
      // Non-fatal — admin record can exist without Firebase Auth UID
    }

    // Create active admin record
    const adminDocId = uid
      ? `admin_${uid.substring(0, 12)}`
      : `admin_${crypto.createHash("md5").update(normalizedEmail).digest("hex").substring(0, 12)}`;

    await db.collection("admins").doc(adminDocId).set({
      uid: uid || null,
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      displayName,
      role,
      status: "active",
      invitedBy: inv.invitedBy || "Super Admin",
      invitedByAdminId: inv.invitedByAdminId || null,
      invitedAt: inv.createdAt || now,
      activatedAt: now,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Mark invitation as accepted — invalidates the token
    await invDoc.ref.update({
      status: "accepted",
      acceptedAt: now,
      activatedAdminId: adminDocId,
    });

    // Audit log
    await logAdminActivity({
      actorAdminId: adminDocId,
      targetAdminId: inv.invitedByAdminId || undefined,
      action: "ADMIN_ACTIVATED",
      metadata: {
        email: normalizedEmail,
        role,
        invitationId,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message:
          "Your admin account has been activated! You can now log in at /admin/login using email OTP.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ACCEPT INVITE] Error:", err);
    return NextResponse.json(
      { error: "Failed to process invitation. Please try again or contact a Super Admin." },
      { status: 500 }
    );
  }
}
