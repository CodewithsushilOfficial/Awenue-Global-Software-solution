/**
 * lib/email-service.ts — Transactional Email Notification Layer for AWENUE
 *
 * Sends server-side email notifications when new project inquiries, consultation
 * requests, or general queries are submitted.
 *
 * Guaranteed non-blocking: Never throws errors that disrupt Firestore persistence.
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
      // Send Admin Notification Email
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

      // Send Customer Confirmation Email
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

    return { success: false, error: "Transactional email provider returned non-200 response." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown email dispatch error";
    console.warn("[EMAIL SERVICE] Non-blocking dispatch notice:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
