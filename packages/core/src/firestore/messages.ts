import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Message,
  type SerializedMessage,
} from "@chainwork/shared";
import { serializeMessage } from "./serialize";
import { detectContactInfo } from "../utils/contact-detector";
import { ports } from "../ports";

const MESSAGES_SUB = "messages";
const PAGE_SIZE = 100;

function messagesCollection(contractId: string) {
  return collection(db, COLLECTIONS.contracts, contractId, MESSAGES_SUB);
}

export function subscribeMessages(
  contractId: string,
  callback: (messages: SerializedMessage[]) => void
): () => void {
  const q = query(
    messagesCollection(contractId),
    orderBy("createdAt", "asc"),
    fsLimit(PAGE_SIZE)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) =>
          serializeMessage({
            ...(d.data() as Message),
            id: d.id,
          })
        )
      );
    },
    () => callback([])
  );
}

export async function sendMessage(args: {
  contractId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}): Promise<void> {
  const trimmed = args.content.trim();
  if (trimmed.length === 0 && !args.attachmentUrl) return;

  if (trimmed.length > 0) {
    const piiResult = detectContactInfo(trimmed);
    if (piiResult.hasPII) {
      throw new Error(
        piiResult.reason ||
          "Sharing personal contact info (email, phone number, WhatsApp, etc.) is strictly prohibited."
      );
    }
  }

  await addDoc(messagesCollection(args.contractId), {
    senderId: args.senderId,
    senderName: args.senderName,
    senderAvatar: args.senderAvatar,
    content: trimmed || (args.attachmentName ? `Attached file: ${args.attachmentName}` : "File attachment"),
    attachmentUrl: args.attachmentUrl ?? null,
    attachmentName: args.attachmentName ?? null,
    readAt: null,
    createdAt: serverTimestamp(),
  });

  void ports.notify.sendChatMessageNotification({
    contractId: args.contractId,
    senderId: args.senderId,
    senderName: args.senderName,
    content: trimmed,
  });
}

export async function markMessagesAsRead(
  contractId: string,
  currentUserId: string
): Promise<void> {
  try {
    const q = query(
      messagesCollection(contractId),
      where("readAt", "==", null),
      fsLimit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    const unreadOtherDocs = snap.docs.filter(
      (d) => d.data().senderId !== currentUserId
    );
    await Promise.all(
      unreadOtherDocs.map((d) =>
        updateDoc(
          doc(db, COLLECTIONS.contracts, contractId, MESSAGES_SUB, d.id),
          { readAt: serverTimestamp() }
        )
      )
    );
  } catch (err) {
    console.warn("Could not mark messages as read:", err);
  }
}
