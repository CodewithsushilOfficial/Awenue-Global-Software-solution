/**
 * POST /api/admin/send-otp
 *
 * Legacy send-otp endpoint alias.
 * Delegates directly to POST /api/admin/otp/request handler
 * ensuring backwards compatibility without duplicate code.
 */

import { NextRequest } from "next/server";
import { POST as requestOtpHandler } from "@/app/api/admin/otp/request/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return requestOtpHandler(request);
}
