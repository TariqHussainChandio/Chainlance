"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { sendNotificationAdmin } from "@/lib/firebase/admin-notifications";

export interface EstablishConnectionInput {
  freelancerId: string;
  freelancerName: string;
  gigId?: string | null;
  gigTitle?: string | null;
  message: string;
}

export interface ConnectionStatusResult {
  connected: boolean;
  status: "none" | "pending_freelancer_approval" | "approved" | "declined";
  connectionId?: string | null;
}

export async function checkConnectionAction(
  freelancerId: string
): Promise<ConnectionStatusResult> {
  const me = await getCurrentUser();
  if (!me) return { connected: false, status: "none" };
  if (me.uid === freelancerId) return { connected: true, status: "approved" };

  try {
    const docId = `${me.uid}_${freelancerId}`;
    const connSnap = await adminDb.collection("connections").doc(docId).get();
    if (connSnap.exists) {
      const data = connSnap.data() as { status?: string };
      const status = (data.status as ConnectionStatusResult["status"]) || "approved";
      return {
        connected: status === "approved",
        status,
        connectionId: docId,
      };
    }

    // Check if contract exists between them
    const contractSnap = await adminDb
      .collection(COLLECTIONS.contracts)
      .where("clientId", "==", me.uid)
      .where("freelancerId", "==", freelancerId)
      .limit(1)
      .get();

    if (!contractSnap.empty) {
      return { connected: true, status: "approved" };
    }

    // Check if proposal exists between them
    const propSnap = await adminDb
      .collection(COLLECTIONS.proposals)
      .where("clientId", "==", me.uid)
      .where("freelancerId", "==", freelancerId)
      .limit(1)
      .get();

    if (!propSnap.empty) {
      const propData = propSnap.docs[0]!.data();
      const status = propData.status === "accepted" ? "approved" : "pending_freelancer_approval";
      return { connected: status === "approved", status };
    }

    return { connected: false, status: "none" };
  } catch (err) {
    console.error("checkConnectionAction error:", err);
    return { connected: false, status: "none" };
  }
}

export async function establishConnectionAction(
  input: EstablishConnectionInput
): Promise<{ success: true; connectionId: string }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const message = input.message.trim();
  if (!message || message.length < 10) {
    throw new Error("Please enter a message describing your requirements (min 10 characters).");
  }

  const docId = `${me.uid}_${input.freelancerId}`;
  const connectionRef = adminDb.collection("connections").doc(docId);
  const now = FieldValue.serverTimestamp();

  await connectionRef.set(
    {
      id: docId,
      clientId: me.uid,
      clientName: me.name,
      clientAvatar: me.profileImage ?? null,
      freelancerId: input.freelancerId,
      freelancerName: input.freelancerName,
      gigId: input.gigId ?? null,
      gigTitle: input.gigTitle ?? null,
      lastMessage: message,
      status: "pending_freelancer_approval",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  // Send notification to freelancer
  void sendNotificationAdmin({
    userId: input.freelancerId,
    title: "New Client Connection Request 🤝",
    message: `${me.name} wants to order/connect for "${input.gigTitle || "Project"}": "${message.slice(0, 70)}...". Please review and approve scope.`,
    type: "message",
    link: `/freelancer/messages`,
  });

  revalidatePath("/client/browse");
  revalidatePath("/freelancer/messages");
  return { success: true, connectionId: docId };
}

export async function approveConnectionAction(
  connectionId: string
): Promise<{ success: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const ref = adminDb.collection("connections").doc(connectionId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Connection request not found.");

  const data = snap.data() as { freelancerId: string; clientId: string; clientName: string; gigTitle?: string };
  if (data.freelancerId !== me.uid) {
    throw new Error("Only the targeted freelancer can approve connection requests.");
  }

  await ref.update({
    status: "approved",
    updatedAt: FieldValue.serverTimestamp(),
  });

  void sendNotificationAdmin({
    userId: data.clientId,
    title: "Connection & Order Scope Approved 🎉",
    message: `${me.name} approved your project request for "${data.gigTitle || "Project"}". You can now fund escrow to start work!`,
    type: "contract",
    link: `/client/contracts`,
  });

  revalidatePath("/client/contracts");
  revalidatePath("/freelancer/contracts");
  return { success: true };
}
