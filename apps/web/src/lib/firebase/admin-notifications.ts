import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type NotificationType } from "@/lib/firebase/schema";

export async function sendNotificationAdmin(input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}): Promise<string> {
  try {
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
    return ref.id;
  } catch (err) {
    console.warn("[sendNotificationAdmin] Failed to send notification:", err);
    return "";
  }
}
