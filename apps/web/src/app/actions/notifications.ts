"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type NotificationType, type SerializedNotification } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";

/**
 * Lists notifications. Non-admins can only read their own; admins may pass
 * a targetUserId to inspect another user's feed.
 */
export async function getUserNotificationsAction(
  targetUserId?: string
): Promise<SerializedNotification[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const uid =
      user.role === "admin" && targetUserId ? targetUserId : user.uid;

    const snap = await adminDb
      .collection(COLLECTIONS.notifications)
      .where("userId", "==", uid)
      .get();

    const list: SerializedNotification[] = snap.docs.map((d) => {
      const data = d.data();
      let createdAtMs = Date.now();
      if (data.createdAt && typeof data.createdAt.toMillis === "function") {
        createdAtMs = data.createdAt.toMillis();
      } else if (data.createdAt && typeof data.createdAt._seconds === "number") {
        createdAtMs = data.createdAt._seconds * 1000;
      }

      return {
        id: d.id,
        userId: data.userId || uid,
        title: data.title || "Notification",
        message: data.message || "",
        type: (data.type as NotificationType) || "system",
        link: data.link ?? null,
        read: Boolean(data.read),
        createdAt: createdAtMs,
      };
    });

    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.warn("[getUserNotificationsAction] Error fetching notifications:", err);
    return [];
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean }> {
  if (!notificationId || notificationId.startsWith("demo_")) {
    return { success: true };
  }
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const ref = adminDb.collection(COLLECTIONS.notifications).doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false };
    if (snap.data()?.userId !== user.uid && user.role !== "admin") {
      return { success: false };
    }

    await ref.update({ read: true });
    return { success: true };
  } catch (err) {
    console.warn("[markNotificationReadAction] Error marking read:", err);
    return { success: false };
  }
}

export async function markAllNotificationsReadAction(
  targetUserId?: string
): Promise<{ success: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };
    const uid =
      user.role === "admin" && targetUserId ? targetUserId : user.uid;

    const snap = await adminDb
      .collection(COLLECTIONS.notifications)
      .where("userId", "==", uid)
      .get();

    const batch = adminDb.batch();
    let count = 0;
    snap.docs.forEach((d) => {
      if (!d.data().read) {
        batch.update(d.ref, { read: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    return { success: true };
  } catch (err) {
    console.warn("[markAllNotificationsReadAction] Error marking all read:", err);
    return { success: false };
  }
}

export async function createNotificationAction(input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}): Promise<{ success: boolean; id?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const ref = adminDb.collection(COLLECTIONS.notifications).doc();
    await ref.set({
      id: ref.id,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (err) {
    console.warn("[createNotificationAction] Error creating notification:", err);
    return { success: false };
  }
}

export async function deleteNotificationAction(
  notificationId: string
): Promise<{ success: boolean }> {
  if (!notificationId || notificationId.startsWith("demo_")) {
    return { success: true };
  }
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    const ref = adminDb.collection(COLLECTIONS.notifications).doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) return { success: true };
    if (snap.data()?.userId !== user.uid && user.role !== "admin") {
      return { success: false };
    }

    await ref.delete();
    return { success: true };
  } catch (err) {
    console.warn("[deleteNotificationAction] Error deleting notification:", err);
    return { success: false };
  }
}

export async function sendChatMessageNotificationAction(input: {
  contractId: string;
  senderId: string;
  senderName: string;
  content: string;
}): Promise<{ success: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };
    // The sender must be the authenticated caller.
    if (input.senderId !== user.uid) return { success: false };

    const contractRef = adminDb.collection(COLLECTIONS.contracts).doc(input.contractId);
    const snap = await contractRef.get();
    if (!snap.exists) return { success: false };

    const contract = snap.data();
    if (!contract) return { success: false };

    // The caller must be a participant of the contract.
    if (user.uid !== contract.clientId && user.uid !== contract.freelancerId) {
      return { success: false };
    }

    let recipientId: string;
    let recipientRole: "freelancer" | "client";
    if (user.uid === contract.clientId) {
      recipientId = contract.freelancerId;
      recipientRole = "freelancer";
    } else {
      recipientId = contract.clientId;
      recipientRole = "client";
    }

    const trimmed = input.content.trim();
    const messageSnippet =
      trimmed.length > 70
        ? `${trimmed.slice(0, 70)}...`
        : trimmed || "Sent a message attachment";

    await createNotificationAction({
      userId: recipientId,
      title: `New Message from ${input.senderName} 💬`,
      message: messageSnippet,
      type: "message",
      link: `/${recipientRole}/contracts/${input.contractId}`,
    });

    return { success: true };
  } catch (err) {
    console.warn(
      "[sendChatMessageNotificationAction] Error dispatching message notification:",
      err
    );
    return { success: false };
  }
}
