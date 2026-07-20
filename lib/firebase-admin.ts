import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import crypto from "crypto";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

/** Test if a string is a real, valid RSA private key that can perform crypto signing */
function isValidRsaPrivateKey(rawKey?: string): boolean {
  if (!rawKey || typeof rawKey !== "string") return false;
  if (!rawKey.includes("BEGIN PRIVATE KEY") || rawKey.includes("YOUR_PRIVATE_KEY_HERE")) return false;
  try {
    const formattedKey = rawKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
    const signer = crypto.createSign("SHA256");
    signer.update("awenue_rsa_validation_test");
    signer.sign(formattedKey);
    return true;
  } catch (err) {
    console.warn("[Firebase Admin] RSA private key signature validation failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

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

    const hasValidClientEmail =
      clientEmail &&
      typeof clientEmail === "string" &&
      clientEmail.includes("@") &&
      !clientEmail.includes("xxxxx");

    const hasValidKey = isValidRsaPrivateKey(rawPrivateKey);

    // Only initialize Admin SDK if valid, cryptographically testable service account credentials exist.
    if (projectId && hasValidClientEmail && hasValidKey && rawPrivateKey) {
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

    console.warn("[Firebase Admin] Service account credentials invalid or inactive. Operating in ENV fallback mode.");
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
  get(_target, prop: string | symbol) {
    const instance = getAdminDb();
    if (!instance) {
      throw new Error("Firebase Admin Firestore is not available in current environment.");
    }
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop: string | symbol) {
    const instance = getAdminAuth();
    if (!instance) {
      throw new Error("Firebase Admin Auth is not available in current environment.");
    }
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export default getAdminApp;
