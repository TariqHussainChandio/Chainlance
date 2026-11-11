import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import {
  getAuth,
  type UserRecord,
} from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type Role = "freelancer" | "client" | "admin";

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: Role;
  skills?: string[];
  rating?: number;
  completionRate?: number;
  portfolioUrls?: string[];
  companyName?: string | null;
  preferredBudget?: number | null;
}

const seedUsers: SeedUser[] = [
  {
    email: "admin@chainwork.test",
    password: "Admin@12345",
    name: "Platform Admin",
    role: "admin",
  },
  {
    email: "admin@gmail.com",
    password: "Admin1122",
    name: "Super Admin",
    role: "admin",
  },
  {
    email: "ayesha@test.com",
    password: "Test@12345",
    name: "Ayesha Khan",
    role: "freelancer",
    skills: ["React", "TypeScript", "UI Design"],
    rating: 4.8,
    completionRate: 0.95,
    portfolioUrls: [],
  },
  {
    email: "ali@test.com",
    password: "Test@12345",
    name: "Ali Hassan",
    role: "freelancer",
    skills: ["Solidity", "Smart Contracts", "Web3"],
    rating: 4.6,
    completionRate: 0.88,
    portfolioUrls: [],
  },
  {
    email: "client1@test.com",
    password: "Test@12345",
    name: "Sarah Chen",
    role: "client",
    companyName: "Acme Inc",
    preferredBudget: null,
  },
  {
    email: "client2@test.com",
    password: "Test@12345",
    name: "James Patel",
    role: "client",
    companyName: null,
    preferredBudget: null,
  },
];

function loadServiceAccount(): ServiceAccount {
  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH ?? "./firebase-admin.json";
  const absolutePath = resolve(process.cwd(), keyPath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw) as ServiceAccount;
}

function initAdmin(): App {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    credential: cert(loadServiceAccount()),
  });
}

async function ensureAuthUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ uid: string; created: boolean }> {
  const auth = getAuth();
  try {
    const record = await auth.createUser({ email, password, displayName });
    return { uid: record.uid, created: true };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      const existing: UserRecord = await auth.getUserByEmail(email);
      // Sync displayName + password in case they drifted.
      await auth.updateUser(existing.uid, { displayName, password });
      return { uid: existing.uid, created: false };
    }
    throw err;
  }
}

async function upsertUserDoc(uid: string, seed: SeedUser): Promise<void> {
  const db = getFirestore();
  const ref = db.collection("users").doc(uid);

  const base: Record<string, unknown> = {
    uid,
    email: seed.email,
    name: seed.name,
    role: seed.role,
    walletAddress: null,
    kycStatus: "approved",
    fraudScore: 0,
    profileImage: null,
    bio: null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (seed.role === "freelancer") {
    base.skills = seed.skills ?? [];
    base.rating = seed.rating ?? 0;
    base.completionRate = seed.completionRate ?? 0;
    base.portfolioUrls = seed.portfolioUrls ?? [];
  }

  if (seed.role === "client") {
    base.companyName = seed.companyName ?? null;
    base.preferredBudget = seed.preferredBudget ?? null;
  }

  const snap = await ref.get();
  if (!snap.exists) {
    base.createdAt = FieldValue.serverTimestamp();
  }

  await ref.set(base, { merge: true });
}

async function main(): Promise<void> {
  initAdmin();

  for (const seed of seedUsers) {
    const { uid, created } = await ensureAuthUser(
      seed.email,
      seed.password,
      seed.name
    );
    await upsertUserDoc(uid, seed);
    const verb = created ? "Created" : "Updated";
    console.log(`✓ ${verb} ${seed.email} as ${seed.role}`);
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
