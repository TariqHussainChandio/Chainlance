import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

import {
  COLLECTIONS,
  type SerializedUser,
  type User,
  type UserRole,
} from "@chainwork/shared";
import { auth, db } from "@chainwork/firebase-client";
import { serializeUser } from "@chainwork/core/firestore/serialize";
import {
  signIn,
  signUp,
  signOut as coreSignOut,
  sendPasswordReset,
  type SignUpRole,
} from "@chainwork/core/auth/auth-helpers";
import {
  sendVerificationLink,
  checkIsSignInLink,
  completeSignInWithLink,
} from "@chainwork/core/auth/email-link";
import { api } from "@chainwork/core";
import type { ProfileUpdateInput } from "@chainwork/shared";

export type { UserRole } from "@chainwork/shared";

/**
 * The mobile profile is the same Firestore user document the web app uses
 * (SerializedUser), plus mobile-only convenience fields.
 */
export type UserProfile = SerializedUser & { hourlyRate?: string };

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;
  signInGoogle: (selectedRole?: UserRole) => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  confirmSignInLink: (email: string, emailLink: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signInGoogle: async () => {},
  sendSignInLink: async () => {},
  confirmSignInLink: async () => {},
  sendPasswordResetEmail: async () => {},
  signOutUser: async () => {},
  updateProfileData: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth state → live subscription on the user's Firestore document.
  // The role always comes from the document; there is no client-side role
  // switching (that was a security gap in the previous prototype).
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubDoc = onSnapshot(
        doc(db, COLLECTIONS.users, fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(serializeUser(snap.data() as User) as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("[AuthContext] user doc subscription error:", err);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const signInEmail = async (email: string, password: string) => {
    await signIn({ email: email.trim(), password });
  };

  const signUpEmail = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    if (role !== "freelancer" && role !== "client") {
      throw new Error("Invalid role. Admins cannot be created via public signup.");
    }
    await signUp({
      email: email.trim(),
      password,
      name: name.trim(),
      role: role as SignUpRole,
    });
  };

  const signInGoogle = async (_selectedRole: UserRole = "freelancer") => {
    throw new Error(
      "Google sign-in is not available in the mobile app yet. Use email/password."
    );
  };

  const sendSignInLink = async (email: string) => {
    const result = await sendVerificationLink(email.trim());
    if (!result.ok) {
      throw new Error(result.error || "Failed to send the sign-in link.");
    }
  };

  const confirmSignInLink = async (email: string, emailLink: string) => {
    if (!checkIsSignInLink(emailLink)) {
      throw new Error("Invalid sign-in link.");
    }
    await completeSignInWithLink(email.trim(), emailLink);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await sendPasswordReset(email.trim());
  };

  const signOutUser = async () => {
    try {
      await coreSignOut();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  /**
   * Profile updates: fields that are denormalized across gigs/contracts/
   * proposals (name, bio, profileImage, tags) go through the server API so
   * the fan-out happens; everything else is a direct self-update permitted
   * by the Firestore rules. The live doc subscription refreshes `profile`.
   */
  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("Not signed in.");

    const apiFields: ProfileUpdateInput = {};
    if (updates.name !== undefined) apiFields.name = updates.name;
    if (updates.bio !== undefined) apiFields.bio = updates.bio;
    if (updates.profileImage !== undefined) apiFields.profileImage = updates.profileImage;
    if (updates.tags !== undefined) apiFields.tags = updates.tags;

    const directFields: { [key: string]: string | string[] | null } = {};
    for (const key of ["skills", "hourlyRate", "walletAddress", "companyName", "portfolioUrls"] as const) {
      const value = updates[key];
      if (value !== undefined) directFields[key] = value;
    }

    if (Object.keys(apiFields).length > 0) {
      await api.patch("/api/v1/profile", apiFields);
    }
    if (Object.keys(directFields).length > 0) {
      await updateDoc(doc(db, COLLECTIONS.users, user.uid), directFields);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        sendSignInLink,
        confirmSignInLink,
        sendPasswordResetEmail,
        signOutUser,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const formatAuthError = (code?: string): string => {
  if (!code) return "An authentication error occurred. Please try again.";
  if (code.includes("auth/user-not-found")) return "No account found with this email address.";
  if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential"))
    return "Incorrect email or password. Please verify and try again.";
  if (code.includes("auth/email-already-in-use")) return "This email address is already registered.";
  if (code.includes("auth/invalid-email")) return "Invalid email address format.";
  if (code.includes("auth/weak-password")) return "Password must be at least 6 characters long.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Please wait and try again.";
  return "Authentication service error. Please check your network connection.";
};
