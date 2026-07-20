/**
 * lib/admin-auth.ts — Authoritative Server-Side Admin Authorization & Credentials
 *
 * Permanent Super Admin Credentials:
 *   Email:    codewithsushil7236@gmail.com
 *   Password: Sushil@7236 (or process.env.ADMIN_PASSWORD)
 *
 * Priority order:
 * 1. Firestore admins collection (production with DB)
 * 2. Permanent Super Admin fallback (production serverless / pre-bootstrap)
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
import crypto from "crypto";

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
  passwordHash?: string;
}

// ─────────────────────────────────────────────────────────────
// Permanent Super Admin Configuration
// ─────────────────────────────────────────────────────────────
const PERMANENT_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  "codewithsushil7236@gmail.com"
).trim().toLowerCase();

const PERMANENT_ADMIN_PASSWORD = (
  process.env.ADMIN_PASSWORD ||
  "Sushil@7236"
).trim();

function getEnvAdmin(normalizedEmail: string): AdminRecord | null {
  if (!normalizedEmail) return null;

  // Match default permanent email OR configured ADMIN_EMAIL
  if (
    normalizedEmail === PERMANENT_ADMIN_EMAIL ||
    normalizedEmail === "codewithsushil7236@gmail.com"
  ) {
    return {
      id: "env_bootstrap_admin",
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      displayName:
        process.env.ADMIN_DISPLAY_NAME ||
        process.env.NEXT_PUBLIC_ADMIN_DISPLAY_NAME ||
        "Super Administrator",
      role: "super_admin",
      status: "active",
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Timing-safe string equality check to prevent timing side-channel attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify an admin's password.
 * Checks Firestore admin record passwordHash OR permanent Super Admin password (`Sushil@7236`).
 */
export async function verifyAdminPassword(
  email: string,
  inputPassword?: string
): Promise<{ valid: boolean; admin: AdminRecord | null }> {
  if (!inputPassword || typeof inputPassword !== "string") {
    return { valid: false, admin: null };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanPassword = inputPassword.trim();

  // 1. Get active admin record
  const admin = await getActiveAdminByEmail(normalizedEmail);
  if (!admin) {
    return { valid: false, admin: null };
  }

  // 2. Check permanent Super Admin password
  if (
    normalizedEmail === PERMANENT_ADMIN_EMAIL ||
    normalizedEmail === "codewithsushil7236@gmail.com"
  ) {
    const isPermanentMatch = timingSafeCompare(cleanPassword, PERMANENT_ADMIN_PASSWORD) ||
      cleanPassword === "Sushil@7236";

    if (isPermanentMatch) {
      return { valid: true, admin };
    }
  }

  // 3. Check Firestore password (if stored)
  if (admin.passwordHash) {
    const hash = crypto.createHash("sha256").update(cleanPassword).digest("hex");
    if (timingSafeCompare(hash, admin.passwordHash)) {
      return { valid: true, admin };
    }
  }

  // Fallback check against permanent password for any active super_admin
  if (admin.role === "super_admin" && (cleanPassword === PERMANENT_ADMIN_PASSWORD || cleanPassword === "Sushil@7236")) {
    return { valid: true, admin };
  }

  return { valid: false, admin: null };
}

/**
 * Look up an active admin by normalized email.
 * Falls back to ENV/Permanent admin if Firestore is unavailable or slow.
 */
export async function getActiveAdminByEmail(
  email: string
): Promise<AdminRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // ── 1. Try Firestore first (with 2.5s safety timeout) ──────
  try {
    const db = getAdminDb();
    if (db) {
      const dbQueryPromise = db
        .collection("admins")
        .where("emailNormalized", "==", normalizedEmail)
        .limit(1)
        .get();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore lookup timeout")), 2500)
      );

      const snap = (await Promise.race([
        dbQueryPromise,
        timeoutPromise,
      ])) as FirebaseFirestore.QuerySnapshot;

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
          passwordHash: data.passwordHash,
        };
      }
    }
  } catch (err) {
    console.warn("[ADMIN AUTH] Firestore lookup notice:", err);
  }

  // ── 2. Permanent / ENV fallback ─────────────────────────────
  const envAdmin = getEnvAdmin(normalizedEmail);
  if (envAdmin) {
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
  if (adminId === "env_bootstrap_admin") {
    return getEnvAdmin(PERMANENT_ADMIN_EMAIL);
  }

  try {
    const db = getAdminDb();
    if (!db) return getEnvAdmin(PERMANENT_ADMIN_EMAIL);

    const dbQueryPromise = db.collection("admins").doc(adminId).get();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore lookup timeout")), 2500)
    );

    const doc = (await Promise.race([
      dbQueryPromise,
      timeoutPromise,
    ])) as FirebaseFirestore.DocumentSnapshot;

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
      passwordHash: data.passwordHash,
    };
  } catch (err) {
    console.warn("[ADMIN AUTH] getAdminById notice:", err);
    return getEnvAdmin(PERMANENT_ADMIN_EMAIL);
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
    console.warn("[ADMIN AUTH] updateLastLogin notice:", err);
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
    console.warn("[ADMIN AUTH] logAdminActivity notice:", err);
  }
}

export { hasPermission };
