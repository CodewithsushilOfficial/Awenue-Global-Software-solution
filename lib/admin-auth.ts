/**
 * lib/admin-auth.ts — Authoritative Server-Side Admin Lookup
 *
 * Priority order:
 * 1. Firestore admins collection (production)
 * 2. ENV-configured ADMIN_EMAIL bypass (development / pre-bootstrap)
 *
 * The ENV bypass allows the first super admin to log in via OTP before
 * the bootstrap script has been run and Firestore has been populated.
 */

import { getAdminDb } from "@/lib/firebase-admin";
import { getSessionFromRequest } from "@/lib/session";
import {
  hasPermission,
  isValidRole,
  type AdminRole,
  type Permission,
  type AdminStatus,
} from "@/lib/rbac";

export interface AdminRecord {
  id: string;
  uid?: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  role: AdminRole;
  status: AdminStatus;
  invitedBy?: string;
  invitedByAdminId?: string;
  invitedAt?: string;
  activatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// ENV-based bootstrap admin (works before Firestore is set up)
// ─────────────────────────────────────────────────────────────
function getEnvAdmin(normalizedEmail: string): AdminRecord | null {
  const envEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    ""
  ).trim().toLowerCase();

  if (!envEmail || normalizedEmail !== envEmail) return null;

  return {
    id: "env_bootstrap_admin",
    email: envEmail,
    emailNormalized: envEmail,
    displayName:
      process.env.ADMIN_DISPLAY_NAME ||
      process.env.NEXT_PUBLIC_ADMIN_DISPLAY_NAME ||
      "Super Administrator",
    role: "super_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Look up an active admin by normalized email.
 * Falls back to ENV-configured admin if Firestore is unavailable.
 */
export async function getActiveAdminByEmail(
  email: string
): Promise<AdminRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // ── 1. Try Firestore first ──────────────────────────────────
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection("admins")
        .where("emailNormalized", "==", normalizedEmail)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();

        if (data.status !== "active") {
          console.warn(
            `[ADMIN AUTH] Admin ${normalizedEmail} found but status=${data.status}`
          );
          return null;
        }

        const role = isValidRole(data.role) ? data.role : null;
        if (!role) {
          console.warn(
            `[ADMIN AUTH] Admin ${normalizedEmail} has invalid role: ${data.role}`
          );
          return null;
        }

        return {
          id: doc.id,
          uid: data.uid,
          email: data.email || normalizedEmail,
          emailNormalized: normalizedEmail,
          displayName:
            data.displayName || data.fullName || "Administrator",
          role,
          status: data.status,
          invitedBy: data.invitedBy,
          invitedByAdminId: data.invitedByAdminId,
          invitedAt: data.invitedAt,
          activatedAt: data.activatedAt,
          lastLoginAt: data.lastLoginAt,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
        };
      }

      // Admin not in Firestore — check ENV fallback
      console.warn(
        `[ADMIN AUTH] ${normalizedEmail} not found in Firestore admins collection.`
      );
    } else {
      console.warn(
        "[ADMIN AUTH] Firestore not available — falling back to ENV admin check."
      );
    }
  } catch (err) {
    console.error("[ADMIN AUTH] Firestore lookup error:", err);
    // Fall through to ENV fallback
  }

  // ── 2. ENV fallback (development / pre-bootstrap) ──────────
  const envAdmin = getEnvAdmin(normalizedEmail);
  if (envAdmin) {
    console.log(
      `[ADMIN AUTH] ENV fallback: ${normalizedEmail} matched ADMIN_EMAIL — granting super_admin access. Run bootstrap script to persist this admin to Firestore.`
    );
    return envAdmin;
  }

  return null;
}

/**
 * Get admin by Firestore document ID.
 */
export async function getAdminById(
  adminId: string
): Promise<AdminRecord | null> {
  // Handle ENV bootstrap admin ID
  if (adminId === "env_bootstrap_admin") {
    const envEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      ""
    ).trim().toLowerCase();
    if (envEmail) return getEnvAdmin(envEmail);
    return null;
  }

  try {
    const db = getAdminDb();
    if (!db) return null;

    const doc = await db.collection("admins").doc(adminId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    const role = isValidRole(data.role) ? data.role : null;
    if (!role) return null;

    return {
      id: doc.id,
      uid: data.uid,
      email: data.email || data.emailNormalized,
      emailNormalized: data.emailNormalized || data.email?.toLowerCase(),
      displayName: data.displayName || data.fullName || "Administrator",
      role,
      status: data.status,
      invitedBy: data.invitedBy,
      invitedByAdminId: data.invitedByAdminId,
      invitedAt: data.invitedAt,
      activatedAt: data.activatedAt,
      lastLoginAt: data.lastLoginAt,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    console.error("[ADMIN AUTH] getAdminById error:", err);
    return null;
  }
}

/**
 * Extract session from request and return the current active admin.
 */
export async function getAdminFromRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): Promise<AdminRecord | null> {
  const session = getSessionFromRequest(request);
  if (!session) return null;

  const admin = await getAdminById(session.adminId);
  if (!admin || admin.status !== "active") return null;

  return admin;
}

/**
 * Check if the admin from the request has a specific permission.
 */
export async function requirePermission(
  request: {
    cookies: { get: (name: string) => { value: string } | undefined };
  },
  permission: Permission
): Promise<AdminRecord | null> {
  const admin = await getAdminFromRequest(request);
  if (!admin) return null;
  if (!hasPermission(admin.role, permission)) return null;
  return admin;
}

/** Update lastLoginAt — no-op for ENV admin */
export async function updateLastLogin(adminId: string): Promise<void> {
  if (adminId === "env_bootstrap_admin") return;
  try {
    const db = getAdminDb();
    if (!db) return;
    await db.collection("admins").doc(adminId).update({
      lastLoginAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ADMIN AUTH] updateLastLogin failed:", err);
  }
}

/** Log an admin activity event */
export async function logAdminActivity(params: {
  actorAdminId?: string;
  targetAdminId?: string;
  action: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> {
  try {
    const db = getAdminDb();
    if (!db) {
      // Log to console when Firestore not available
      console.log("[AUDIT]", params.action, params.metadata || "");
      return;
    }
    await db.collection("adminActivityLogs").add({
      actorAdminId: params.actorAdminId || null,
      targetAdminId: params.targetAdminId || null,
      action: params.action,
      safeMetadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ADMIN AUTH] logAdminActivity failed:", err);
  }
}

export { hasPermission };
