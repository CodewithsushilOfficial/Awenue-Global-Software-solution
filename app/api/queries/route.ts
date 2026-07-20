import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { collection as clientCollection, addDoc } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase";
import { sendInquiryNotificationEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required." },
        { status: 400 }
      );
    }

    const fullName =
      typeof body.fullName === "string" && body.fullName.trim()
        ? body.fullName.trim()
        : typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "Website Visitor";

    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "General Contact Query";
    const message =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Newsletter subscription request";

    // Anti-spam honeypot
    if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Query received." }, { status: 200 });
    }

    const now = new Date().toISOString();
    let docId = "";

    const queryRecord = {
      fullName,
      email,
      phone,
      subject,
      message,
      status: "new",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
      notificationStatus: "pending",
    };

    // 1. Dual-tier Firestore persistence
    const adminFirestore = getAdminDb();
    if (adminFirestore) {
      const docRef = await adminFirestore.collection("generalQueries").add(queryRecord);
      docId = docRef.id;
    } else {
      const docRef = await addDoc(clientCollection(clientDb, "generalQueries"), queryRecord);
      docId = docRef.id;
    }

    // 2. Non-blocking Email Notification
    sendInquiryNotificationEmail({
      type: "General Query",
      fullName,
      email,
      phone,
      message,
      createdAt: now,
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        id: docId,
        message: "Thank you for contacting us! We have received your query.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("API /api/queries error:", err);
    return NextResponse.json(
      { error: "Server error processing your request. Please try again." },
      { status: 500 }
    );
  }
}
