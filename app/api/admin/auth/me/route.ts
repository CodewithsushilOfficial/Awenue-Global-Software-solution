/**
 * GET /api/admin/auth/me
 *
 * Returns the current admin's identity from their session cookie.
 * Used by the client-side AuthProvider to hydrate session state.
 * Returns 401 if no valid session exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);

    if (!admin) {
      return NextResponse.json(
        { error: "No active admin session." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        displayName: admin.displayName,
        status: admin.status,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AUTH/ME] Error:", err);
    return NextResponse.json(
      { error: "Session verification failed." },
      { status: 500 }
    );
  }
}
