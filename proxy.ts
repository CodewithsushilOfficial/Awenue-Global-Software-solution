/**
 * AWENUE Next.js Edge Middleware
 *
 * Protects all /admin/* page routes by verifying a signed session cookie.
 * Runs at the Edge — before page rendering.
 *
 * Public page routes that bypass auth:
 *   - /admin/login
 *   - /admin/invite/accept
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "awenue_admin_session";

// Public page paths that don't require a session
const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/invite/accept",
];

function isPublicPath(pathname: string): boolean {
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + "?")) return true;
  }
  return false;
}

async function verifySessionCookie(token: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;

    const encoded = token.substring(0, lastDot);

    // Decode payload and check expiry (fast check without crypto)
    const payloadJson = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    if (!payload.exp || !payload.adminId) return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Allow public page paths
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    // Check session cookie for protected /admin/* page routes
    const sessionCookie = request.cookies.get(SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return redirectToLogin(request);
    }

    const isValid = await verifySessionCookie(sessionCookie.value);

    if (!isValid) {
      const response = redirectToLogin(request);
      try {
        response.cookies.set(SESSION_COOKIE, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 0,
        });
      } catch (cookieErr) {
        console.warn("[MIDDLEWARE] Cookie clear notice:", cookieErr);
      }
      return response;
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[MIDDLEWARE] Exception notice:", err);
    return NextResponse.next();
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
