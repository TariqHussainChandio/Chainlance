"use client";

/**
 * Web-only auth flows: Google popup sign-in and the Next.js session cookie.
 * The platform-neutral pieces live in @chainwork/core/auth/auth-helpers.
 */

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { auth } from "@chainwork/firebase-client/web";
import {
  resolveFederatedUser,
  type GoogleSignInResult,
  type SignUpRole,
} from "@chainwork/core/auth/auth-helpers";
import type { UserRole } from "@chainwork/shared";

export async function signInWithGoogle(
  role?: SignUpRole
): Promise<GoogleSignInResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  let cred;
  try {
    cred = await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const code = error?.code || "";
    const msg = error?.message || "";

    if (code === "auth/operation-not-allowed" || msg.includes("operation-not-allowed")) {
      throw new Error(
        "Google Sign-In is disabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Google and click Enable, or sign in with email and password."
      );
    }
    if (code === "auth/popup-closed-by-user" || msg.includes("popup-closed-by-user")) {
      throw new Error("Google Sign-In was cancelled (popup closed).");
    }
    if (code === "auth/popup-blocked" || msg.includes("popup-blocked")) {
      throw new Error("Sign-in popup was blocked by your browser. Please enable popups for this site.");
    }
    if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
      throw new Error("Domain not authorized in Firebase Console -> Auth -> Settings -> Authorized domains.");
    }
    throw err;
  }

  return resolveFederatedUser(
    {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
      photoURL: cred.user.photoURL,
    },
    role
  );
}

export async function postSessionCookie(pendingSignup?: {
  name?: string;
  role?: UserRole;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No active Firebase user; cannot create session cookie.");
  }
  const idToken = await currentUser.getIdToken(true);
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, pendingSignup }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to create session cookie: ${detail}`);
  }
}

export async function deleteSessionCookie(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}
