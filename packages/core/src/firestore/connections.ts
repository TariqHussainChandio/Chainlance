import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import { COLLECTIONS } from "@chainwork/shared";
import { createNotification } from "./notifications";

export interface UserConnection {
  id: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  gigId?: string | null;
  lastMessage?: string;
  createdAt: number;
}

export async function checkClientFreelancerConnection(
  clientId: string,
  freelancerId: string
): Promise<boolean> {
  if (!clientId || !freelancerId) return false;
  if (clientId === freelancerId) return true;

  try {
    // 1. Check connections collection
    const q = query(
      collection(db, "connections"),
      where("clientId", "==", clientId),
      where("freelancerId", "==", freelancerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return true;

    // 2. Fallback check: if any contracts or proposals exist between client and freelancer
    const contractQ = query(
      collection(db, COLLECTIONS.contracts),
      where("clientId", "==", clientId),
      where("freelancerId", "==", freelancerId)
    );
    const contractSnap = await getDocs(contractQ);
    if (!contractSnap.empty) return true;

    const propQ = query(
      collection(db, COLLECTIONS.proposals),
      where("clientId", "==", clientId),
      where("freelancerId", "==", freelancerId)
    );
    const propSnap = await getDocs(propQ);
    if (!propSnap.empty) return true;

    return false;
  } catch (err) {
    console.warn("Error checking client-freelancer connection:", err);
    return false;
  }
}

export async function establishClientFreelancerConnection(args: {
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  gigId?: string | null;
  gigTitle?: string | null;
  message: string;
}): Promise<void> {
  const docId = `${args.clientId}_${args.freelancerId}`;
  const connectionRef = doc(db, "connections", docId);

  await setDoc(
    connectionRef,
    {
      clientId: args.clientId,
      clientName: args.clientName,
      freelancerId: args.freelancerId,
      freelancerName: args.freelancerName,
      gigId: args.gigId ?? null,
      gigTitle: args.gigTitle ?? null,
      lastMessage: args.message.trim(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Send notification to freelancer about new connection request / message
  void createNotification({
    userId: args.freelancerId,
    title: "New Client Connection 🤝",
    message: `${args.clientName} connected with you regarding "${args.gigTitle || "a new project"}": "${args.message.trim().slice(0, 80)}..."`,
    type: "message",
    link: `/freelancer/messages`,
  });
}
