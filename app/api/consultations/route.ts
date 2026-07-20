import { NextRequest, NextResponse } from "next/server";
import { consultationRequestSchema } from "@/lib/validations";
import { adminDb } from "@/lib/firebase-admin";
import { sendConsultationEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation
    const validationResult = consultationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 2. Anti-spam honeypot check
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Consultation request received" }, { status: 200 });
    }

    const now = new Date().toISOString();

    // 3. Save to Firestore
    const docRef = await adminDb.collection("consultationRequests").add({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      companyName: data.companyName || "",
      consultationType: data.consultationType,
      message: data.message,
      status: "new",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
      notificationStatus: "pending",
    });

    // 4. Trigger Nodemailer Email Notifications
    const emailResult = await sendConsultationEmails({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      consultationType: data.consultationType,
      message: data.message,
      createdAt: now,
    });

    // Update notification status in Firestore
    await docRef.update({
      notificationStatus: emailResult.success ? "sent" : "failed",
      notificationError: emailResult.error || null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "Thanks for reaching out! We've received your consultation request.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("API /api/consultations error:", err);
    return NextResponse.json(
      { error: "Server error handling consultation request submission. Please try again." },
      { status: 500 }
    );
  }
}
