/**
 * GET /api/admin/debug/smtp-test
 *
 * Development-only endpoint to verify SMTP connectivity.
 * Sends a test email to ADMIN_EMAIL.
 * AUTOMATICALLY DISABLED IN PRODUCTION.
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Hard-block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug endpoint disabled in production." },
      { status: 404 }
    );
  }

  const results: Record<string, string | boolean | number> = {};

  // 1. Check env vars
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const notificationFrom = process.env.NOTIFICATION_FROM || smtpUser;

  results["SMTP_HOST"] = smtpHost;
  results["SMTP_PORT"] = smtpPort;
  results["SMTP_USER"] = smtpUser ? smtpUser : "❌ NOT SET";
  results["SMTP_PASS"] = smtpPass ? `✅ SET (${smtpPass.length} chars)` : "❌ NOT SET";
  results["ADMIN_EMAIL"] = adminEmail || "❌ NOT SET";
  results["NOTIFICATION_FROM"] = notificationFrom || "❌ NOT SET";

  // 2. Firebase Admin creds check
  const fbProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "";
  const fbClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "";
  const fbPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
  const hasRealFirebaseCreds =
    fbProjectId &&
    fbClientEmail &&
    fbPrivateKey.includes("BEGIN PRIVATE KEY") &&
    !fbPrivateKey.includes("YOUR_PRIVATE_KEY_HERE");

  results["FIREBASE_ADMIN_CONFIGURED"] = hasRealFirebaseCreds;
  results["FIREBASE_PROJECT_ID"] = fbProjectId || "❌ NOT SET";
  results["ENV_ADMIN_FALLBACK_ACTIVE"] = !hasRealFirebaseCreds;

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({
      status: "error",
      error: "SMTP_USER or SMTP_PASS not set in environment",
      config: results,
    });
  }

  if (!adminEmail) {
    return NextResponse.json({
      status: "error",
      error: "ADMIN_EMAIL not set — can't send test email",
      config: results,
    });
  }

  // 3. Try to send a test email
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser.trim(),
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection first
    await transporter.verify();
    results["SMTP_CONNECTION"] = "✅ Connected";

    // Send test email
    const testOtp = "123456";
    const info = await transporter.sendMail({
      from: notificationFrom,
      to: adminEmail,
      subject: "AWENUE SMTP Test — If you received this, email is working!",
      text: `SMTP Test Email\n\nYour SMTP is correctly configured!\n\nTest OTP (not real): ${testOtp}\n\nSMTP User: ${smtpUser}\nSent at: ${new Date().toISOString()}`,
      html: `<div style="font-family:Arial;padding:20px;background:#0A0F0D;color:#fff;border-radius:12px;max-width:500px">
        <h2 style="color:#09B850">✅ SMTP Working!</h2>
        <p>Your Nodemailer SMTP configuration is correct.</p>
        <p><strong>SMTP User:</strong> ${smtpUser}</p>
        <p><strong>Test OTP:</strong> <code style="font-size:24px;color:#09B850;letter-spacing:4px">${testOtp}</code></p>
        <p style="color:#A7B0AC;font-size:12px">Sent at: ${new Date().toISOString()}</p>
      </div>`,
    });

    results["EMAIL_SENT"] = true;
    results["MESSAGE_ID"] = info.messageId || "unknown";
    results["SENT_TO"] = adminEmail;

    return NextResponse.json({
      status: "success",
      message: `Test email sent to ${adminEmail} — check your inbox!`,
      config: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results["SMTP_ERROR"] = message;

    return NextResponse.json({
      status: "error",
      error: message,
      hint: message.includes("Invalid login") || message.includes("Username and Password not accepted")
        ? "❌ App Password is wrong. Go to myaccount.google.com → Security → App Passwords and generate a new one. Paste it in SMTP_PASS (no spaces)."
        : message.includes("self-signed") || message.includes("ECONNREFUSED")
        ? "❌ SMTP connection failed. Check SMTP_HOST and SMTP_PORT."
        : "❌ Unknown error — check the error message above.",
      config: results,
    });
  }
}
