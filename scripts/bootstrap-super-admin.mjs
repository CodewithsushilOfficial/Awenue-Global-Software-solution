/**
 * AWENUE Super Admin Bootstrap Script
 *
 * Creates the first Super Admin account using Firebase Admin SDK.
 * This is a one-time, idempotent operation to provision the initial
 * Super Admin who can then invite all other administrators.
 *
 * Usage:
 *   node scripts/bootstrap-super-admin.mjs
 *
 * Required environment variables in .env.local:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY
 *   ADMIN_EMAIL (the super admin email)
 *   ADMIN_DISPLAY_NAME (optional, defaults to "Super Administrator")
 *
 * SECURITY NOTES:
 * - Run this ONCE on initial setup
 * - Do NOT expose this script as a public API endpoint
 * - Do NOT commit real credentials to source control
 * - ADMIN_EMAIL and credentials must come from environment, not hard-coded
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv package required in ESM)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
    console.log("[BOOTSTRAP] Loaded .env.local");
  } catch {
    console.warn("[BOOTSTRAP] Could not load .env.local — using existing env vars");
  }
}

loadEnv();

const { initializeApp, getApps, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");

// ── Configuration ──────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME?.trim() || "Super Administrator";
const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const RAW_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

// ── Validation ─────────────────────────────────────────────────────────────

if (!ADMIN_EMAIL || !ADMIN_EMAIL.includes("@")) {
  console.error("[BOOTSTRAP] ❌ ADMIN_EMAIL environment variable is required.");
  process.exit(1);
}

if (!PROJECT_ID || !CLIENT_EMAIL || !RAW_KEY) {
  console.error(
    "[BOOTSTRAP] ❌ Firebase Admin credentials missing.\n" +
    "  Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY"
  );
  process.exit(1);
}

if (RAW_KEY.includes("YOUR_PRIVATE_KEY_HERE") || RAW_KEY.length < 100) {
  console.error("[BOOTSTRAP] ❌ FIREBASE_ADMIN_PRIVATE_KEY appears to be a placeholder, not a real key.");
  process.exit(1);
}

// ── Initialize Firebase Admin ──────────────────────────────────────────────

const normalizedEmail = ADMIN_EMAIL.toLowerCase();
const privateKey = RAW_KEY.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

let app;
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp({
    credential: cert({ projectId: PROJECT_ID, clientEmail: CLIENT_EMAIL, privateKey }),
  });
}

const db = getFirestore(app);
const auth = getAuth(app);

console.log(`\n[BOOTSTRAP] 🚀 Starting Super Admin bootstrap for: ${normalizedEmail}`);
console.log(`[BOOTSTRAP]    Project: ${PROJECT_ID}`);
console.log(`[BOOTSTRAP]    Display Name: ${ADMIN_DISPLAY_NAME}\n`);

// ── Step 1: Create or get Firebase Auth user ───────────────────────────────

let uid;
try {
  const existing = await auth.getUserByEmail(normalizedEmail);
  uid = existing.uid;
  console.log(`[BOOTSTRAP] ✅ Firebase Auth user already exists. UID: ${uid}`);
} catch (err) {
  if (err.code === "auth/user-not-found") {
    const newUser = await auth.createUser({
      email: normalizedEmail,
      emailVerified: true,
      displayName: ADMIN_DISPLAY_NAME,
    });
    uid = newUser.uid;
    console.log(`[BOOTSTRAP] ✅ Created Firebase Auth user. UID: ${uid}`);
  } else {
    throw err;
  }
}

// ── Step 2: Set custom claims ──────────────────────────────────────────────

await auth.setCustomUserClaims(uid, {
  admin: true,
  role: "super_admin",
});
console.log(`[BOOTSTRAP] ✅ Custom claims set: { admin: true, role: "super_admin" }`);

// ── Step 3: Create or update Firestore admin record ───────────────────────

const adminDocId = `admin_${uid.substring(0, 12)}`;
const now = new Date().toISOString();

const existingDoc = await db.collection("admins").doc(adminDocId).get();

if (existingDoc.exists) {
  await db.collection("admins").doc(adminDocId).update({
    uid,
    email: normalizedEmail,
    emailNormalized: normalizedEmail,
    displayName: ADMIN_DISPLAY_NAME,
    role: "super_admin",
    status: "active",
    updatedAt: now,
  });
  console.log(`[BOOTSTRAP] ✅ Updated existing Firestore admin record: ${adminDocId}`);
} else {
  await db.collection("admins").doc(adminDocId).set({
    uid,
    email: normalizedEmail,
    emailNormalized: normalizedEmail,
    displayName: ADMIN_DISPLAY_NAME,
    role: "super_admin",
    status: "active",
    invitedBy: "System Bootstrap",
    invitedByAdminId: null,
    invitedAt: now,
    activatedAt: now,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`[BOOTSTRAP] ✅ Created new Firestore admin record: ${adminDocId}`);
}

// ── Step 4: Activity log ───────────────────────────────────────────────────

await db.collection("adminActivityLogs").add({
  actorAdminId: adminDocId,
  action: "SUPER_ADMIN_BOOTSTRAPPED",
  safeMetadata: {
    email: normalizedEmail,
    uid,
    projectId: PROJECT_ID,
  },
  timestamp: now,
});

console.log(`\n[BOOTSTRAP] ✅ Super Admin bootstrap complete!`);
console.log(`[BOOTSTRAP]    Email:      ${normalizedEmail}`);
console.log(`[BOOTSTRAP]    UID:        ${uid}`);
console.log(`[BOOTSTRAP]    Doc ID:     ${adminDocId}`);
console.log(`[BOOTSTRAP]    Role:       super_admin`);
console.log(`[BOOTSTRAP]    Status:     active`);
console.log(`\n[BOOTSTRAP] 👉 You can now log in at /admin/login using Email OTP.\n`);

process.exit(0);
