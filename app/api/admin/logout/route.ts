import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getAdminById, logAdminActivity } from "@/lib/admin-auth";
import { clearSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Try to get session info for audit log before clearing
    const session = getSessionFromRequest(request);

    if (session) {
      const admin = await getAdminById(session.adminId).catch(() => null);
      await logAdminActivity({
        actorAdminId: session.adminId,
        action: "ADMIN_LOGOUT",
        metadata: {
          email: session.email,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          displayName: admin?.displayName || session.displayName,
        },
      }).catch(() => {});
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully." },
      { status: 200 }
    );

    clearSessionCookie(response);
    return response;
  } catch (err: unknown) {
    console.error("[LOGOUT] Error:", err);
    const response = NextResponse.json(
      { success: false, error: "Logout failed." },
      { status: 500 }
    );
    // Still clear cookie even on error
    clearSessionCookie(response);
    return response;
  }
}
