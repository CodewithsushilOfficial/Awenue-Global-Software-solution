import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminFromRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const actor = await getAdminFromRequest(request);
    if (!actor) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    // 2. Perform revalidation
    revalidatePath("/");
    console.log(`[REVALIDATE] Homepage revalidated by Admin: ${actor.email}`);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("[REVALIDATE] Error performing revalidation:", err);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}

// Support GET for simple integrations if needed
export async function GET(request: NextRequest) {
  return POST(request);
}
