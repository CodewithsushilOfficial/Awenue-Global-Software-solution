/**
 * lib/email-service.ts — Transactional Email Notification Layer for AWENUE
 *
 * Sends server-side email notifications for:
 * 1. Inquiry Notifications & Customer Confirmations
 * 2. Admin Pre-Authorization & Invitation Email Delivery
 *
 * Supports Resend, Brevo, and SMTP providers.
 * Guaranteed non-blocking: Never throws errors that disrupt Firestore pre-authorization.
 */

export interface InquiryEmailPayload {
  type: "Project Inquiry" | "Free Consultation" | "General Query";
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  projectType?: string;
  consultationType?: string;
  budget?: string;
  message: string;
  createdAt: string;
}

export interface AdminInvitationEmailPayload {
  toEmail: string;
  fullName: string;
  roleLabel: string;
  invitationUrl: string;
  invitedByName: string;
}

export async function sendInquiryNotificationEmail(payload: InquiryEmailPayload): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      "codewithsushil7236@gmail.com";

    const apiKey =
      process.env.RESEND_API_KEY ||
      process.env.BREVO_API_KEY ||
      process.env.TRANSACTIONAL_EMAIL_API_KEY;

    if (!apiKey) {
      console.log(
        `[EMAIL SERVICE] Notification skipped (No RESEND_API_KEY/BREVO_API_KEY set). Lead for ${payload.email} stored in Firestore.`
      );
      return { success: false, error: "No email provider API key configured." };
    }

    // 1. Resend API Integration
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AWENUE Website <notifications@awenueglobalsoftwaresolutions.in>",
          to: [adminEmail],
          subject: `[AWENUE Lead] ${payload.type} from ${payload.fullName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #09b850;">New AWENUE Lead Received</h2>
              <p><strong>Type:</strong> ${payload.type}</p>
              <p><strong>Name:</strong> ${payload.fullName}</p>
              <p><strong>Email:</strong> ${payload.email}</p>
              <p><strong>Phone:</strong> ${payload.phone || "N/A"}</p>
              <p><strong>Company:</strong> ${payload.companyName || "N/A"}</p>
              ${payload.projectType ? `<p><strong>Project Type:</strong> ${payload.projectType}</p>` : ""}
              ${payload.consultationType ? `<p><strong>Consultation Topic:</strong> ${payload.consultationType}</p>` : ""}
              ${payload.budget ? `<p><strong>Budget:</strong> ${payload.budget}</p>` : ""}
              <p><strong>Message / Requirements:</strong></p>
              <blockquote style="background: #f9f9f9; padding: 12px; border-left: 3px solid #09b850;">${payload.message}</blockquote>
              <hr />
              <p style="font-size: 12px; color: #777;">Received at ${payload.createdAt}</p>
            </div>
          `,
        }),
      });

      if (payload.email && payload.email.includes("@")) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AWENUE Global Solutions <support@awenueglobalsoftwaresolutions.in>",
            to: [payload.email],
            subject: `We've Received Your ${payload.type} Request — AWENUE`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #09b850;">Thank You for Reaching Out to AWENUE!</h2>
                <p>Dear ${payload.fullName},</p>
                <p>We have successfully received your <strong>${payload.type}</strong> submission.</p>
                <p>Our team of technical architects will review your requirements and get in touch with you shortly.</p>
                <br />
                <p>Best Regards,</p>
                <p><strong>AWENUE Global Software Solutions Team</strong><br /><a href="https://www.awenueglobalsoftwaresolutions.in">https://www.awenueglobalsoftwaresolutions.in</a></p>
              </div>
            `,
          }),
        });
      }

      return { success: true };
    }

    // 2. Brevo API Integration
    if (process.env.BREVO_API_KEY) {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "AWENUE Website", email: "notifications@awenueglobalsoftwaresolutions.in" },
          to: [{ email: adminEmail }],
          subject: `[AWENUE Lead] ${payload.type} from ${payload.fullName}`,
          htmlContent: `<p>New ${payload.type} from ${payload.fullName} (${payload.email}): ${payload.message}</p>`,
        }),
      });

      return { success: true };
    }

    return { success: false, error: "No transactional email provider configured." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown email dispatch error";
    console.warn("[EMAIL SERVICE] Non-blocking dispatch notice:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Dispatch Admin Invitation Email via SMTP or Resend API.
 * Non-blocking: Returns delivery status without throwing.
 */
export async function sendAdminInvitationEmail(payload: AdminInvitationEmailPayload): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.ADMIN_EMAIL || "notifications@awenueglobalsoftwaresolutions.in";
    const fromName = process.env.SMTP_FROM_NAME || "AWENUE Global Software Solutions";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1f293d; border-radius: 16px; background-color: #0b0f17; color: #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #09b850; font-size: 24px; font-weight: 900; margin: 0;">AWENUE GLOBAL</h1>
          <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Software Solutions & Admin Control Panel</p>
        </div>
        
        <div style="background-color: #151c2c; border: 1px solid #1f293d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin-top: 0;">You've Been Invited to Join AWENUE Admin</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${payload.fullName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            <strong>${payload.invitedByName}</strong> has pre-authorized your Google account to join the AWENUE Admin Dashboard.
          </p>
          <div style="background-color: #0b0f17; border-left: 4px solid #09b850; padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">Assigned Role: <strong style="color: #09b850;">${payload.roleLabel}</strong></p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #9ca3af;">Authorized Google Account: <strong style="color: #ffffff;">${payload.toEmail}</strong></p>
          </div>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Click the button below to accept your invitation and activate your account access:
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${payload.invitationUrl}" style="background-color: #09b850; color: #0b0f17; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; display: inline-block;">
              Accept Invitation & Sign In
            </a>
          </div>

          <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 0;">
            <strong>Security Notice:</strong> For security, you must sign in using the exact Google account (<code>${payload.toEmail}</code>) this invitation was issued for. If you cannot access the email link, you can also sign in directly at <a href="https://www.awenueglobalsoftwaresolutions.in/admin/login" style="color: #09b850;">https://www.awenueglobalsoftwaresolutions.in/admin/login</a> using Google.
          </p>
        </div>

        <div style="text-align: center; border-top: 1px solid #1f293d; pt: 16px; font-size: 11px; color: #6b7280;">
          <p style="margin: 0;">Avenue Global Software Solutions &copy; 2026. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">If you were not expecting this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    // 1. Check Resend API first if RESEND_API_KEY set
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [payload.toEmail],
          subject: "You've Been Invited to Join AWENUE Admin",
          html: emailHtml,
        }),
      });

      if (res.ok) {
        return { success: true };
      }
    }

    // 2. Check Brevo API if BREVO_API_KEY set
    if (process.env.BREVO_API_KEY) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: payload.toEmail, name: payload.fullName }],
          subject: "You've Been Invited to Join AWENUE Admin",
          htmlContent: emailHtml,
        }),
      });

      if (res.ok) {
        return { success: true };
      }
    }

    // 3. SMTP Transporter using nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: payload.toEmail,
        subject: "You've Been Invited to Join AWENUE Admin",
        html: emailHtml,
      });

      return { success: true };
    }

    console.log(`[INVITATION EMAIL] No active SMTP/Resend provider configured for ${payload.toEmail}. Firestore pre-authorization active.`);
    return { success: false, error: "No active SMTP or Email API key configured." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP delivery exception";
    console.warn("[INVITATION EMAIL] Non-blocking SMTP dispatch notice:", msg);
    return { success: false, error: msg };
  }
}
