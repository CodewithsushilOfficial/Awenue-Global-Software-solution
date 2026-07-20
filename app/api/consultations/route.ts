import { NextRequest, NextResponse } from "next/server";
import { consultationRequestSchema } from "@/lib/validations";
import { getAdminDb } from "@/lib/firebase-admin";
import { collection as clientCollection, addDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase";

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
    let docId = "";

    const consultationRecord = {
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
    };

    // 3. Save to Firestore (Try Admin SDK first, fallback to Client SDK)
    const adminFirestore = getAdminDb();
    if (adminFirestore) {
      const docRef = await adminFirestore.collection("consultationRequests").add(consultationRecord);
      docId = docRef.id;
    } else {
      const docRef = await addDoc(clientCollection(clientDb, "consultationRequests"), consultationRecord);
      docId = docRef.id;
    }

    return NextResponse.json(
      {
        success: true,
        id: docId,
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
