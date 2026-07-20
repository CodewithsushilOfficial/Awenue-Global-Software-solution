import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

/**
 * Safely normalize PEM private key format.
 * Handles escaped \n, double/single quotes, and full JSON service account strings.
 */
function normalizePrivateKey(rawKey?: string): string | null {
  if (!rawKey || typeof rawKey !== "string") return null;
  let key = rawKey.trim();

  if (!key) return null;

  // Handle full JSON service account string pasted into env var
  if (key.startsWith("{") && key.includes("private_key")) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key && typeof parsed.private_key === "string") {
        key = parsed.private_key.trim();
      }
    } catch {
      // Continue if not valid JSON
    }
  }

  // Strip surrounding quotes
  key = key.replace(/^["']|["']$/g, "").trim();

  // Replace escaped \n sequences with actual newlines
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

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require("firebase-admin/app");

    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const projectId = getProjectId();
    const clientEmail = getClientEmail();
    const rawKey =
      process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
      process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = normalizePrivateKey(rawKey);

    if (projectId && clientEmail && privateKey) {
      try {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log("[Firebase Admin] Service account initialized successfully.");
        return adminApp;
      } catch (err) {
        console.error("[Firebase Admin] Service account cert init failed:", err);
        return null;
      }
    }

    console.warn("[Firebase Admin] Service account credentials invalid or missing. Operating in fallback mode.");
    return null;
  } catch (err) {
    console.error("[Firebase Admin] App init exception:", err);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDbInstance) return adminDbInstance;
  try {
    const app = getAdminApp();
    if (app) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getFirestore } = require("firebase-admin/firestore");
      adminDbInstance = getFirestore(app);
      return adminDbInstance;
    }
  } catch (err) {
    console.warn("[Firebase Admin] Firestore instance init notice:", err);
  }
  return null;
}

export function getAdminAuth(): Auth | null {
  if (adminAuthInstance) return adminAuthInstance;
  try {
    const app = getAdminApp();
    if (app) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAuth } = require("firebase-admin/auth");
      adminAuthInstance = getAuth(app);
      return adminAuthInstance;
    }
  } catch (err) {
    console.warn("[Firebase Admin] Auth instance init notice:", err);
  }
  return null;
}

// Safe Proxy exports so top-level imports in Vercel serverless lambdas never fail
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop: string | symbol) {
    const instance = getAdminDb();
    if (!instance) {
      console.warn("[Firebase Admin] Firestore instance requested but unavailable.");
      return () => Promise.resolve(null);
    }
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop: string | symbol) {
    const instance = getAdminAuth();
    if (!instance) {
      console.warn("[Firebase Admin] Auth instance requested but unavailable.");
      return () => Promise.resolve(null);
    }
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export default getAdminApp;
