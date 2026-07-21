import { getAdminDb } from "../lib/firebase-admin";

async function run() {
  try {
    console.log("Fetching all admins from Firestore via Admin SDK...");
    const db = getAdminDb();
    if (!db) {
      console.error("Admin DB is null.");
      return;
    }
    const snap = await db.collection("admins").get();
    console.log(`Found ${snap.size} admin documents.`);
    snap.forEach((doc) => {
      console.log(`- DocID: "${doc.id}"`);
      console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Error fetching admins via Admin SDK:", err);
  }
}

run();
