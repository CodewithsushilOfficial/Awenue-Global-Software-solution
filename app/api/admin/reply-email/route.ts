import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminCustomerReplyEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      leadType, // "projectInquiry" | "consultation" | "generalQuery"
      recipientEmail,
      customerName,
      subject,
      message,
      adminEmail = "Codewithsushil7236@gmail.com",
    } = body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid customer recipient email is required." },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Email subject line is required." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Email message content cannot be empty." },
        { status: 400 }
      );
    }

    const targetCustomerName = customerName || "Valued Client";
    const nowISO = new Date().toISOString();

    // 1. Send Email via Nodemailer
    const emailResult = await sendAdminCustomerReplyEmail({
      recipientEmail: recipientEmail.trim(),
      customerName: targetCustomerName,
      subject: subject.trim(),
      message: message.trim(),
      adminSenderEmail: adminEmail,
    });

    const emailStatus = emailResult.success ? "sent" : "failed";

    // 2. Log in 'emailCommunications' collection in Firestore
    const commDocRef = await adminDb.collection("emailCommunications").add({
      leadId: leadId || null,
      leadType: leadType || "general",
      recipientEmail: recipientEmail.trim(),
      customerName: targetCustomerName,
      subject: subject.trim(),
      message: message.trim(),
      direction: "outbound",
      status: emailStatus,
      failureReason: emailResult.error || null,
      sentByAdminEmail: adminEmail,
      sentAt: nowISO,
    });

    // 3. Update Lead Status & lastContactedAt if leadId is provided
    if (leadId && leadType) {
      let collectionName = "projectInquiries";
      let newStatus = "contacted";

      if (leadType === "consultation") {
        collectionName = "consultationRequests";
        newStatus = "contacted";
      } else if (leadType === "generalQuery") {
        collectionName = "generalQueries";
        newStatus = "replied";
      }

      try {
        const leadRef = adminDb.collection(collectionName).doc(leadId);
        const leadSnap = await leadRef.get();
        if (leadSnap.exists) {
          const currentData = leadSnap.data();
          const updatedStatus =
            currentData?.status === "new" ? newStatus : currentData?.status || newStatus;

          await leadRef.update({
            status: updatedStatus,
            lastContactedAt: nowISO,
            updatedAt: nowISO,
          });
        }
      } catch (leadErr) {
        console.warn("Notice: Lead status update after reply:", leadErr);
      }
    }

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error:
            "Failed to deliver email via SMTP. Communication record saved in system logs.",
          communicationId: commDocRef.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Email successfully delivered to ${recipientEmail}`,
        communicationId: commDocRef.id,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API /api/admin/reply-email error:", err);
    return NextResponse.json(
      { error: "Failed to process customer email reply. Please try again." },
      { status: 500 }
    );
  }
}
