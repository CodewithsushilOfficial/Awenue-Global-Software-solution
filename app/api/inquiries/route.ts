import { NextRequest, NextResponse } from "next/server";
import { projectInquirySchema } from "@/lib/validations";
import { adminDb } from "@/lib/firebase-admin";

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
      // Return fake success for bot honeypot trap
      return NextResponse.json({ success: true, message: "Inquiry received" }, { status: 200 });
    }

    const now = new Date().toISOString();

    // 3. Save to Firestore
    const docRef = await adminDb.collection("projectInquiries").add({
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
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
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
