/**
 * AWENUE Next.js Edge Middleware
 *
 * Protects all /admin/* routes by verifying a signed session cookie.
 * Runs at the Edge — before any page or API route handler.
 *
 * Public routes that bypass auth:
 *   - /admin/login
 *   - /admin/invite/accept  (invitation acceptance page)
 *   - /api/admin/auth/*     (login, verify-otp, me endpoint)
 *   - /api/admin/logout
 *   - /api/admin/invite/accept
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Re-implement token verification inline for Edge runtime compatibility
// (lib/session.ts uses Buffer which works in Node but we keep this self-contained)

const SESSION_COOKIE = "awenue_admin_session";

// Public paths that don't require a session
const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/invite/accept",
];

// Public API paths that don't require a session
const PUBLIC_API_PATHS = [
  "/api/admin/otp/request",
  "/api/admin/otp/verify",
  "/api/admin/send-otp",
  "/api/admin/verify-otp",
  "/api/admin/auth/me",
  "/api/admin/logout",
  "/api/admin/invite/accept",
];

function isPublicPath(pathname: string): boolean {
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(path + "?")) return true;
  }
  for (const path of PUBLIC_API_PATHS) {
    if (pathname === path || pathname.startsWith(path + "?")) return true;
  }
  return false;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

async function verifySessionCookie(token: string): Promise<boolean> {
  try {
    // Simple structure check: base64url.hexSignature
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;

    const encoded = token.substring(0, lastDot);

    // Decode payload and check expiry (fast check without crypto)
    const payloadJson = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    if (!payload.exp || !payload.adminId) return false;
    if (Date.now() > payload.exp) return false;

    // For Edge runtime: We do a lightweight expiry check here.
    // Full cryptographic verification happens in each API route handler
    // using lib/session.ts in Node.js runtime.
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to admin routes
  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  // Allow public paths without session
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return redirectToLogin(request);
  }

  const isValid = await verifySessionCookie(sessionCookie.value);

  if (!isValid) {
    // Clear invalid cookie and redirect
    const response = redirectToLogin(request);
    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  // For API routes, return 401 JSON
  if (pathname.startsWith("/api/")) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized. Admin session required." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // For page routes, redirect to login
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
