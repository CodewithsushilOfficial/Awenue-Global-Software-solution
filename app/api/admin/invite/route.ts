/**
 * Admin Invite & Pre-Authorization API
 *
 * GET  /api/admin/invite — List all admins + pending pre-authorizations (or verify ?token=...)
 * POST /api/admin/invite — Pre-authorize new Google Admin Email & send SMTP invitation
 * PATCH /api/admin/invite — Manage admin: change_role / edit_permissions / suspend / reactivate / revoke / resend_email
 * DELETE /api/admin/invite — Cancel/Revoke a pending pre-authorization
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminFromRequest, logAdminActivity } from "@/lib/admin-auth";
import { getAdminDb, isAdminCertAvailable } from "@/lib/firebase-admin";
import { saveToFirestoreCollection } from "@/lib/firestore-saver";
import { sendAdminInvitationEmail } from "@/lib/email-service";
import { db as clientDb } from "@/lib/firebase";
import { collection as clientCollection, getDocs, query, where, limit, doc as clientDoc, updateDoc as clientUpdateDoc } from "firebase/firestore";
import {
  hasPermission,
  canAssignRole,
  isValidRole,
  ROLE_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
  type AdminRole,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper: Hash single-use token
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: List all admins + pending invitations OR verify invitation token
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Public endpoint for Token Verification during Email Acceptance Flow
  if (token) {
    const hashed = hashToken(token);
    let foundDoc: Record<string, unknown> | null = null;

    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          const snap = await db.collection("adminInvitations").where("tokenHash", "==", hashed).limit(1).get();
          if (!snap.empty) foundDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } catch (err) {
        console.warn("[INVITE GET TOKEN] Admin SDK notice:", err);
      }
    }

    if (!foundDoc) {
      try {
        const q = query(clientCollection(clientDb, "adminInvitations"), where("tokenHash", "==", hashed), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) foundDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
      } catch (clientErr) {
        console.warn("[INVITE GET TOKEN] Client SDK notice:", clientErr);
      }
    }

    if (!foundDoc) {
      return NextResponse.json({ error: "Invalid or expired invitation token." }, { status: 404 });
    }

    if (foundDoc.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation has already been ${foundDoc.status}.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: foundDoc.id,
        email: foundDoc.emailNormalized || foundDoc.email,
        displayName: foundDoc.displayName || foundDoc.fullName,
        role: foundDoc.role,
        roleLabel: ROLE_LABELS[(foundDoc.role as AdminRole) || "admin"] || foundDoc.role,
        invitedBy: foundDoc.invitedBy,
        createdAt: foundDoc.createdAt,
      },
    });
  }

  // Session-protected admin listing endpoint
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "manage_admins", actor.permissions)) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  try {
    const adminsList: Record<string, unknown>[] = [];
    const pendingList: Record<string, unknown>[] = [];

    let fetchedServer = false;
    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          const adminsSnap = await db.collection("admins").get();
          adminsSnap.docs.forEach((doc) => {
            const d = doc.data();
            const record = {
              id: doc.id,
              uid: d.uid || null,
              email: d.email || d.emailNormalized || "",
              displayName: d.displayName || d.fullName || "Administrator",
              role: d.role || "admin",
              permissions: Array.isArray(d.permissions) ? d.permissions : DEFAULT_ROLE_PERMISSIONS[(d.role as AdminRole) || "admin"] || [],
              status: d.status || "active",
              emailDeliveryStatus: d.emailDeliveryStatus || "none",
              invitedBy: d.invitedBy || null,
              invitedAt: d.invitedAt || d.createdAt || null,
              activatedAt: d.activatedAt || null,
              lastLoginAt: d.lastLoginAt || null,
              createdAt: d.createdAt || null,
            };
            if (record.status === "pending") {
              pendingList.push(record);
            }
            adminsList.push(record);
          });
          fetchedServer = true;
        }
      } catch (err) {
        console.warn("[INVITE GET] Admin SDK notice:", err);
      }
    }

    if (!fetchedServer) {
      try {
        const snap = await getDocs(clientCollection(clientDb, "admins"));
        snap.docs.forEach((doc) => {
          const d = doc.data();
          const record = {
            id: doc.id,
            uid: d.uid || null,
            email: d.email || d.emailNormalized || "",
            displayName: d.displayName || d.fullName || "Administrator",
            role: d.role || "admin",
            permissions: Array.isArray(d.permissions) ? d.permissions : DEFAULT_ROLE_PERMISSIONS[(d.role as AdminRole) || "admin"] || [],
            status: d.status || "active",
            emailDeliveryStatus: d.emailDeliveryStatus || "none",
            invitedBy: d.invitedBy || null,
            invitedAt: d.invitedAt || d.createdAt || null,
            activatedAt: d.activatedAt || null,
            lastLoginAt: d.lastLoginAt || null,
            createdAt: d.createdAt || null,
          };
          if (record.status === "pending") {
            pendingList.push(record);
          }
          adminsList.push(record);
        });
      } catch (clientErr) {
        console.warn("[INVITE GET] Client SDK notice:", clientErr);
      }
    }

    return NextResponse.json(
      { success: true, admins: adminsList, pendingInvitations: pendingList },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE GET] Error:", err);
    return NextResponse.json({ error: "Failed to load admin data." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Pre-authorize Google Admin Email + Dispatch SMTP Email
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "invite_admins", actor.permissions) && actor.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only Super Admins can pre-authorize new administrators." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, displayName, role, permissions } = body;

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid Google email address is required." }, { status: 400 });
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const normalizedRole = typeof role === "string" ? role.trim() : "admin";
  if (!isValidRole(normalizedRole)) {
    return NextResponse.json(
      { error: "Invalid role specified. Allowed: admin, content_admin, support_admin." },
      { status: 400 }
    );
  }

  if (normalizedRole === "super_admin") {
    return NextResponse.json(
      { error: "Super Admin accounts can only be created via server bootstrap." },
      { status: 403 }
    );
  }

  if (!canAssignRole(actor.role, normalizedRole as AdminRole)) {
    return NextResponse.json(
      { error: `Your role cannot assign the "${ROLE_LABELS[normalizedRole as AdminRole]}" role.` },
      { status: 403 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim();

  const assignedPermissions = Array.isArray(permissions) && permissions.length > 0
    ? permissions.filter((p): p is string => typeof p === "string")
    : DEFAULT_ROLE_PERMISSIONS[normalizedRole as AdminRole] || [];

  try {
    // 1. Duplicate check in admins collection
    let existingDoc: Record<string, unknown> | null = null;
    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          const snap = await db.collection("admins").where("emailNormalized", "==", normalizedEmail).limit(1).get();
          if (!snap.empty) existingDoc = snap.docs[0].data();
        }
      } catch (err) {
        console.warn("[INVITE POST] Check admin SDK notice:", err);
      }
    }

    if (!existingDoc) {
      try {
        const q = query(clientCollection(clientDb, "admins"), where("emailNormalized", "==", normalizedEmail), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) existingDoc = snap.docs[0].data();
      } catch (err) {
        console.warn("[INVITE POST] Check client SDK notice:", err);
      }
    }

    if (existingDoc) {
      const statusText = (existingDoc.status as string) || "active";
      if (statusText === "pending") {
        return NextResponse.json(
          { error: `This Google account (${normalizedEmail}) is already pending activation.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `This Google account (${normalizedEmail}) is already registered as an admin.` },
        { status: 409 }
      );
    }

    // 2. Generate secure token for email acceptance link
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

    const newAdminRecord: Record<string, unknown> = {
      emailNormalized: normalizedEmail,
      email: normalizedEmail,
      displayName: cleanName,
      fullName: cleanName,
      role: normalizedRole,
      permissions: assignedPermissions,
      status: "pending",
      tokenHash,
      expiresAt,
      emailDeliveryStatus: "pending",
      invitedBy: actor.displayName || "Super Admin",
      invitedByAdminId: actor.id,
      createdAt: now,
      updatedAt: now,
    };

    // 3. FIRESTORE FIRST: Create pending pre-authorization record
    const adminId = await saveToFirestoreCollection("admins", newAdminRecord);
    await saveToFirestoreCollection("adminInvitations", { ...newAdminRecord, id: adminId }).catch(() => {});

    // 4. SMTP SECOND: Attempt invitation email dispatch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.awenueglobalsoftwaresolutions.in";
    const invitationUrl = `${baseUrl}/admin/invite/accept?token=${rawToken}`;

    const emailResult = await sendAdminInvitationEmail({
      toEmail: normalizedEmail,
      fullName: cleanName,
      roleLabel: ROLE_LABELS[normalizedRole as AdminRole] || normalizedRole,
      invitationUrl,
      invitedByName: actor.displayName || "Super Admin",
    });

    const emailStatus = emailResult.success ? "sent" : "failed";

    // 5. Update Firestore with email delivery status
    const emailUpdateData = {
      emailDeliveryStatus: emailStatus,
      emailSentAt: emailResult.success ? now : null,
      emailErrorCode: emailResult.error || null,
      updatedAt: now,
    };

    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          await db.collection("admins").doc(adminId).update(emailUpdateData).catch(() => {});
          await db.collection("adminInvitations").doc(adminId).update(emailUpdateData).catch(() => {});
        }
      } catch (eErr) {
        console.warn("[INVITE POST] Email status update notice:", eErr);
      }
    }
    await clientUpdateDoc(clientDoc(clientDb, "admins", adminId), emailUpdateData).catch(() => {});

    await logAdminActivity({
      actorAdminId: actor.id,
      action: "ADMIN_PRE_AUTHORIZED",
      metadata: {
        invitedEmail: normalizedEmail,
        role: normalizedRole,
        emailDeliveryStatus: emailStatus,
        adminId,
      },
    }).catch(() => {});

    if (emailResult.success) {
      return NextResponse.json(
        {
          success: true,
          message: `Admin pre-authorized! An invitation email has been sent to ${normalizedEmail}.`,
          adminId,
          emailDeliveryStatus: "sent",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Admin pre-authorized in database! Email delivery skipped/failed (${emailResult.error || 'No SMTP configured'}), but the user can sign in directly at /admin/login using Google.`,
        adminId,
        emailDeliveryStatus: "failed",
        emailError: emailResult.error,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[INVITE POST] Error:", err);
    return NextResponse.json(
      { error: "We couldn't create the Admin invitation due to a server error. Please try again." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH: Manage admin — change_role, edit_permissions, suspend, reactivate, revoke, resend_email
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "manage_admins", actor.permissions) && actor.role !== "super_admin") {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { targetAdminId, action, newRole, permissions } = body;

  if (typeof targetAdminId !== "string" || !targetAdminId) {
    return NextResponse.json({ error: "targetAdminId is required." }, { status: 400 });
  }

  const allowedActions = ["change_role", "edit_permissions", "suspend", "reactivate", "revoke", "resend_email"];
  if (typeof action !== "string" || !allowedActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${allowedActions.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updatedAt: now };

    if (action === "resend_email") {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      updateData.tokenHash = tokenHash;
      updateData.expiresAt = expiresAt;
      updateData.emailDeliveryStatus = "pending";

      let targetData: Record<string, unknown> | null = null;
      if (isAdminCertAvailable()) {
        try {
          const db = getAdminDb();
          if (db) {
            const doc = await db.collection("admins").doc(targetAdminId).get();
            if (doc.exists) targetData = doc.data()!;
          }
        } catch (err) {
          console.warn("[RESEND] Admin SDK lookup notice:", err);
        }
      }

      const emailAddress = (targetData?.email as string) || (targetData?.emailNormalized as string);
      const name = (targetData?.displayName as string) || (targetData?.fullName as string) || "Administrator";
      const targetRole = (targetData?.role as AdminRole) || "admin";

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.awenueglobalsoftwaresolutions.in";
      const invitationUrl = `${baseUrl}/admin/invite/accept?token=${rawToken}`;

      const emailResult = await sendAdminInvitationEmail({
        toEmail: emailAddress,
        fullName: name,
        roleLabel: ROLE_LABELS[targetRole] || targetRole,
        invitationUrl,
        invitedByName: actor.displayName || "Super Admin",
      });

      updateData.emailDeliveryStatus = emailResult.success ? "sent" : "failed";
      updateData.emailSentAt = emailResult.success ? now : null;
      updateData.emailErrorCode = emailResult.error || null;
    } else if (action === "edit_permissions") {
      if (!Array.isArray(permissions)) {
        return NextResponse.json({ error: "permissions array is required." }, { status: 400 });
      }
      updateData.permissions = permissions.filter((p): p is string => typeof p === "string");
    } else if (action === "change_role") {
      const roleStr = typeof newRole === "string" ? newRole.trim() : "";
      if (!isValidRole(roleStr)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      if (roleStr === "super_admin" && actor.role !== "super_admin") {
        return NextResponse.json(
          { error: "Only Super Admins can promote others to Super Admin." },
          { status: 403 }
        );
      }
      updateData.role = roleStr;
      if (!Array.isArray(permissions)) {
        updateData.permissions = DEFAULT_ROLE_PERMISSIONS[roleStr as AdminRole] || [];
      }
    } else if (action === "suspend") {
      updateData.status = "suspended";
    } else if (action === "reactivate") {
      updateData.status = "active";
    } else if (action === "revoke") {
      updateData.status = "revoked";
    }

    let updatedServer = false;
    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          await db.collection("admins").doc(targetAdminId).update(updateData).catch(() => {});
          await db.collection("adminInvitations").doc(targetAdminId).update(updateData).catch(() => {});
          updatedServer = true;
        }
      } catch (err) {
        console.warn("[INVITE PATCH] Admin SDK notice:", err);
      }
    }

    if (!updatedServer) {
      try {
        await clientUpdateDoc(clientDoc(clientDb, "admins", targetAdminId), updateData).catch(() => {});
        await clientUpdateDoc(clientDoc(clientDb, "adminInvitations", targetAdminId), updateData).catch(() => {});
      } catch (clientErr) {
        console.warn("[INVITE PATCH] Client SDK notice:", clientErr);
      }
    }

    return NextResponse.json(
      { success: true, message: action === "resend_email" ? "Invitation email re-sent." : "Admin updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE PATCH] Error:", err);
    return NextResponse.json({ error: "Failed to update admin." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Cancel / Revoke a pending pre-authorization
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required." }, { status: 400 });
  }

  try {
    const updateData = { status: "revoked", updatedAt: new Date().toISOString() };
    if (isAdminCertAvailable()) {
      try {
        const db = getAdminDb();
        if (db) {
          await db.collection("admins").doc(invitationId).update(updateData).catch(() => {});
          await db.collection("adminInvitations").doc(invitationId).update(updateData).catch(() => {});
        }
      } catch (err) {
        console.warn("[INVITE DELETE] Admin SDK notice:", err);
      }
    }

    await clientUpdateDoc(clientDoc(clientDb, "admins", invitationId), updateData).catch(() => {});
    await clientUpdateDoc(clientDoc(clientDb, "adminInvitations", invitationId), updateData).catch(() => {});

    return NextResponse.json(
      { success: true, message: "Pre-authorization cancelled successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[INVITE DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to cancel pre-authorization." }, { status: 500 });
  }
}
