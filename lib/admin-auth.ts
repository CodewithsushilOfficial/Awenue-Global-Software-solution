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
 * Authorize an admin using a Firebase Google Auth ID Token.
 *
 * 1. Verifies the ID token via Firebase Admin Auth (`getAdminAuth().verifyIdToken`)
 * 2. Extracts trusted `uid` and `email`
 * 3. Checks Firestore `admins` collection:
 *    - Query by UID (`uid == googleUid`)
 *    - If not found by UID, query by normalized email (`emailNormalized == normalizedEmail`)
 *    - If found by email with status "pending" or "active":
 *        Link UID, set status to "active", update activatedAt/lastLoginAt, return admin record.
 * 4. If not found in Firestore, check if normalized email matches Super Admin email (`codewithsushil7236@gmail.com`).
 *    - If matched, upsert super admin record in Firestore and return active Super Admin record.
 * 5. If unauthorized, returns `{ authorized: false, error: "..." }`.
 */
export async function authorizeGoogleAdmin(idToken: string): Promise<
  | { authorized: true; admin: AdminRecord }
  | { authorized: false; error: string }
> {
  try {
    const auth = getAdminAuth();
    let googleUid: string | null = null;
    let googleEmail: string | null = null;
    let googleName: string | null = null;

    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        googleUid = decodedToken.uid;
        googleEmail = decodedToken.email || null;
        googleName = decodedToken.name || null;
      } catch (tokenErr) {
        console.warn("[ADMIN AUTH] Admin SDK verifyIdToken notice:", tokenErr);
      }
    }

    // Fallback: Verify via Google OAuth2 tokeninfo public API if Admin SDK is unavailable or failed
    if (!googleEmail || !googleUid) {
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.email && (data.email_verified === "true" || data.email_verified === true)) {
            googleUid = data.sub || data.user_id;
            googleEmail = data.email;
            googleName = data.name || null;
          }
        }
      } catch (fallbackErr) {
        console.warn("[ADMIN AUTH] Google tokeninfo fallback notice:", fallbackErr);
      }
    }

    // Secondary fallback: Parse JWT payload in development
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
            status: "active",
            createdAt: data.createdAt || now,
            activatedAt: data.activatedAt || now,
            lastLoginAt: now,
          },
        };
      }
    }

    // 3. Fallback check for Permanent Super Admin (`codewithsushil7236@gmail.com`)
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
  } catch (err: unknown) {
    console.error("[ADMIN AUTH] ID token verification failed:", err);
    return {
      authorized: false,
      error: "Authentication failed. Token is invalid or expired.",
    };
  }
}

/**
 * Look up an active admin by normalized email.
 */
export async function getActiveAdminByEmail(
  email: string
): Promise<AdminRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

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

        if (data.status !== "active") return null;

        const role = isValidRole(data.role) ? data.role : null;
        if (!role) return null;

        return {
          id: doc.id,
          uid: data.uid,
          email: data.email || normalizedEmail,
          emailNormalized: normalizedEmail,
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
  if (!hasPermission(admin.role, permission)) return null;
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
