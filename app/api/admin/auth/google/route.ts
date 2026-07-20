/**
 * POST /api/admin/auth/google
 *
 * Verifies Firebase Google Auth ID Token and issues signed HttpOnly session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { authorizeGoogleAdmin, logAdminActivity } from "@/lib/admin-auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { idToken } = body;
    if (typeof idToken !== "string" || !idToken.trim()) {
      return NextResponse.json(
        { error: "Firebase ID token is required." },
        { status: 400 }
      );
    }

    // 1. Authorize Google Admin via Firebase Admin SDK & Firestore
    const authResult = await authorizeGoogleAdmin(idToken.trim());

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 403 }
      );
    }

    const { admin } = authResult;

    // 2. Create signed HttpOnly session token
    const sessionToken = createSessionToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      displayName: admin.displayName,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Authentication successful.",
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          displayName: admin.displayName,
          status: admin.status,
        },
      },
      { status: 200 }
    );

    // 3. Set HttpOnly session cookie
    setSessionCookie(response, sessionToken);

    // 4. Audit log
    await logAdminActivity({
      actorAdminId: admin.id,
      action: "GOOGLE_AUTH_SUCCESS",
      metadata: {
        email: admin.email,
        role: admin.role,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      },
    }).catch(() => {});

    return response;
  } catch (err: unknown) {
    console.error("[AUTH/GOOGLE] Error handling Google authentication:", err);
    return NextResponse.json(
      { error: "Server authentication error. Please try again." },
      { status: 500 }
    );
  }
}
