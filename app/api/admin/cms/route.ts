import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { collection as clientCollection, getDocs, query, orderBy } from "firebase/firestore";
import { db as clientDb } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collectionName");

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json({ error: "Target collection name is required." }, { status: 400 });
    }

    // 1. Try Admin SDK Firestore first
    const adminFirestore = getAdminDb();
    if (adminFirestore) {
      try {
        const snap = await adminFirestore.collection(collectionName).orderBy("createdAt", "desc").get();
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ success: true, data: list });
      } catch (adminErr) {
        console.warn(`[CMS GET] Admin SDK fetch failed for ${collectionName}, trying Client SDK:`, adminErr);
      }
    }

    // 2. Fallback to Client SDK Firestore
    const q = query(clientCollection(clientDb, collectionName), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    console.error("API /api/admin/cms GET error:", err);
    return NextResponse.json({ error: "Failed to fetch collection data." }, { status: 500 });
  }
}

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

    const adminFirestore = getAdminDb();
    if (adminFirestore) {
      const targetCollection = adminFirestore.collection(collectionName);
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
    }

    return NextResponse.json(
      {
        success: false,
        useClientFallback: true,
        notice: "Server Admin SDK not initialized; proceeding via client SDK.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.warn("API /api/admin/cms server notice (client fallback will run if needed):", errorDetails);
    
    return NextResponse.json(
      {
        success: false,
        useClientFallback: true,
        notice: "Server Admin SDK exception; proceeding via client SDK.",
      },
      { status: 200 }
    );
  }
}
