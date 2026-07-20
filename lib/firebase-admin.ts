import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App;

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "awenue-global";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const isValidPrivateKey =
    rawPrivateKey &&
    rawPrivateKey.includes("BEGIN PRIVATE KEY") &&
    !rawPrivateKey.includes("YOUR_PRIVATE_KEY_HERE");

  if (projectId && clientEmail && isValidPrivateKey) {
    try {
      const privateKey = rawPrivateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.warn("Failed to initialize Firebase Admin with service account key, falling back to default app:", err);
      adminApp = initializeApp({ projectId });
    }
  } else {
    // Fallback default initialization for dev/build environments
    adminApp = initializeApp({ projectId });
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export default adminApp;
