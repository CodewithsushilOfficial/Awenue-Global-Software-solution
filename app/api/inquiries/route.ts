import { NextRequest, NextResponse } from "next/server";
import { projectInquirySchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase-admin";
import { collection as clientCollection, addDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase";
import { sendInquiryNotificationEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation
    const validationResult = projectInquirySchema.safeParse(body);
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
      return NextResponse.json({ success: true, message: "Inquiry received" }, { status: 200 });
    }

    const now = new Date().toISOString();
    let docId = "";

    const inquiryRecord = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName || "",
      projectType: data.projectType,
      budget: data.budget,
      message: data.message,
      status: "new",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
      notificationStatus: "pending",
    };

    // 3. Save to Firestore (Try Admin SDK first, fallback to Client SDK)
    const adminFirestore = getAdminDb();
    if (adminFirestore) {
      const docRef = await adminFirestore.collection("projectInquiries").add(inquiryRecord);
      docId = docRef.id;
    } else {
      const docRef = await addDoc(clientCollection(clientDb, "projectInquiries"), inquiryRecord);
      docId = docRef.id;
    }

    // 4. Non-blocking email notification trigger
    sendInquiryNotificationEmail({
      type: "Project Inquiry",
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName || "",
      projectType: data.projectType,
      budget: data.budget,
      message: data.message,
      createdAt: now,
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Thank you for sharing your project with us! We've received your request.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("API /api/inquiries error:", err);
    return NextResponse.json(
      { error: "Server error handling project inquiry submission. Please try again." },
      { status: 500 }
    );
  }
}
