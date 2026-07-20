/**
 * Admin Invite API
 *
 * GET  /api/admin/invite — List all admins + pending invitations (requires session)
 * POST /api/admin/invite — Send a new admin invitation (requires super_admin)
 * PATCH /api/admin/invite — Manage admin status: change_role / suspend / reactivate / revoke
 * DELETE /api/admin/invite — Cancel a pending invitation
 *
 * Security:
 * - All operations require a valid server-side session
 * - Invite/role-change/suspend/revoke require super_admin role
 * - Lower roles cannot escalate privileges or modify super_admin accounts
 * - Only hashed invitation tokens are stored
 * - New admins start as "pending" — NOT "active"
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminFromRequest, logAdminActivity } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendAdminInviteEmail } from "@/lib/email";
import {
  hasPermission,
  canAssignRole,
  isValidRole,
  ROLE_LABELS,
  PROTECTED_ROLES,
  type AdminRole,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Invitation validity: 48 hours
const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// GET: List all admins + pending invitations
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "manage_admins")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    // Fetch all admin records
    const adminsSnap = await db.collection("admins").get();
    const admins = adminsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        uid: d.uid || null,
        email: d.email || d.emailNormalized || "",
        displayName: d.displayName || d.fullName || "Administrator",
        role: d.role || "admin",
        status: d.status || "active",
        invitedBy: d.invitedBy || null,
        invitedAt: d.invitedAt || d.createdAt || null,
        activatedAt: d.activatedAt || null,
        lastLoginAt: d.lastLoginAt || null,
        createdAt: d.createdAt || null,
      };
    });

    // Fetch pending invitations
    const invitationsSnap = await db
      .collection("adminInvitations")
      .where("status", "==", "pending")
      .get();

    const pendingInvitations = invitationsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        email: d.email || d.emailNormalized || "",
        displayName: d.displayName || "",
        role: d.role || "admin",
        status: d.status,
        invitedBy: d.invitedBy || null,
        invitedByAdminId: d.invitedByAdminId || null,
        createdAt: d.createdAt || null,
        expiresAt: d.expiresAt || null,
      };
    });

    return NextResponse.json(
      { success: true, admins, pendingInvitations },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE GET] Error:", err);
    return NextResponse.json({ error: "Failed to load admin data." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Send a new admin invitation
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "invite_admins")) {
    return NextResponse.json(
      { error: "Only Super Admins can invite new administrators." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, displayName, role } = body;

  // Validate required fields
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  // Validate role against server-side allowlist
  const normalizedRole = typeof role === "string" ? role.trim() : "";
  if (!isValidRole(normalizedRole)) {
    return NextResponse.json(
      { error: "Invalid role specified. Allowed: admin, content_admin, support_admin." },
      { status: 400 }
    );
  }

  // Prevent inviting super_admin through this endpoint
  if (normalizedRole === "super_admin") {
    return NextResponse.json(
      { error: "Super Admin accounts cannot be created through the invite system." },
      { status: 403 }
    );
  }

  // Verify actor can assign this role
  if (!canAssignRole(actor.role, normalizedRole as AdminRole)) {
    return NextResponse.json(
      { error: `Your role cannot assign the "${ROLE_LABELS[normalizedRole as AdminRole]}" role.` },
      { status: 403 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    // Check for existing active admin
    const existingAdmin = await db
      .collection("admins")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      return NextResponse.json(
        { error: "An admin with this email address already exists." },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .collection("adminInvitations")
      .where("emailNormalized", "==", normalizedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingInvitation.empty) {
      return NextResponse.json(
        {
          error: "A pending invitation already exists for this email. Use 'Resend Invitation' to send a new link.",
        },
        { status: 409 }
      );
    }

    // Generate cryptographically secure invitation token
    const rawToken = crypto.randomBytes(48).toString("hex");
    // Store only the hash
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();

    // Create pending invitation — status is "pending", NOT "active"
    const invitationRef = await db.collection("adminInvitations").add({
      emailNormalized: normalizedEmail,
      email: normalizedEmail,
      displayName: cleanName,
      role: normalizedRole,
      status: "pending",
      tokenHash,
      expiresAt,
      invitedBy: actor.displayName,
      invitedByAdminId: actor.id,
      createdAt: now,
      acceptedAt: null,
    });

    // Build the accept invitation URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    const inviteUrl = `${baseUrl}/admin/invite/accept?token=${rawToken}&invitation=${invitationRef.id}`;

    // Send invitation email via Nodemailer
    let emailSent = false;
    try {
      const emailResult = await sendAdminInviteEmail({
        recipientEmail: normalizedEmail,
        fullName: cleanName,
        role: ROLE_LABELS[normalizedRole as AdminRole],
        invitedByName: actor.displayName,
        inviteUrl,
      });
      emailSent = emailResult.success;
      if (!emailResult.success) {
        console.error("[INVITE POST] Email send failed:", emailResult.error);
      }
    } catch (mailErr) {
      console.error("[INVITE POST] Nodemailer exception:", mailErr);
    }

    // Audit log
    await logAdminActivity({
      actorAdminId: actor.id,
      action: "ADMIN_INVITED",
      metadata: {
        invitedEmail: normalizedEmail,
        invitedName: cleanName,
        role: normalizedRole,
        invitationId: invitationRef.id,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${normalizedEmail}.`,
        emailSent,
        invitationId: invitationRef.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[INVITE POST] Error:", err);
    return NextResponse.json({ error: "Failed to send invitation." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH: Manage admin — change role, suspend, reactivate, revoke
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "manage_admins")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { targetAdminId, action, newRole } = body;

  if (typeof targetAdminId !== "string" || !targetAdminId) {
    return NextResponse.json({ error: "targetAdminId is required." }, { status: 400 });
  }

  const allowedActions = ["change_role", "suspend", "reactivate", "revoke"];
  if (typeof action !== "string" || !allowedActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${allowedActions.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const targetDoc = await db.collection("admins").doc(targetAdminId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    const targetData = targetDoc.data()!;
    const targetRole = targetData.role as AdminRole;

    // Prevent modifying self (suspension/revocation)
    if (targetAdminId === actor.id && (action === "suspend" || action === "revoke")) {
      return NextResponse.json(
        { error: "You cannot suspend or revoke your own account." },
        { status: 403 }
      );
    }

    // Protect super_admin accounts from being modified by non-super-admins
    if (PROTECTED_ROLES.includes(targetRole) && actor.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only Super Admins can manage Super Admin accounts." },
        { status: 403 }
      );
    }

    // Guard: prevent removing last active super_admin
    if (targetRole === "super_admin" && (action === "revoke" || action === "suspend")) {
      const activeSuperAdmins = await db
        .collection("admins")
        .where("role", "==", "super_admin")
        .where("status", "==", "active")
        .get();

      if (activeSuperAdmins.size <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last active Super Admin. Promote another admin first." },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt: now };
    let logAction = "";

    switch (action) {
      case "change_role": {
        if (!isValidRole(normalizedRoleStr(newRole))) {
          return NextResponse.json({ error: "Invalid role." }, { status: 400 });
        }
        const roleStr = normalizedRoleStr(newRole) as AdminRole;
        if (roleStr === "super_admin" && actor.role !== "super_admin") {
          return NextResponse.json(
            { error: "Only Super Admins can promote others to Super Admin." },
            { status: 403 }
          );
        }
        updateData.role = roleStr;
        logAction = "ADMIN_ROLE_CHANGED";
        break;
      }
      case "suspend":
        updateData.status = "suspended";
        logAction = "ADMIN_SUSPENDED";
        break;
      case "reactivate":
        updateData.status = "active";
        logAction = "ADMIN_REACTIVATED";
        break;
      case "revoke":
        updateData.status = "revoked";
        logAction = "ADMIN_REVOKED";
        break;
    }

    await db.collection("admins").doc(targetAdminId).update(updateData);

    // If suspended/revoked, attempt to revoke Firebase Auth refresh tokens
    if (action === "suspend" || action === "revoke") {
      try {
        const { getAdminAuth } = await import("@/lib/firebase-admin");
        const auth = getAdminAuth();
        if (auth && targetData.uid) {
          await auth.revokeRefreshTokens(targetData.uid);
        }
      } catch (authErr) {
        console.warn("[INVITE PATCH] Firebase refresh token revocation:", authErr);
      }
    }

    await logAdminActivity({
      actorAdminId: actor.id,
      targetAdminId,
      action: logAction,
      metadata: {
        targetEmail: targetData.email || targetData.emailNormalized || "",
        ...(action === "change_role" && { newRole: normalizedRoleStr(newRole) }),
      },
    }).catch(() => {});

    return NextResponse.json(
      { success: true, message: "Admin updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE PATCH] Error:", err);
    return NextResponse.json({ error: "Failed to update admin." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Cancel a pending invitation
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "invite_admins")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const invDoc = await db.collection("adminInvitations").doc(invitationId).get();
    if (!invDoc.exists) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const invData = invDoc.data()!;
    if (invData.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending invitations can be cancelled." },
        { status: 400 }
      );
    }

    await invDoc.ref.update({
      status: "revoked",
      revokedAt: new Date().toISOString(),
      revokedByAdminId: actor.id,
    });

    await logAdminActivity({
      actorAdminId: actor.id,
      action: "INVITATION_REVOKED",
      metadata: { invitationId, email: invData.emailNormalized || invData.email || "" },
    }).catch(() => {});

    return NextResponse.json(
      { success: true, message: "Invitation cancelled successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to cancel invitation." }, { status: 500 });
  }
}

function normalizedRoleStr(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}
