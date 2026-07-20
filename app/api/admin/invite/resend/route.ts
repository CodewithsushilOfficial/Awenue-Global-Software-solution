/**
 * POST /api/admin/invite/resend
 *
 * Resend an admin invitation:
 * - Invalidates the existing invitation token
 * - Generates a new secure token
 * - Updates the invitation with new token hash and expiry
 * - Sends a new invitation email
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminFromRequest, logAdminActivity } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendAdminInviteEmail } from "@/lib/email";
import { hasPermission, ROLE_LABELS, type AdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const actor = await getAdminFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasPermission(actor.role, "invite_admins")) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  let invitationId = "";
  try {
    const body = await request.json();
    invitationId = typeof body.invitationId === "string" ? body.invitationId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const invDoc = await db.collection("adminInvitations").doc(invitationId).get();
    if (!invDoc.exists) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const inv = invDoc.data()!;

    if (inv.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted." },
        { status: 400 }
      );
    }

    if (inv.status === "revoked") {
      return NextResponse.json(
        { error: "This invitation has been revoked and cannot be resent." },
        { status: 400 }
      );
    }

    // Generate new secure token
    const rawToken = crypto.randomBytes(48).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();

    // Update invitation with new token and reset status to pending
    await invDoc.ref.update({
      tokenHash,
      expiresAt,
      status: "pending",
      updatedAt: now,
      resentAt: now,
      resentByAdminId: actor.id,
    });

    const normalizedEmail = inv.emailNormalized || inv.email?.toLowerCase();
    const displayName = inv.displayName || "Administrator";
    const role = inv.role as AdminRole;

    // Build accept URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const inviteUrl = `${baseUrl}/admin/invite/accept?token=${rawToken}&invitation=${invitationId}`;

    // Send new invitation email
    let emailSent = false;
    try {
      const emailResult = await sendAdminInviteEmail({
        recipientEmail: normalizedEmail,
        fullName: displayName,
        role: ROLE_LABELS[role] || role,
        invitedByName: actor.displayName,
        inviteUrl,
      });
      emailSent = emailResult.success;
    } catch (mailErr) {
      console.error("[RESEND INVITE] Email error:", mailErr);
    }

    await logAdminActivity({
      actorAdminId: actor.id,
      action: "INVITATION_RESENT",
      metadata: {
        invitationId,
        email: normalizedEmail,
        emailSent: emailSent ? "true" : "false",
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message: `Invitation resent to ${normalizedEmail}.`,
        emailSent,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[RESEND INVITE] Error:", err);
    return NextResponse.json({ error: "Failed to resend invitation." }, { status: 500 });
  }
}
