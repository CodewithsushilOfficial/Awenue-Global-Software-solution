/**
 * lib/admin-auth.ts — Authoritative Server-Side Admin Authorization & Firebase Google Auth
 *
 * Permanent Super Admin Email:
 *   codewithsushil7236@gmail.com
 *
 * Flow:
 * 1. Client authenticates via Firebase Google Auth (`signInWithPopup`)
 * 2. Client sends Firebase ID token to `/api/admin/auth/google`
 * 3. `authorizeGoogleAdmin` verifies the ID token using `getAdminAuth().verifyIdToken`
 * 4. Checks Firestore `admins` collection for matching UID or pre-authorized Email
 * 5. Returns authorized AdminRecord or denies access for unauthorized accounts
 */

import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
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
  permissions?: string[];
  status: AdminStatus;
  invitedBy?: string;
  invitedByAdminId?: string;
  invitedAt?: string;
  activatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Permanent Super Admin Email
const PERMANENT_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  "codewithsushil7236@gmail.com"
).trim().toLowerCase();

function getEnvAdmin(normalizedEmail: string): AdminRecord | null {
  if (!normalizedEmail) return null;
  if (normalizedEmail !== PERMANENT_ADMIN_EMAIL && normalizedEmail !== "codewithsushil7236@gmail.com") {
    return null;
  }
  return {
    id: "super_admin_permanent",
    email: normalizedEmail,
    emailNormalized: normalizedEmail,
    displayName: "Super Administrator",
    role: "super_admin",
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verify a Firebase ID token and authorize the Admin.
 */
export async function authorizeGoogleAdmin(
  idToken: string
): Promise<{ authorized: boolean; admin?: AdminRecord; error?: string }> {
  if (!idToken || typeof idToken !== "string") {
    return { authorized: false, error: "Firebase ID token is required." };
  }

  let googleEmail: string | null = null;
  let googleUid: string | null = null;
  let googleName: string | null = null;

  // 1. Primary verification via Firebase Admin SDK
  try {
    const auth = getAdminAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(idToken);
      googleUid = decodedToken.uid;
      googleEmail = decodedToken.email || null;
      googleName = decodedToken.name || null;
    }
  } catch (tokenErr) {
    console.warn("[ADMIN AUTH] Admin SDK verifyIdToken notice:", tokenErr);
  }

  // 2. Fallback: Verify via Google Firebase Auth REST API (accounts:lookup)
  if (!googleEmail || !googleUid) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyATYJjw7vTC6NMKtoODxzfBewMxgWBE--s";
      if (apiKey) {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const user = data.users?.[0];
          if (user && user.email) {
            googleUid = user.localId;
            googleEmail = user.email;
            googleName = user.displayName || user.providerUserInfo?.[0]?.displayName || null;
          }
        }
      }
    } catch (fallbackErr) {
      console.warn("[ADMIN AUTH] Firebase Auth REST lookup fallback notice:", fallbackErr);
    }
  }

  // 3. Dev JWT fallback
  if ((!googleEmail || !googleUid) && process.env.NODE_ENV !== "production") {
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        if (payload.email) {
          googleUid = payload.sub || payload.user_id || payload.uid;
          googleEmail = payload.email;
          googleName = payload.name || null;
        }
      }
    } catch (jwtErr) {
      console.warn("[ADMIN AUTH] Dev JWT payload parse notice:", jwtErr);
    }
  }

  if (!googleEmail || !googleUid) {
    return {
      authorized: false,
      error: "Google ID Token could not be verified.",
    };
  }

  const normalizedEmail = googleEmail.trim().toLowerCase();
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (db) {
    // 1. Check by UID first
    const uidQuery = await db
      .collection("admins")
      .where("uid", "==", googleUid)
      .limit(1)
      .get()
      .catch(() => null);

    if (uidQuery && !uidQuery.empty) {
      const doc = uidQuery.docs[0];
      const data = doc.data();

      if (data.status === "suspended" || data.status === "revoked") {
        return {
          authorized: false,
          error: `Your admin account has been ${data.status}. Access denied.`,
        };
      }

      if (data.status === "active") {
        const role = isValidRole(data.role) ? data.role : "admin";
        await doc.ref.update({ lastLoginAt: now, updatedAt: now }).catch(() => {});
        return {
          authorized: true,
          admin: {
            id: doc.id,
            uid: googleUid,
            email: data.email || normalizedEmail,
            emailNormalized: normalizedEmail,
            displayName: data.displayName || googleName || "Administrator",
            role,
            permissions: Array.isArray(data.permissions) ? data.permissions : undefined,
            status: "active",
            createdAt: data.createdAt || now,
            lastLoginAt: now,
          },
        };
      }
    }

    // 2. If not found by UID, check by normalized email (Pre-authorized / Pending invite)
    const emailQuery = await db
      .collection("admins")
      .where("emailNormalized", "==", normalizedEmail)
      .limit(1)
      .get()
      .catch(() => null);

    if (emailQuery && !emailQuery.empty) {
      const doc = emailQuery.docs[0];
      const data = doc.data();

      if (data.status === "suspended" || data.status === "revoked") {
        return {
          authorized: false,
          error: `Your admin account has been ${data.status}. Access denied.`,
        };
      }

      const role = isValidRole(data.role) ? data.role : "admin";

      // Link UID & activate admin
      await doc.ref
        .update({
          uid: googleUid,
          status: "active",
          activatedAt: data.activatedAt || now,
          lastLoginAt: now,
          updatedAt: now,
          displayName: data.displayName || googleName || "Administrator",
        })
        .catch(() => {});

      return {
        authorized: true,
        admin: {
          id: doc.id,
          uid: googleUid,
          email: normalizedEmail,
          emailNormalized: normalizedEmail,
          displayName: data.displayName || googleName || "Administrator",
          role,
          permissions: Array.isArray(data.permissions) ? data.permissions : undefined,
          status: "active",
          createdAt: data.createdAt || now,
          activatedAt: data.activatedAt || now,
          lastLoginAt: now,
        },
      };
    }
  }

  // 3. Permanent Super Admin (`codewithsushil7236@gmail.com`)
  if (
    normalizedEmail === PERMANENT_ADMIN_EMAIL ||
    normalizedEmail === "codewithsushil7236@gmail.com"
  ) {
    if (db) {
      const superAdminRef = db.collection("admins").doc("super_admin_permanent");
      await superAdminRef
        .set(
          {
            uid: googleUid,
            email: normalizedEmail,
            emailNormalized: normalizedEmail,
            displayName: googleName || "Super Administrator",
            role: "super_admin",
            status: "active",
            lastLoginAt: now,
            updatedAt: now,
            createdAt: now,
          },
          { merge: true }
        )
        .catch(() => {});
    }

    return {
      authorized: true,
      admin: {
        id: "super_admin_permanent",
        uid: googleUid,
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        displayName: googleName || "Super Administrator",
        role: "super_admin",
        status: "active",
        createdAt: now,
        lastLoginAt: now,
      },
    };
  }

  // 4. Unauthorized Google Account
  return {
    authorized: false,
    error: "This Google account is not authorized to access the AWENUE Admin Dashboard.",
  };
}

