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
import { getAbsoluteUrl } from "@/lib/site-url";
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

/**
 * Bulletproof token resolution across adminInvitations and admins collections.
 * Handles raw tokens, token hashes, double-hashes, rawToken fields, and document IDs.
 */
async function findInvitationDocument(token: string): Promise<Record<string, unknown> | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;
  const hashedToken = hashToken(cleanToken);

  const collections = ["adminInvitations", "admins"];
  const candidateValues = [hashedToken, cleanToken];

  // 1. Primary Lookup via Admin SDK
  if (isAdminCertAvailable()) {
    try {
      const db = getAdminDb();
      if (db) {
        for (const colName of collections) {
          for (const val of candidateValues) {
            let snap = await db.collection(colName).where("tokenHash", "==", val).limit(1).get();
            if (snap.empty) {
              snap = await db.collection(colName).where("rawToken", "==", val).limit(1).get();
            }
            if (!snap.empty) {
              return { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          }
        }
      }
    } catch (err) {
      console.warn("[FIND INVITATION] Admin SDK notice:", err);
    }
  }

  // 2. Secondary Lookup via Client SDK
  try {
    for (const colName of collections) {
      for (const val of candidateValues) {
        let q = query(clientCollection(clientDb, colName), where("tokenHash", "==", val), limit(1));
        let snap = await getDocs(q);
        if (snap.empty) {
          q = query(clientCollection(clientDb, colName), where("rawToken", "==", val), limit(1));
          snap = await getDocs(q);
        }
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }
    }
  } catch (clientErr) {
    console.warn("[FIND INVITATION] Client SDK notice:", clientErr);
  }

  // 3. Tertiary Lookup via Direct Firestore REST API (Fail-Safe for Serverless without Cert)
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "awenue-global";
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (apiKey) {
      for (const colName of collections) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}?key=${apiKey}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const documents = (data.documents || []) as Array<{ name?: string; fields?: Record<string, { stringValue?: string }> }>;

          for (const doc of documents) {
            const fields = doc.fields || {};
            const docId = doc.name ? doc.name.split("/").pop() || "" : "";
            const tokenHashVal = fields.tokenHash?.stringValue;
            const rawTokenVal = fields.rawToken?.stringValue;
            const emailVal = fields.emailNormalized?.stringValue || fields.email?.stringValue;
            const statusVal = fields.status?.stringValue || "pending";
            const expiresAtVal = fields.expiresAt?.stringValue;
            const roleVal = fields.role?.stringValue || "admin";
            const displayNameVal = fields.displayName?.stringValue || fields.fullName?.stringValue;
            const invitedByVal = fields.invitedBy?.stringValue;

            const isMatch =
              docId === cleanToken ||
              tokenHashVal === hashedToken ||
              tokenHashVal === cleanToken ||
              rawTokenVal === cleanToken ||
              rawTokenVal === hashedToken;

            if (isMatch) {
              return {
                id: docId,
                email: emailVal,
                emailNormalized: emailVal,
                displayName: displayNameVal,
                role: roleVal,
                status: statusVal,
                tokenHash: tokenHashVal,
                rawToken: rawTokenVal,
                expiresAt: expiresAtVal,
                invitedBy: invitedByVal,
              };
            }
          }
        }
      }
    }
  } catch (restErr) {
    console.warn("[FIND INVITATION] REST API lookup notice:", restErr);
  }

  // 4. Fail-safe Fallback: Full scan of recent 50 documents
  try {
    for (const colName of collections) {
      const snap = await getDocs(query(clientCollection(clientDb, colName), limit(50)));
      const match = snap.docs.find((d) => {
        const data = d.data();
        return (
          d.id === cleanToken ||
          data.tokenHash === hashedToken ||
          data.tokenHash === cleanToken ||
          data.rawToken === cleanToken ||
          data.rawToken === hashedToken
        );
      });
      if (match) {
        return { id: match.id, ...match.data() };
      }
    }
  } catch (e) {
    console.warn("[FIND INVITATION] Full scan notice:", e);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: List all admins + pending invitations OR verify invitation token
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Public endpoint for Token Verification during Email Acceptance Flow
  if (token) {
    const foundDoc = await findInvitationDocument(token);

    if (!foundDoc) {
      return NextResponse.json({ error: "Invalid or expired invitation token." }, { status: 404 });
    }

    if (foundDoc.status === "active") {
      return NextResponse.json({
        success: true,
        invitation: {
          id: foundDoc.id,
          email: foundDoc.emailNormalized || foundDoc.email,
          displayName: foundDoc.displayName || foundDoc.fullName,
          role: foundDoc.role,
          roleLabel: ROLE_LABELS[(foundDoc.role as AdminRole) || "admin"] || foundDoc.role,
          status: "active",
        },
        message: "This admin account is already active! You can proceed to sign in with Google.",
      });
    }

    // Verify Expiration
    if (foundDoc.expiresAt) {
      const expTime = new Date(foundDoc.expiresAt as string).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        return NextResponse.json(
          { error: "This invitation link has expired (invitations are valid for 72 hours). Please ask a Super Admin to resend your invitation." },
          { status: 400 }
        );
      }
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
      rawToken,
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
    const invitationUrl = getAbsoluteUrl("/admin/invite/accept", { token: rawToken });

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

      updateData.rawToken = rawToken;
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

      const invitationUrl = getAbsoluteUrl("/admin/invite/accept", { token: rawToken });

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
// DELETE: Permanently Delete Admin / Invitation from Firestore Database
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  // ── 1. Authenticate caller ───────────────────────────────────────────
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Require Super Admin or explicit manage_admins permission ────────────
  if (!hasPermission(actor.role, "manage_admins", actor.permissions) && actor.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admins can permanently delete administrators." }, { status: 403 });
  }

  // ── 3. Resolve target ID from query params ──────────────────────────
  const { searchParams } = new URL(request.url);
  const targetId =
    searchParams.get("targetAdminId") ||
    searchParams.get("adminId") ||
    searchParams.get("invitationId");

  if (!targetId || typeof targetId !== "string" || !targetId.trim()) {
    return NextResponse.json({ error: "targetAdminId is required." }, { status: 400 });
  }

  const cleanTargetId = targetId.trim();

  // ── 4. Block deletion of the permanent bootstrap Super Admin ────────────
  if (cleanTargetId === "super_admin_permanent") {
    return NextResponse.json(
      { error: "The bootstrap Super Admin account cannot be deleted." },
      { status: 403 }
    );
  }

  // ── 5. Block self-deletion (by document ID) ──────────────────────────
  if (cleanTargetId === actor.id) {
    return NextResponse.json(
      { error: "You cannot delete your own Admin account." },
      { status: 403 }
    );
  }

  // ── 6. Require Firebase Admin SDK — no insecure fallback for privileged deletes ─
  if (!isAdminCertAvailable()) {
    console.error("[ADMIN DELETE] Firebase Admin SDK credentials not available. Ensure FIREBASE_ADMIN_PRIVATE_KEY and FIREBASE_ADMIN_CLIENT_EMAIL are set in Vercel environment variables.");
    return NextResponse.json(
      {
        error:
          "Server configuration error: Firebase Admin SDK is not initialised. " +
          "Set FIREBASE_ADMIN_PRIVATE_KEY and FIREBASE_ADMIN_CLIENT_EMAIL in your Vercel environment variables, then redeploy.",
      },
      { status: 503 }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Firestore Admin connection unavailable." }, { status: 503 });
  }

  try {
    console.log(`[ADMIN DELETE] ADMIN_DELETE_REQUESTED actor=${actor.id} target=${cleanTargetId}`);

    // ── 7. Load target document from admins ────────────────────────────
    const targetSnap = await db.collection("admins").doc(cleanTargetId).get();
    let targetEmail = "";
    let targetUid = "";

    if (targetSnap.exists) {
      const data = targetSnap.data()!;
      targetEmail = (data.emailNormalized || data.email || "").toLowerCase().trim();
      targetUid = data.uid || "";
      console.log(`[ADMIN DELETE] TARGET_ADMIN_FOUND id=${cleanTargetId} email=${targetEmail} status=${data.status}`);

      // ── 8. Block last active Super Admin deletion ───────────────────
      if (data.role === "super_admin") {
        const superSnap = await db
          .collection("admins")
          .where("role", "==", "super_admin")
          .where("status", "==", "active")
          .get();
        const otherSuperAdmins = superSnap.docs.filter((d) => d.id !== cleanTargetId);
        if (otherSuperAdmins.length === 0) {
          return NextResponse.json(
            { error: "Cannot delete the last active Super Admin. Promote another admin to Super Admin first." },
            { status: 409 }
          );
        }
      }

      // ── 9. Block self-deletion by email (secondary check) ─────────────
      if (targetEmail && targetEmail === actor.emailNormalized) {
        return NextResponse.json(
          { error: "You cannot delete your own Admin account." },
          { status: 403 }
        );
      }
    } else {
      // Not found in admins — check adminInvitations
      console.log(`[ADMIN DELETE] admins/${cleanTargetId} not found, checking adminInvitations...`);
      const invSnap = await db.collection("adminInvitations").doc(cleanTargetId).get();
      if (invSnap.exists) {
        const d = invSnap.data()!;
        targetEmail = (d.emailNormalized || d.email || "").toLowerCase().trim();
        targetUid = d.uid || "";
        console.log(`[ADMIN DELETE] TARGET_FOUND_IN_INVITATIONS id=${cleanTargetId} email=${targetEmail}`);
      } else {
        console.warn(`[ADMIN DELETE] Target ${cleanTargetId} not found in admins or adminInvitations. Proceeding with best-effort delete.`);
      }
    }

    // ── 10. Delete from admins collection ─────────────────────────────
    // Delete by direct document ID
    await db.collection("admins").doc(cleanTargetId).delete()
      .then(() => console.log(`[ADMIN DELETE] ADMIN_DOCUMENT_DELETED admins/${cleanTargetId}`))
      .catch((e) => console.warn(`[ADMIN DELETE] Could not delete admins/${cleanTargetId}:`, e));

    // Delete any other admins records sharing the same normalised email
    if (targetEmail) {
      const emailAdminSnap = await db
        .collection("admins")
        .where("emailNormalized", "==", targetEmail)
        .get();
      await Promise.all(
        emailAdminSnap.docs.map((d) =>
          d.ref.delete()
            .then(() => console.log(`[ADMIN DELETE] EMAIL_RECORD_DELETED admins/${d.id}`))
            .catch(() => {})
        )
      );

      // Also delete UID-keyed document if one exists
      if (targetUid && targetUid !== cleanTargetId) {
        const uidDoc = await db.collection("admins").doc(targetUid).get();
        if (uidDoc.exists) {
          await uidDoc.ref.delete()
            .then(() => console.log(`[ADMIN DELETE] UID_KEYED_DELETED admins/${targetUid}`))
            .catch(() => {});
        }
      }
    }

    // ── 11. Delete from adminInvitations collection ─────────────────────
    await db.collection("adminInvitations").doc(cleanTargetId).delete().catch(() => {});

    if (targetEmail) {
      const invMatches = await db
        .collection("adminInvitations")
        .where("emailNormalized", "==", targetEmail)
        .get();
      await Promise.all(
        invMatches.docs.map((d) =>
          d.ref.delete()
            .then(() => console.log(`[ADMIN DELETE] INVITATION_DELETED adminInvitations/${d.id}`))
            .catch(() => {})
        )
      );
      console.log(`[ADMIN DELETE] RELATED_INVITATIONS_CLEANED email=${targetEmail}`);
    }

    // ── 12. Write audit log ───────────────────────────────────────
    await logAdminActivity({
      actorAdminId: actor.id,
      targetAdminId: cleanTargetId,
      action: "ADMIN_PERMANENTLY_DELETED",
      metadata: {
        deletedTargetId: cleanTargetId,
        email: targetEmail,
        uid: targetUid,
        deletedBy: actor.email,
        deletedAt: new Date().toISOString(),
      },
    }).catch(() => {});

    console.log(`[ADMIN DELETE] ADMIN_DELETE_COMPLETED target=${cleanTargetId} email=${targetEmail}`);

    return NextResponse.json(
      { success: true, message: "Admin permanently deleted from database." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ADMIN DELETE] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to delete admin from database. Check server logs for details." },
      { status: 500 }
    );
  }
}
