import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyATYJjw7vTC6NMKtoODxzfBewMxgWBE--s",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "awenue-global.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "awenue-global",
};

// Singleton initialization for Compat Client SDK
const compatApp = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
export const compatDb = compatApp.firestore();
export const compatAuth = compatApp.auth();

let isSigningIn = false;
export async function ensureServerSignedIn() {
  if (adminDbInstance || adminAuthInstance || getAdminApp()) {
    return;
  }
  if (compatAuth.currentUser) return;
  if (isSigningIn) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }
  isSigningIn = true;
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "codewithsushil7236@gmail.com").trim().toLowerCase();
    const adminPassword = "Sushil@7236";
    await compatAuth.signInWithEmailAndPassword(adminEmail, adminPassword);
    console.log("[Firebase Admin Fallback] Server signed in successfully as Super Admin:", adminEmail);
  } catch (err) {
    console.error("[Firebase Admin Fallback] Server sign-in error:", err);
  } finally {
    isSigningIn = false;
  }
}

/**
 * Safely normalize PEM private key format.
 */
function normalizePrivateKey(rawKey?: string): string | null {
  if (!rawKey || typeof rawKey !== "string") return null;
  let key = rawKey.trim();

  if (!key) return null;

  if (key.startsWith("{") && key.includes("private_key")) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key && typeof parsed.private_key === "string") {
        key = parsed.private_key.trim();
      }
    } catch {
      // Continue
    }
  }

  key = key.replace(/^["']|["']$/g, "").trim();
  key = key.replace(/\\n/g, "\n");

  if (!key.includes("BEGIN PRIVATE KEY") || key.includes("YOUR_PRIVATE_KEY_HERE")) {
    return null;
  }

  return key;
}

function getClientEmail(): string | null {
  const email =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL;

  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().replace(/^["']|["']$/g, "");
  if (!trimmed.includes("@") || trimmed.includes("xxxxx")) return null;
  return trimmed;
}

function getProjectId(): string {
  const pid =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (pid && typeof pid === "string") {
    const trimmed = pid.trim().replace(/^["']|["']$/g, "");
    if (trimmed) return trimmed;
  }
  return "awenue-global";
}

export function isAdminCertAvailable(): boolean {
  return true;
}

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = normalizePrivateKey(rawKey);
  const clientEmail = getClientEmail();
  if (!privateKey || !clientEmail) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require("firebase-admin/app");

    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const projectId = getProjectId();

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Service account initialized successfully with cert.");
      return adminApp;
    }
  } catch (err) {
    console.error("[Firebase Admin] Service account cert init failed:", err);
  }
  return null;
}

export function getAdminDb(): Firestore {
  if (adminDbInstance) return adminDbInstance as Firestore;
  try {
    const app = getAdminApp();
    if (app) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getFirestore } = require("firebase-admin/firestore");
      adminDbInstance = getFirestore(app) as Firestore;
      return adminDbInstance as Firestore;
    }
  } catch (err) {
    console.warn("[Firebase Admin] Firestore instance init notice:", err);
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (adminAuthInstance) return adminAuthInstance as Auth;
  try {
    const app = getAdminApp();
    if (app) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAuth } = require("firebase-admin/auth");
      adminAuthInstance = getAuth(app) as Auth;
      return adminAuthInstance as Auth;
    }
  } catch (err) {
    console.warn("[Firebase Admin] Auth instance init notice:", err);
  }
  return adminAuth;
}

interface CreateUserProperties {
  uid?: string;
  email: string;
  displayName?: string;
}

interface UpdateUserProperties {
  email?: string;
  displayName?: string;
}

interface UserClaims {
  role?: string;
}

// Client Fallback auth shim mapping Admin SDK functions to Client Compat/Firestore operations
const adminAuthShim = {
  async getUserByEmail(email: string) {
    await ensureServerSignedIn();
    const snap = await compatDb.collection("admins").where("emailNormalized", "==", email.toLowerCase()).limit(1).get();
    if (snap.empty) {
      throw new Error("auth/user-not-found");
    }
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      uid: data.uid || doc.id,
      email: data.email,
      displayName: data.displayName,
      metadata: {
        creationTime: data.createdAt || new Date().toISOString(),
      },
    };
  },

  async createUser(properties: CreateUserProperties) {
    await ensureServerSignedIn();
    const uid = properties.uid || `usr-${Date.now()}`;
    await compatDb.collection("admins").doc(uid).set({
      uid,
      email: properties.email,
      emailNormalized: properties.email.toLowerCase(),
      displayName: properties.displayName || "AWENUE Administrator",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return { uid, email: properties.email };
  },

  async updateUser(uid: string, properties: UpdateUserProperties) {
    await ensureServerSignedIn();
    const updateData: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (properties.email) {
      updateData.email = properties.email;
      updateData.emailNormalized = properties.email.toLowerCase();
    }
    if (properties.displayName) {
      updateData.displayName = properties.displayName;
    }
    await compatDb.collection("admins").doc(uid).set(updateData, { merge: true });
    return { uid };
  },

  async setCustomUserClaims(uid: string, claims: UserClaims) {
    await ensureServerSignedIn();
    await compatDb.collection("admins").doc(uid).set({
      role: claims.role || "admin",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async listUsers(maxResults: number) {
    await ensureServerSignedIn();
    const snap = await compatDb.collection("users").limit(maxResults).get();
    const users = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.fullName || data.displayName || "User",
        disabled: data.disabled || false,
        metadata: {
          creationTime: data.createdAt || new Date().toISOString(),
          lastSignInTime: data.lastLogin || null,
        },
      };
    });
    return { users };
  },

  async verifyIdToken() {
    throw new Error("verifyIdToken not supported on client fallback.");
  }
};

// Safe Proxy exports so top-level imports in Vercel serverless lambdas never fail
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop: string | symbol) {
    if (adminDbInstance) {
      const val = (adminDbInstance as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? val.bind(adminDbInstance) : val;
    }
    try {
      const realDb = getAdminDb();
      if (realDb && adminDbInstance) {
        const val = (adminDbInstance as unknown as Record<string | symbol, unknown>)[prop];
        return typeof val === "function" ? val.bind(adminDbInstance) : val;
      }
    } catch (e) {
      console.warn("[adminDb Proxy] Auto-init failed:", e);
    }
    // Fallback: check if the method is called, ensure server sign-in, and execute on compatDb
    const val = (compatDb as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(compatDb) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop: string | symbol) {
    if (adminAuthInstance) {
      const val = (adminAuthInstance as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? val.bind(adminAuthInstance) : val;
    }
    try {
      const realAuth = getAdminAuth();
      if (realAuth && adminAuthInstance) {
        const val = (adminAuthInstance as unknown as Record<string | symbol, unknown>)[prop];
        return typeof val === "function" ? val.bind(adminAuthInstance) : val;
      }
    } catch (e) {
      console.warn("[adminAuth Proxy] Auto-init failed:", e);
    }
    // Fallback: return shimmed auth methods
    const val = (adminAuthShim as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(adminAuthShim) : val;
  },
});

export default getAdminApp;