/**
 * Get admin record by normalized email.
 */
export async function getAdminByEmail(
  email: string
): Promise<AdminRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

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
        const role = isValidRole(data.role) ? data.role : "admin";
        return {
          id: doc.id,
          uid: data.uid,
          email: data.email || normalizedEmail,
          emailNormalized: normalizedEmail,
          displayName: data.displayName || data.fullName || "Administrator",
          role,
          permissions: Array.isArray(data.permissions) ? data.permissions : undefined,
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
    }
  } catch (err) {
    console.warn("[ADMIN AUTH] Firestore lookup notice:", err);
  }

  return getEnvAdmin(normalizedEmail);
}

/**
 * Get admin by Firestore document ID.
 */
export async function getAdminById(
  adminId: string
): Promise<AdminRecord | null> {
  if (adminId === "env_bootstrap_admin" || adminId === "super_admin_permanent") {
    return getEnvAdmin(PERMANENT_ADMIN_EMAIL);
  }

  try {
    const db = getAdminDb();
    if (!db) return getEnvAdmin(PERMANENT_ADMIN_EMAIL);

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
      permissions: Array.isArray(data.permissions) ? data.permissions : undefined,
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
  if (!hasPermission(admin.role, permission, admin.permissions)) return null;
  return admin;
}

/** Update lastLoginAt */
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
  actorAdminId: string;
  targetAdminId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getAdminDb();
    if (!db) return;

    await db.collection("adminAuditLogs").add({
      actorAdminId: params.actorAdminId,
      targetAdminId: params.targetAdminId || null,
      action: params.action,
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ADMIN AUTH] logAdminActivity notice:", err);
  }
}
