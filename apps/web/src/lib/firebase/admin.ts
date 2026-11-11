import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Resolves the Firebase service account credential in two ways, in order:
 *
 *  1. `FIREBASE_SERVICE_ACCOUNT_KEY` — a JSON string of the credential.
 *     This is the production / Vercel path; the filesystem on Vercel
 *     is ephemeral and read-only, so a file path won't work there.
 *
 *  2. `FIREBASE_ADMIN_KEY_PATH` (default `./firebase-admin.json`) —
 *     a filesystem path. This is the local-dev fallback.
 *
 * Throws with a clear instruction if neither is configured so deploys
 * fail loudly instead of producing mysterious 500s.
 */
function parseServiceAccountObj(parsed: Record<string, unknown>): ServiceAccount {
  const sa = { ...parsed } as Record<string, unknown>;
  if (typeof sa.private_key === "string") {
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  }
  if (typeof sa.privateKey === "string") {
    sa.privateKey = sa.privateKey.replace(/\\n/g, "\n");
  }
  return sa as unknown as ServiceAccount;
}

function loadServiceAccount(): ServiceAccount {
  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (jsonString && jsonString.trim().length > 0) {
    try {
      const parsed = JSON.parse(jsonString);
      return parseServiceAccountObj(parsed);
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON: ${
          err instanceof Error ? err.message : "parse error"
        }`
      );
    }
  }

  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH ?? "./firebase-admin.json";
  const absolutePath = resolve(process.cwd(), keyPath);
  if (existsSync(absolutePath)) {
    try {
      const raw = readFileSync(absolutePath, "utf8");
      const parsed = JSON.parse(raw);
      return parseServiceAccountObj(parsed);
    } catch (err) {
      throw new Error(
        `Failed to parse Firebase admin service account file at '${keyPath}': ${
          err instanceof Error ? err.message : "parse error"
        }`
      );
    }
  }

  throw new Error(
    "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (production) or FIREBASE_ADMIN_KEY_PATH (local)."
  );
}

const app: App = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert(loadServiceAccount()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);
const adminStorage: Storage = getStorage(app);

/**
 * Returns true iff Firebase Auth has a user record with this email.
 * Used by the forgot-password flow (gate before sending the OTP) and
 * by the signup flow (post-OTP email-taken check). Swallows the
 * `auth/user-not-found` lookup error and returns false instead.
 */
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    await adminAuth.getUserByEmail(email);
    return true;
  } catch {
    return false;
  }
}

export { adminAuth, adminDb, adminStorage, checkEmailExists };
