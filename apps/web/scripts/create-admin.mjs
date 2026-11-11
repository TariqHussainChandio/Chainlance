/**
 * One-shot script: creates an admin user in Firebase Auth + Firestore.
 * Run from the project root:  node scripts/create-admin.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, "../firebase-admin.json");

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
if (typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth(app);
const db = getFirestore(app);

// ─── Admin credentials ───────────────────────────────────────────────────────
const ADMIN_EMAIL    = "admin@chainwork.app";
const ADMIN_PASSWORD = "ChainAdmin#2026";
const ADMIN_NAME     = "ChainWork Admin";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Create (or fetch) the Firebase Auth record
  let uid;
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    // Update password in case it changed
    await auth.updateUser(uid, { password: ADMIN_PASSWORD, displayName: ADMIN_NAME });
    console.log(`Auth record already existed — updated. UID: ${uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      const created = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`Auth record created. UID: ${uid}`);
    } else {
      throw err;
    }
  }

  // 2. Write the Firestore user document with role: "admin"
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  const now = FieldValue.serverTimestamp();

  if (snap.exists) {
    await userRef.update({
      role: "admin",
      adminRole: "super",
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      updatedAt: now,
    });
    console.log("Firestore document updated → role: admin");
  } else {
    await userRef.set({
      uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      adminRole: "super",
      profileImage: null,
      bio: null,
      phoneNumber: null,
      rating: 0,
      reviewCount: 0,
      emailVerified: true,
      kycStatus: "approved",
      verificationStatus: "verified",
      skills: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    console.log("Firestore document created → role: admin");
  }

  console.log("\n✓ Admin account ready");
  console.log("  Email   :", ADMIN_EMAIL);
  console.log("  Password:", ADMIN_PASSWORD);
  console.log("  UID     :", uid);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
