import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

async function run() {
  try {
    console.log("Fetching all admins from Firestore...");
    const snap = await getDocs(collection(db, "admins"));
    console.log(`Found ${snap.size} admin documents.`);
    snap.forEach((doc) => {
      console.log(`- DocID: "${doc.id}"`);
      console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
  }
}

run();
