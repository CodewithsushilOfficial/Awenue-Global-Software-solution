/**
 * POST /api/admin/verify-otp
 *
 * Legacy verification endpoint alias.
 * Delegates directly to POST /api/admin/otp/verify handler
 * ensuring backwards compatibility without duplicate code.
 */

import { NextRequest } from "next/server";
import { POST as verifyOtpHandler } from "@/app/api/admin/otp/verify/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return verifyOtpHandler(request);
}
