import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  try {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "awenue-global";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    const isValidPrivateKey =
      rawPrivateKey &&
      typeof rawPrivateKey === "string" &&
      rawPrivateKey.includes("BEGIN PRIVATE KEY") &&
      !rawPrivateKey.includes("YOUR_PRIVATE_KEY_HERE");

    const hasValidClientEmail =
      clientEmail &&
      typeof clientEmail === "string" &&
      clientEmail.includes("@") &&
      !clientEmail.includes("xxxxx");

    // Only initialize Admin SDK if valid service account credentials are provided.
    // Initializing without credentials on Vercel/non-GCP environments causes
    // Firestore queries to hang waiting for the GCP metadata server, resulting in 500 timeouts.
    if (projectId && hasValidClientEmail && isValidPrivateKey) {
      try {
        const privateKey = rawPrivateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        return adminApp;
      } catch (err) {
        console.warn("[Firebase Admin] Service account cert init failed:", err);
        return null;
      }
    }

    console.warn("[Firebase Admin] No valid service account credentials found. Server-side Admin SDK is inactive (ENV fallback active).");
    return null;
  } catch (err) {
    console.warn("[Firebase Admin] App init exception:", err);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDbInstance) return adminDbInstance;
  try {
    const app = getAdminApp();
    if (app) {
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
  get(_target, prop) {
    const instance = getAdminDb();
    if (!instance) {
      throw new Error("Firebase Admin Firestore is not available in current environment.");
    }
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getAdminAuth();
    if (!instance) {
      throw new Error("Firebase Admin Auth is not available in current environment.");
    }
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export default getAdminApp;
