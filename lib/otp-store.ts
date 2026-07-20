import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export interface MemoryOtpChallenge {
  adminEmail: string;
  otpHash: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  used: boolean;
  createdAt: string;
}

// Global in-memory OTP cache singleton anchored to globalThis to survive Next.js HMR reloads
const globalForOtp = globalThis as unknown as {
  __awenueOtpStore?: Map<string, MemoryOtpChallenge>;
};

export const globalOtpStore =
  globalForOtp.__awenueOtpStore || new Map<string, MemoryOtpChallenge>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.__awenueOtpStore = globalOtpStore;
}

export async function createOtpChallenge(email: string, rawOtp: string): Promise<MemoryOtpChallenge> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();
  const nowISO = now.toISOString();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes validity
  const otpHash = crypto.createHash("sha256").update(rawOtp.trim()).digest("hex");

  const challenge: MemoryOtpChallenge = {
    adminEmail: normalizedEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    used: false,
    createdAt: nowISO,
  };

  // 1. Store in Server Memory Map singleton
  globalOtpStore.set(normalizedEmail, challenge);

  // 2. Persist to Firestore if available
  try {
    await adminDb.collection("adminOtpChallenges").add(challenge);
  } catch (err) {
    console.warn("[OTP STORE] Firestore save skipped (using memory store):", err);
  }

  return challenge;
}

export async function getActiveOtpChallenge(email: string): Promise<MemoryOtpChallenge | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check Server Memory Map singleton
  const memChallenge = globalOtpStore.get(normalizedEmail);
  if (memChallenge) {
    return memChallenge;
  }

  // 2. Check Firestore fallback
  try {
    const snap = await adminDb
      .collection("adminOtpChallenges")
      .where("adminEmail", "==", normalizedEmail)
      .get();

    if (!snap.empty) {
      const docs = snap.docs.map((doc) => doc.data() as MemoryOtpChallenge);
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = docs[0];
      // Keep memory map in sync
      globalOtpStore.set(normalizedEmail, latest);
      return latest;
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore query fallback skipped:", err);
  }

  return null;
}

export async function updateOtpChallengeState(
  email: string,
  updates: Partial<MemoryOtpChallenge>
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Update in Server Memory Map singleton
  const memChallenge = globalOtpStore.get(normalizedEmail);
  if (memChallenge) {
    Object.assign(memChallenge, updates);
  }

  // 2. Update in Firestore
  try {
    const snap = await adminDb
      .collection("adminOtpChallenges")
      .where("adminEmail", "==", normalizedEmail)
      .get();

    if (!snap.empty) {
      const batch = adminDb.batch();
      snap.docs.forEach((doc) => {
        if (!doc.data().used) {
          batch.update(doc.ref, updates);
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore state update skipped:", err);
  }
}

export async function invalidatePreviousChallenges(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // Clear memory
  const memChallenge = globalOtpStore.get(normalizedEmail);
  if (memChallenge) {
    memChallenge.used = true;
  }

  // Clear Firestore
  try {
    const snap = await adminDb
      .collection("adminOtpChallenges")
      .where("adminEmail", "==", normalizedEmail)
      .get();

    if (!snap.empty) {
      const batch = adminDb.batch();
      snap.docs.forEach((doc) => {
        if (!doc.data().used) {
          batch.update(doc.ref, { used: true, invalidatedReason: "SUPERSEDED" });
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore invalidation skipped:", err);
  }
}
