"use client";

import { useEffect, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth, db } from "@chainwork/firebase-client";
import { COLLECTIONS, type SerializedUser, type User } from "@chainwork/shared";
import { serializeUser } from "../firestore/serialize";

export interface CurrentUserState {
  user: SerializedUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

export function useCurrentUser(): CurrentUserState {
  const [firebaseUser, authLoading, authError] = useAuthState(auth);
  const [user, setUser] = useState<SerializedUser | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      setUser(null);
      setDocLoading(false);
      return;
    }

    setDocLoading(true);
    const ref = doc(db, COLLECTIONS.users, firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUser(snap.exists() ? serializeUser(snap.data() as User) : null);
        setDocLoading(false);
      },
      () => {
        setUser(null);
        setDocLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading, firebaseUser]);

  return {
    user,
    firebaseUser: firebaseUser ?? null,
    loading: authLoading || docLoading,
    error: authError ?? null,
  };
}
