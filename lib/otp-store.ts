import crypto from "crypto";

export interface OtpChallenge {
  adminId: string;
  emailNormalized: string;
  otpHash: string;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  used: boolean;
  createdAt: string;
}

// OTP validity: 5 minutes
const OTP_TTL_MS = 5 * 60 * 1000;
// Max verification attempts
const MAX_ATTEMPTS = 5;

// In-memory store singleton anchored to globalThis
// (works across Next.js hot reloads in development)
const globalForOtp = globalThis as unknown as {
  __awenueOtpStore?: Map<string, OtpChallenge>;
};

export const globalOtpStore: Map<string, OtpChallenge> =
  globalForOtp.__awenueOtpStore || new Map<string, OtpChallenge>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.__awenueOtpStore = globalOtpStore;
}

/** Helper to wrap async operations with a safety timeout */
function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Operation timeout")), ms);
  });

  promise.catch(() => {});

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Hash a raw OTP value with SHA-256 */
export function hashOtp(rawOtp: string): string {
  return crypto.createHash("sha256").update(rawOtp.trim()).digest("hex");
}

/**
 * Create a new OTP challenge for an admin.
 * Stores hashed OTP only — never the raw value.
 */
export async function createOtpChallenge(
  adminId: string,
  emailNormalized: string,
  rawOtp: string
): Promise<OtpChallenge> {
  const now = new Date();
  const challenge: OtpChallenge = {
    adminId,
    emailNormalized,
    otpHash: hashOtp(rawOtp),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    used: false,
    createdAt: now.toISOString(),
  };

  // Store in memory map
  globalOtpStore.set(emailNormalized, challenge);

  // Persist to Firestore asynchronously with timeout safety
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      // Invalidate old challenges first
      const oldSnap = await withTimeout(
        db
          .collection("adminOtpChallenges")
          .where("emailNormalized", "==", emailNormalized)
          .where("used", "==", false)
          .get()
      );

      if (!oldSnap.empty) {
        const batch = db.batch();
        oldSnap.docs.forEach((doc) => {
          batch.update(doc.ref, { used: true, invalidatedReason: "SUPERSEDED" });
        });
        await withTimeout(batch.commit());
      }

      await withTimeout(db.collection("adminOtpChallenges").add(challenge));
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore save skipped (memory store active):", err);
  }

  return challenge;
}

/**
 * Get the active (non-expired, non-used) OTP challenge for an email.
 */
export async function getActiveOtpChallenge(
  emailNormalized: string
): Promise<OtpChallenge | null> {
  const now = new Date();

  // Check memory first
  const memChallenge = globalOtpStore.get(emailNormalized);
  if (memChallenge && !memChallenge.used && new Date(memChallenge.expiresAt) > now) {
    return memChallenge;
  }

  // Fallback to Firestore with timeout safety
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(
        db
          .collection("adminOtpChallenges")
          .where("emailNormalized", "==", emailNormalized)
          .where("used", "==", false)
          .limit(1)
          .get()
      );

      if (!snap.empty) {
        const data = snap.docs[0].data() as OtpChallenge;
        if (new Date(data.expiresAt) > now) {
          globalOtpStore.set(emailNormalized, data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore query fallback skipped:", err);
  }

  return null;
}

/**
 * Increment attempt count. Returns updated challenge or null if over limit.
 */
export async function incrementOtpAttempt(
  emailNormalized: string
): Promise<OtpChallenge | null> {
  const challenge = await getActiveOtpChallenge(emailNormalized);
  if (!challenge) return null;

  challenge.attempts += 1;

  // Update memory
  globalOtpStore.set(emailNormalized, challenge);

  // Update Firestore with timeout safety
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(
        db
          .collection("adminOtpChallenges")
          .where("emailNormalized", "==", emailNormalized)
          .where("used", "==", false)
          .limit(1)
          .get()
      );
      if (!snap.empty) {
        await withTimeout(snap.docs[0].ref.update({ attempts: challenge.attempts }));
      }
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore attempt update skipped:", err);
  }

  return challenge;
}

/**
 * Mark a challenge as used (consumed after successful verification).
 */
export async function markOtpUsed(emailNormalized: string): Promise<void> {
  const challenge = globalOtpStore.get(emailNormalized);
  if (challenge) {
    challenge.used = true;
  }

  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(
        db
          .collection("adminOtpChallenges")
          .where("emailNormalized", "==", emailNormalized)
          .where("used", "==", false)
          .get()
      );
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((doc) => {
          batch.update(doc.ref, { used: true });
        });
        await withTimeout(batch.commit());
      }
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore markOtpUsed skipped:", err);
  }
}

/**
 * Invalidate all active challenges for an email (call before issuing a new one).
 */
export async function invalidatePreviousChallenges(emailNormalized: string): Promise<void> {
  const challenge = globalOtpStore.get(emailNormalized);
  if (challenge) {
    challenge.used = true;
  }

  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(
        db
          .collection("adminOtpChallenges")
          .where("emailNormalized", "==", emailNormalized)
          .where("used", "==", false)
          .get()
      );
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((doc) => {
          batch.update(doc.ref, { used: true, invalidatedReason: "SUPERSEDED" });
        });
        await withTimeout(batch.commit());
      }
    }
  } catch (err) {
    console.warn("[OTP STORE] Firestore invalidation skipped:", err);
  }
}
