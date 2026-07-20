import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seedAdmin() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyATYJjw7vTC6NMKtoODxzfBewMxgWBE--s";
  const adminEmail = "Codewithsushil7236@gmail.com";
  const adminPass = "Sushil@7236";

  console.log(`[SEED ADMIN] Provisioning admin account for: ${adminEmail}`);

  // 1. Try Signing Up via Firebase Auth REST API
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPass,
      returnSecureToken: true,
    }),
  });

  const signUpData = await signUpRes.json();

  if (signUpRes.ok) {
    console.log(`[SEED ADMIN] Successfully created Firebase Auth user! LocalId (UID): ${signUpData.localId}`);
  } else if (signUpData.error?.message === "EMAIL_EXISTS") {
    console.log(`[SEED ADMIN] Account already exists in Firebase Auth. Verifying login credentials...`);
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const signInRes = await fetch(signInUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPass,
        returnSecureToken: true,
      }),
    });

    const signInData = await signInRes.json();
    if (signInRes.ok) {
      console.log(`[SEED ADMIN] Credentials verified! LocalId (UID): ${signInData.localId}`);
    } else {
      console.error(`[SEED ADMIN ERROR] Failed to authenticate existing account:`, signInData.error?.message);
    }
  } else {
    console.error(`[SEED ADMIN ERROR] SignUp failed:`, signUpData.error?.message);
  }

  console.log(`[SEED ADMIN] ✅ Admin account setup complete in Firebase Auth for ${adminEmail}!`);
}

seedAdmin().catch((err) => {
  console.error("[SEED ADMIN ERROR]:", err);
  process.exit(1);
});
