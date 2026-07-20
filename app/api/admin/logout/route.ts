import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully." },
      { status: 200 }
    );

    // Expire/Clear session cookie
    response.cookies.set({
      name: "awenue_admin_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    console.error("API /api/admin/logout error:", err);
    return NextResponse.json({ success: false, error: "Logout failed." }, { status: 500 });
  }
}
