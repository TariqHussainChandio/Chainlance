import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type AppNotification,
  type NotificationType,
  type SerializedNotification,
} from "@chainwork/shared";

import { ports } from "../ports";

/**
 * Platform note: the web notification bell sound and AudioContext unlocking
 * live in apps/web/src/lib/firebase/notifications-audio.ts; core signals
 * "new notification" sounds through `ports.audio`.
 */
export function playNotificationBellSound() {
  ports.audio.playNotificationSound();
}

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}): Promise<string> {
  try {
    const ref = doc(collection(db, COLLECTIONS.notifications));
    const docData = {
      id: ref.id,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
      read: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, docData);
    return ref.id;
  } catch (err) {
    console.warn("[createNotification] Client Firestore write failed, using server action:", err);
    return "";
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId || notificationId.startsWith("demo_")) return;
  try {
    const ref = doc(db, COLLECTIONS.notifications, notificationId);
    await updateDoc(ref, { read: true });
  } catch {
    await ports.notificationsFallback.markRead(notificationId);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.notifications),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const unreadDocs = snap.docs.filter((d) => !d.data().read);
    await Promise.all(unreadDocs.map((d) => updateDoc(d.ref, { read: true })));
  } catch {
    await ports.notificationsFallback.markAllRead(userId);
  }
}

export function subscribeUserNotifications(
  userId: string,
  onUpdate: (notifications: SerializedNotification[], hasNewUnread: boolean) => void
): Unsubscribe {
  let knownIds = new Set<string>();
  let initialLoad = true;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let unsubSnapshot: Unsubscribe | null = null;

  async function pollServer() {
    try {
      const list = await ports.notificationsFallback.list(userId);
      let newlyAdded = false;

      if (!initialLoad) {
        for (const item of list) {
          if (!item.read && !knownIds.has(item.id)) {
            newlyAdded = true;
            break;
          }
        }
      }

      knownIds = new Set(list.map((n) => n.id));
      initialLoad = false;
      onUpdate(list, newlyAdded);
    } catch (err) {
      console.warn("[pollServer] Notifications poll error:", err);
    }
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.notifications),
      where("userId", "==", userId)
    );

    unsubSnapshot = onSnapshot(
      q,
      (snap) => {
        let newlyAddedUnread = false;
        const list: SerializedNotification[] = snap.docs
          .map((d) => {
            const data = d.data() as AppNotification;
            return {
              id: d.id,
              userId: data.userId,
              title: data.title || "Notification",
              message: data.message || "",
              type: data.type || "system",
              link: data.link ?? null,
              read: Boolean(data.read),
              createdAt: data.createdAt?.toMillis
                ? data.createdAt.toMillis()
                : Date.now(),
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);

        if (!initialLoad) {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              if (!data.read) newlyAddedUnread = true;
            }
          });
        }

        knownIds = new Set(list.map((n) => n.id));
        initialLoad = false;
        onUpdate(list, newlyAddedUnread);
      },
      (err) => {
        // Handle client permission errors silently and start server action polling fallback!
        console.warn("[subscribeUserNotifications] Client Firestore snapshot unavailable, switching to Server Action polling:", err.message);
        if (unsubSnapshot) {
          try { unsubSnapshot(); } catch {}
          unsubSnapshot = null;
        }
        void pollServer();
        pollTimer = setInterval(pollServer, 4000);
      }
    );
  } catch (err) {
    void pollServer();
    pollTimer = setInterval(pollServer, 4000);
  }

  return () => {
    if (unsubSnapshot) {
      try { unsubSnapshot(); } catch {}
    }
    if (pollTimer) {
      clearInterval(pollTimer);
    }
  };
}
