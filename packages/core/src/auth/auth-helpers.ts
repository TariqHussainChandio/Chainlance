"use client";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@chainwork/firebase-client";
import { COLLECTIONS, type User } from "@chainwork/shared";

export type SignUpRole = "freelancer" | "client";

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  role: SignUpRole;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface GoogleSignInResult {
  user: User | null;
  isNewUser: boolean;
  firebaseUser?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
}

export async function signUp(input: SignUpInput): Promise<User> {
  if (input.role !== "freelancer" && input.role !== "client") {
    throw new Error("Invalid role. Admins cannot be created via public signup.");
  }

  const cred = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );
  await updateProfile(cred.user, { displayName: input.name });

  const ref = doc(db, COLLECTIONS.users, cred.user.uid);

  const baseDoc: Record<string, unknown> = {
    uid: cred.user.uid,
    email: input.email,
    name: input.name,
    role: input.role,
    walletAddress: null,
    kycStatus: "pending",
    fraudScore: 0,
    profileImage: null,
    bio: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.role === "freelancer") {
    baseDoc.skills = [];
    baseDoc.rating = 0;
    baseDoc.completionRate = 0;
    baseDoc.portfolioUrls = [];
  } else {
    baseDoc.companyName = null;
    baseDoc.preferredBudget = null;
  }

  await setDoc(ref, baseDoc);

  // Fire-and-forget verification email. Don't block signup if the send
  // fails (rate limits, downed SMTP relay, etc.) — the user can resend
  // from their profile page.
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn("[signUp] verification email failed to send:", err);
  }

  const fresh = await getDoc(ref);
  return fresh.data() as User;
}

export async function signIn(input: SignInInput): Promise<User> {
  const cred = await signInWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  const ref = doc(db, COLLECTIONS.users, cred.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error(
      "Your account exists in Auth but has no profile document. Contact support."
    );
  }
  return snap.data() as User;
}

/**
 * Resolves a federated (e.g. Google) credential into the app user document,
 * enforcing the same role gates as password sign-in. The platform-specific
 * part (web popup vs native Google sign-in) lives in each app; this handles
 * everything after Firebase Auth has a signed-in user.
 */
export async function resolveFederatedUser(federatedUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}, role?: SignUpRole): Promise<GoogleSignInResult> {
  const ref = doc(db, COLLECTIONS.users, federatedUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existingUser = snap.data() as User;
    if (existingUser.role === "admin") {
      await fbSignOut(auth);
      throw new Error(
        "Admin accounts must use the admin portal. Go to /admin/login."
      );
    }
    if (existingUser.role === "banned") {
      await fbSignOut(auth);
      throw new Error("Your account has been suspended.");
    }
    return { user: existingUser, isNewUser: false };
  }

  // If no user doc exists and no role provided, return early so caller UI can request role
  if (!role) {
    return {
      user: null,
      isNewUser: true,
      firebaseUser: federatedUser,
    };
  }

  return await createGoogleUserDoc(
    federatedUser.uid,
    role,
    federatedUser.displayName,
    federatedUser.email,
    federatedUser.photoURL
  );
}

export async function createGoogleUserDoc(
  userUid: string,
  role: SignUpRole,
  displayName?: string | null,
  emailAddress?: string | null,
  photoURL?: string | null
): Promise<GoogleSignInResult> {
  const email = (emailAddress || "").toLowerCase();
  const name =
    displayName?.trim() ||
    (email ? email.split("@")[0] : "New User");

  const ref = doc(db, COLLECTIONS.users, userUid);

  const baseDoc: Record<string, unknown> = {
    uid: userUid,
    email,
    name,
    role,
    walletAddress: null,
    kycStatus: "pending",
    fraudScore: 0,
    profileImage: photoURL || null,
    bio: null,
    emailVerified: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (role === "freelancer") {
    baseDoc.skills = [];
    baseDoc.rating = 0;
    baseDoc.completionRate = 0;
    baseDoc.portfolioUrls = [];
  } else {
    baseDoc.companyName = null;
    baseDoc.preferredBudget = null;
  }

  await setDoc(ref, baseDoc);
  const fresh = await getDoc(ref);
  return { user: fresh.data() as User, isNewUser: true };
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Reauthenticates the current user with their existing password and
 * sets a new one. Throws specific user-facing errors for the common
 * Firebase auth codes so the UI can surface them without parsing.
 */
export async function changeUserPassword(args: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("You must be signed in to change your password.");
  }
  try {
    const credential = EmailAuthProvider.credential(
      user.email,
      args.currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, args.newPassword);
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (
      code === "auth/wrong-password" ||
      code === "auth/invalid-credential"
    ) {
      throw new Error("Current password is incorrect.");
    }
    if (code === "auth/weak-password") {
      throw new Error(
        "New password must be at least 8 characters with an uppercase letter and a digit."
      );
    }
    if (code === "auth/requires-recent-login") {
      throw new Error("Sign in again, then retry the password change.");
    }
    throw err instanceof Error ? err : new Error("Password change failed.");
  }
}

/**
 * Fires Firebase Auth's built-in verification email to the currently
 * signed-in user. Used by both the profile-page "Resend" button and
 * the verify-email banner.
 */
export async function resendEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  await sendEmailVerification(user);
}

/**
 * Sends Firebase's hosted password-reset link to `email`. Used by
 * /forgot-password. Caller should NOT differentiate between
 * unknown-email and rate-limited responses (account-enumeration risk)
 * except for the `auth/too-many-requests` case which is worth surfacing.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
