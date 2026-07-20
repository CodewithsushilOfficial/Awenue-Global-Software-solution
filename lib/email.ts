import nodemailer from "nodemailer";

interface ProjectInquiryEmailData {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  projectType: string;
  budget: string;
  message: string;
  createdAt: string;
}

interface ConsultationEmailData {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  consultationType: string;
  message: string;
  createdAt: string;
}

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "awenueglobalsoftwaresolutions@gmail.com";
  const rawPass = process.env.SMTP_PASS || "wrtedakkxxxlvqjd";

  const pass = rawPass.replace(/\s+/g, "").trim();

  if (!user || !pass) {
    console.warn("[Nodemailer] Missing SMTP_USER or SMTP_PASS environment variables.");
    return null;
  }

  const isGmail = host.includes("gmail") || user.toLowerCase().endsWith("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user.trim(),
        pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: user.trim(),
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });
}

function escapeHtml(text: string = ""): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendAdminOtpEmail(email: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const fromEmail = process.env.NOTIFICATION_FROM || `"AWENUE Global Software Solutions" <awenueglobalsoftwaresolutions@gmail.com>`;

  if (!transporter) {
    console.warn("[Nodemailer] SMTP is not configured. Email OTP notification skipped.");
    return { success: false, error: "SMTP not configured" };
  }

  console.log(`[Nodemailer] Initiating Admin OTP email delivery to: ${email}`);

  try {
    const subject = `Your AWENUE Admin Verification Code`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 900;">AWEN<span style="color: #09B850;">UE</span> Global</h1>
          <p style="color: #A7B0AC; font-size: 13px; margin-top: 4px;">Avenue Global Software Solutions</p>
        </div>
        <p style="color: #A7B0AC; font-size: 14px; margin-bottom: 12px;">Your AWENUE Admin verification code is:</p>
        <div style="background-color: #121917; border: 1px solid rgba(9,184,80,0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
          <div style="font-size: 38px; font-weight: 900; color: #0BCF5F; letter-spacing: 8px; margin: 0;">${otpCode}</div>
        </div>
        <p style="color: #A7B0AC; font-size: 13px; line-height: 1.5;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="color: #575A7B; font-size: 12px; line-height: 1.5;">If you did not request this login, you can safely ignore this email.</p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); color: #A7B0AC; font-size: 13px;">
          — <strong>AWENUE</strong><br/>
          <span style="color: #09B850;">Avenue Global Software Solutions</span>
        </div>
      </div>
    `;

    const text = `Your AWENUE Admin verification code is:\n\n${otpCode}\n\nThis code expires in 5 minutes.\n\nIf you did not request this login, you can safely ignore this email.\n\n— AWENUE\nAvenue Global Software Solutions`;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`[Nodemailer] Admin OTP email sent successfully to ${email}. MessageID:`, info.messageId);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email send failure";
    console.error("[Nodemailer] Failed to send Admin OTP email:", err);
    return { success: false, error: message };
  }
}

export async function sendProjectInquiryEmails(data: ProjectInquiryEmailData): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || "Codewithsushil7236@gmail.com";
  const fromEmail = process.env.NOTIFICATION_FROM || `"AWENUE Lead System" <Support@awenueglobalsoftwaresolutions.in>`;

  if (!transporter) {
    console.warn("[Nodemailer] SMTP is not configured in environment variables. Email notification skipped.");
    return { success: false, error: "SMTP not configured" };
  }

  try {
    // 1. Admin Notification Email
    const adminSubject = `New Project Inquiry — ${data.projectType} — ${data.fullName}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 24px; border-radius: 8px;">
        <h2 style="color: #09B850; border-bottom: 2px solid #09B850; padding-bottom: 8px;">🚀 New Project Inquiry</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold; width: 160px;">Client Name:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.fullName)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Email:</td><td style="padding: 8px; color: #FFFFFF;"><a href="mailto:${escapeHtml(data.email)}" style="color: #0BCF5F;">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Phone / WhatsApp:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.phone)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Company:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.companyName || "N/A")}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Project Type:</td><td style="padding: 8px; color: #09B850; font-weight: bold;">${escapeHtml(data.projectType)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Estimated Budget:</td><td style="padding: 8px; color: #0BCF5F; font-weight: bold;">${escapeHtml(data.budget)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Submitted Date:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.createdAt)}</td></tr>
        </table>
        <div style="margin-top: 20px; background-color: #121917; padding: 16px; border-radius: 6px; border-left: 4px solid #09B850;">
          <h4 style="margin: 0 0 8px 0; color: #A7B0AC;">Project Requirements:</h4>
          <p style="margin: 0; white-space: pre-wrap; color: #FFFFFF; font-size: 14px;">${escapeHtml(data.message)}</p>
        </div>
      </div>
    `;

    const adminText = `New Project Inquiry\n\nClient Name: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone}\nCompany: ${data.companyName || "N/A"}\nProject Type: ${data.projectType}\nEstimated Budget: ${data.budget}\nSubmitted: ${data.createdAt}\n\nProject Requirements:\n${data.message}`;

    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    // 2. User Confirmation Email
    const userSubject = `We've Received Your Project Request — AWENUE`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 24px; border-radius: 8px;">
        <h2 style="color: #09B850;">Hi ${escapeHtml(data.fullName)},</h2>
        <p style="color: #A7B0AC; font-size: 15px; line-height: 1.6;">
          Thank you for reaching out to <strong>AWENUE — Avenue Global Software Solutions</strong>.
        </p>
        <p style="color: #A7B0AC; font-size: 15px; line-height: 1.6;">
          We've received your project request for <strong>${escapeHtml(data.projectType)}</strong>. Our team is reviewing the information you shared and will connect with you shortly to discuss next steps.
        </p>
        <div style="margin: 24px 0; padding: 16px; background-color: #121917; border-radius: 6px; border-left: 3px solid #09B850;">
          <p style="margin: 0; color: #FFFFFF; font-size: 14px;"><strong>Estimated Budget:</strong> ${escapeHtml(data.budget)}</p>
        </div>
        <p style="color: #A7B0AC; font-size: 14px;">Best regards,<br/><strong style="color: #FFFFFF;">AWENUE Team</strong><br/><span style="color: #09B850;">Build. Automate. Grow.</span></p>
      </div>
    `;

    const userText = `Hi ${data.fullName},\n\nThank you for reaching out to AWENUE.\n\nWe've received your project request for ${data.projectType}. Our team is reviewing your requirements and will connect with you shortly.\n\nBest regards,\nAWENUE Team`;

    await transporter.sendMail({
      from: fromEmail,
      to: data.email,
      subject: userSubject,
      text: userText,
      html: userHtml,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email send failure";
    console.error("[Nodemailer] Failed to send email:", err);
    return { success: false, error: message };
  }
}

export async function sendConsultationEmails(data: ConsultationEmailData): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || "Codewithsushil7236@gmail.com";
  const fromEmail = process.env.NOTIFICATION_FROM || `"AWENUE Lead System" <Support@awenueglobalsoftwaresolutions.in>`;

  if (!transporter) {
    console.warn("[Nodemailer] SMTP is not configured. Email notification skipped.");
    return { success: false, error: "SMTP not configured" };
  }

  try {
    // 1. Admin Email
    const adminSubject = `New Consultation Request — ${data.fullName}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 24px; border-radius: 8px;">
        <h2 style="color: #09B850; border-bottom: 2px solid #09B850; padding-bottom: 8px;">💬 New Consultation Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold; width: 160px;">Name:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.fullName)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Email:</td><td style="padding: 8px; color: #FFFFFF;"><a href="mailto:${escapeHtml(data.email)}" style="color: #0BCF5F;">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Phone:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.phone || "N/A")}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Company:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.companyName || "N/A")}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Help Category:</td><td style="padding: 8px; color: #09B850; font-weight: bold;">${escapeHtml(data.consultationType)}</td></tr>
          <tr><td style="padding: 8px; color: #A7B0AC; font-weight: bold;">Date:</td><td style="padding: 8px; color: #FFFFFF;">${escapeHtml(data.createdAt)}</td></tr>
        </table>
        <div style="margin-top: 20px; background-color: #121917; padding: 16px; border-radius: 6px; border-left: 4px solid #09B850;">
          <h4 style="margin: 0 0 8px 0; color: #A7B0AC;">Message / Query:</h4>
          <p style="margin: 0; white-space: pre-wrap; color: #FFFFFF; font-size: 14px;">${escapeHtml(data.message)}</p>
        </div>
      </div>
    `;

    const adminText = `New Consultation Request\n\nName: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone || "N/A"}\nCompany: ${data.companyName || "N/A"}\nCategory: ${data.consultationType}\nSubmitted: ${data.createdAt}\n\nMessage:\n${data.message}`;

    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    // 2. User Confirmation Email
    const userSubject = `We've Received Your Consultation Request — AWENUE`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 24px; border-radius: 8px;">
        <h2 style="color: #09B850;">Hi ${escapeHtml(data.fullName)},</h2>
        <p style="color: #A7B0AC; font-size: 15px; line-height: 1.6;">
          Thank you for contacting <strong>AWENUE</strong>.
        </p>
        <p style="color: #A7B0AC; font-size: 15px; line-height: 1.6;">
          We've received your consultation request regarding <strong>${escapeHtml(data.consultationType)}</strong>. Our team will review your message and reach out to you shortly.
        </p>
        <p style="color: #A7B0AC; font-size: 14px; margin-top: 24px;">Best regards,<br/><strong style="color: #FFFFFF;">AWENUE Team</strong><br/><span style="color: #09B850;">Avenue Global Software Solutions</span></p>
      </div>
    `;

    const userText = `Hi ${data.fullName},\n\nThank you for contacting AWENUE.\n\nWe've received your consultation request and will connect with you soon.\n\nBest regards,\nAWENUE Team`;

    await transporter.sendMail({
      from: fromEmail,
      to: data.email,
      subject: userSubject,
      text: userText,
      html: userHtml,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email send failure";
    console.error("[Nodemailer] Failed to send consultation email:", err);
    return { success: false, error: message };
  }
}

export interface AdminCustomerReplyData {
  recipientEmail: string;
  customerName: string;
  subject: string;
  message: string;
  adminSenderEmail?: string;
}

export async function sendAdminCustomerReplyEmail(
  data: AdminCustomerReplyData
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const fromEmail =
    process.env.NOTIFICATION_FROM ||
    `"AWENUE Support" <Support@awenueglobalsoftwaresolutions.in>`;

  if (!transporter) {
    console.warn(
      "[Nodemailer] SMTP is not configured. Customer email delivery skipped."
    );
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 900;">AWEN<span style="color: #09B850;">UE</span></h1>
          <p style="color: #A7B0AC; font-size: 12px; margin-top: 4px;">Avenue Global Software Solutions</p>
        </div>
        <p style="color: #A7B0AC; font-size: 14px;">Hi <strong>${escapeHtml(data.customerName)}</strong>,</p>
        <div style="background-color: #121917; border-left: 4px solid #09B850; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 14px; line-height: 1.7; color: #E5E7EB; white-space: pre-wrap;">
${escapeHtml(data.message)}
        </div>
        <p style="color: #A7B0AC; font-size: 13px; margin-top: 24px;">
          If you have any further questions, simply reply to this email or visit us at <a href="https://awenueglobalsoftwaresolutions.in" style="color: #0BCF5F; text-decoration: underline;">awenueglobalsoftwaresolutions.in</a>.
        </p>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); color: #6B7280; font-size: 12px;">
          — <strong>AWENUE Support Team</strong><br/>
          <span>Avenue Global Software Solutions</span>
        </div>
      </div>
    `;

    const text = `Hi ${data.customerName},\n\n${data.message}\n\n— AWENUE Support Team\nAvenue Global Software Solutions`;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: data.recipientEmail,
      subject: data.subject,
      text,
      html,
    });

    console.log(
      `[Nodemailer] Customer reply email sent to ${data.recipientEmail}. MessageID:`,
      info.messageId
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email delivery failed";
    console.error("[Nodemailer] Failed to send customer reply email:", err);
    return { success: false, error: message };
  }
}

export interface AdminInviteEmailData {
  recipientEmail: string;
  fullName?: string;
  role?: string;
  invitedByName?: string;
  inviteUrl?: string;  // Secure accept link (includes hashed token)
}

export async function sendAdminInviteEmail(
  data: AdminInviteEmailData
): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  const fromEmail =
    process.env.NOTIFICATION_FROM ||
    `"AWENUE Admin System" <awenueglobalsoftwaresolutions@gmail.com>`;

  if (!transporter) {
    console.warn("[Nodemailer] SMTP is not configured. Admin invitation email skipped.");
    return { success: false, error: "SMTP not configured" };
  }

    const acceptUrl = data.inviteUrl || (
      process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/invite/accept`
        : "https://awenueglobalsoftwaresolutions.in/admin/invite/accept"
    );

    const expiryNotice = data.inviteUrl
      ? `<p style="color: #D97706; font-size: 12px; margin: 8px 0 0;">⚠️ This invitation link expires in <strong>48 hours</strong>.</p>`
      : "";

    try {
      const subject = `You have been invited as an AWENUE Administrator`;
      const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0A0F0D; color: #FFFFFF; padding: 32px; border-radius: 12px; max-width: 550px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 900;">AWEN<span style="color: #09B850;">UE</span></h1>
          <p style="color: #A7B0AC; font-size: 12px; margin-top: 4px;">Avenue Global Software Solutions</p>
        </div>
        <h2 style="color: #0BCF5F; font-size: 20px; margin: 0 0 12px 0;">Administrator Invitation</h2>
        <p style="color: #A7B0AC; font-size: 14px; line-height: 1.6;">
          Hi ${data.fullName ? `<strong>${escapeHtml(data.fullName)}</strong>` : "there"},
        </p>
        <p style="color: #A7B0AC; font-size: 14px; line-height: 1.6;">
          ${data.invitedByName ? `<strong>${escapeHtml(data.invitedByName)}</strong>` : "An administrator"} has invited you to join the <strong>AWENUE Management Portal</strong> as an <strong>${escapeHtml(data.role || "Administrator")}</strong>.
        </p>
        <div style="background-color: #121917; border-left: 4px solid #09B850; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 14px; color: #E5E7EB;">
          <p style="margin: 0 0 8px 0;"><strong>Authorized Email:</strong> ${escapeHtml(data.recipientEmail)}</p>
          <p style="margin: 0;"><strong>System Access Level:</strong> ${escapeHtml(data.role || "Administrator")}</p>
        </div>
        <p style="color: #A7B0AC; font-size: 13px; line-height: 1.6;">
          Click the button below to activate your account and complete setup:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${acceptUrl}" style="background-color: #09B850; color: #0A0F0D; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 10px; display: inline-block;">
            Activate My Admin Account &rarr;
          </a>
          ${expiryNotice}
        </div>
        <p style="color: #6B7280; font-size: 12px; margin-top: 8px; text-align: center;">
          If you cannot click the button, copy this link into your browser:<br/>
          <span style="color: #09B850; word-break: break-all;">${acceptUrl}</span>
        </p>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); color: #6B7280; font-size: 12px;">
          — <strong>AWENUE Admin Team</strong><br/>
          <span>Avenue Global Software Solutions</span>
        </div>
      </div>
    `;

    const text = `Administrator Invitation\n\nYou have been invited to join the AWENUE Admin Portal.\n\nAuthorized Email: ${data.recipientEmail}\nSystem Access Level: ${data.role || "Administrator"}\n\nActivate your account at: ${acceptUrl}\n\nThis link expires in 48 hours.\n\n— AWENUE Admin Team`;

    const sendPromise = transporter.sendMail({
      from: fromEmail,
      to: data.recipientEmail,
      subject,
      text,
      html,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Email delivery timeout")), 4500)
    );

    const info = (await Promise.race([sendPromise, timeoutPromise])) as any;
    console.log(`[Nodemailer] Admin invite email sent to ${data.recipientEmail}. MessageID:`, info?.messageId);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email delivery failed";
    console.warn("[Nodemailer] Admin invite email delivery notice:", message);
    return { success: false, error: message };
  }
}


