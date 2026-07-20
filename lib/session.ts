/**
 * AWENUE Admin Session — Server-Side JWT Session Management
 *
 * Signs and verifies HttpOnly session cookies.
 * Uses HMAC-SHA256 with SESSION_SECRET from environment.
 * No third-party JWT library needed.
 */

import crypto from "crypto";

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: string;
  displayName: string;
  iat: number; // issued at (unix ms)
  exp: number; // expires at (unix ms)
}

// Session duration: 8 hours
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.OTP_SECRET_KEY ||
  "awenue_session_secret_change_in_production_v1";

const COOKIE_NAME = "awenue_admin_session";

function getSecret(): string {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.SESSION_SECRET
  ) {
    console.error(
      "[SESSION] CRITICAL: SESSION_SECRET env var is not set in production!"
    );
  }
  return SESSION_SECRET;
}

/** Create a signed session token string */
export function createSessionToken(payload: Omit<AdminSessionPayload, "iat" | "exp">): string {
  const now = Date.now();
  const fullPayload: AdminSessionPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_DURATION_MS,
  };

  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
}

/** Verify and parse a session token. Returns null if invalid/expired. */
export function verifySessionToken(token: string): AdminSessionPayload | null {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;

    const encoded = token.substring(0, lastDot);
    const providedSig = token.substring(lastDot + 1);

    // Timing-safe signature comparison
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(encoded)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSig, "hex");
    const providedBuf = Buffer.from(providedSig, "hex");

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as AdminSessionPayload;

    // Check expiry
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Set the session cookie on a NextResponse */
export function setSessionCookie(
  response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } },
  token: string
): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

/** Clear the session cookie */
export function clearSessionCookie(
  response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } }
): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Extract and verify session from a request */
export function getSessionFromRequest(
  request: { cookies: { get: (name: string) => { value: string } | undefined } }
): AdminSessionPayload | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

export { COOKIE_NAME };
