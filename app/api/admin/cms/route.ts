import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "set", collectionName, docId, data } = body;

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json(
        { error: "Target collection name is required." },
        { status: 400 }
      );
    }

    const targetCollection = adminDb.collection(collectionName);
    const nowISO = new Date().toISOString();

    if (action === "delete") {
      if (!docId) {
        return NextResponse.json({ error: "Document ID is required for deletion." }, { status: 400 });
      }
      await targetCollection.doc(docId).delete();
      return NextResponse.json({ success: true, message: "Document deleted successfully." });
    }

    if (action === "add" || !docId) {
      const docRef = await targetCollection.add({
        ...data,
        createdAt: data?.createdAt || nowISO,
        updatedAt: nowISO,
      });
      return NextResponse.json({ success: true, id: docRef.id, message: "Document added successfully." });
    }

    if (action === "update") {
      await targetCollection.doc(docId).update({
        ...data,
        updatedAt: nowISO,
      });
      return NextResponse.json({ success: true, id: docId, message: "Document updated successfully." });
    }

    // Default "set" action (UPSERT)
    await targetCollection.doc(docId).set(
      {
        ...data,
        updatedAt: nowISO,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, id: docId, message: "CMS content saved successfully." });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.warn("API /api/admin/cms server notice (client fallback will run if needed):", errorDetails);
    
    // Return graceful 200 with fallback flag so client Firestore completes operation smoothly
    return NextResponse.json(
      {
        success: false,
        useClientFallback: true,
        notice: "Server Admin SDK not initialized; proceeding via client SDK.",
      },
      { status: 200 }
    );
  }
}
