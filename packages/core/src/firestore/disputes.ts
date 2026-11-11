import {
  collection,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Contract,
  type Message,
  type Milestone,
  type SerializedContract,
  type SerializedMessage,
  type SerializedMilestone,
} from "@chainwork/shared";
import {
  serializeContract,
  serializeMessage,
  serializeMilestone,
} from "./serialize";

export type DisputeFilter = "active" | "resolved" | "all";

const RESOLVED_STATUSES = ["completed", "cancelled"] as const;

function contractsCollection() {
  return collection(db, COLLECTIONS.contracts);
}

export async function listDisputes(
  filter: DisputeFilter = "active"
): Promise<SerializedContract[]> {
  try {
    if (filter === "active") {
      const q = query(
        contractsCollection(),
        where("status", "==", "disputed"),
        orderBy("updatedAt", "desc"),
        fsLimit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => serializeContract(d.data() as Contract));
    }

    const statuses =
      filter === "resolved"
        ? RESOLVED_STATUSES
        : (["disputed", ...RESOLVED_STATUSES] as const);
    const q = query(
      contractsCollection(),
      where("status", "in", statuses as unknown as string[]),
      orderBy("updatedAt", "desc"),
      fsLimit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => serializeContract(d.data() as Contract));
  } catch (err) {
    console.warn("Fallback for listDisputes:", err);
    try {
      const snap = await getDocs(contractsCollection());
      const all = snap.docs.map((d) => serializeContract(d.data() as Contract));
      const statuses =
        filter === "active"
          ? ["disputed"]
          : filter === "resolved"
          ? (RESOLVED_STATUSES as unknown as string[])
          : ["disputed", ...(RESOLVED_STATUSES as unknown as string[])];
      return all
        .filter((c) => statuses.includes(c.status))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }
}

export function subscribeDisputes(
  filter: DisputeFilter,
  callback: (contracts: SerializedContract[]) => void
): () => void {
  const statuses =
    filter === "active"
      ? (["disputed"] as const)
      : filter === "resolved"
        ? RESOLVED_STATUSES
        : (["disputed", ...RESOLVED_STATUSES] as const);

  const q = query(
    contractsCollection(),
    where("status", "in", statuses as unknown as string[]),
    orderBy("updatedAt", "desc"),
    fsLimit(200)
  );

  return onSnapshot(
    q,
    (snap) =>
      callback(snap.docs.map((d) => serializeContract(d.data() as Contract))),
    () => {
      // Fallback query without orderBy in case compound index is building
      const fallbackQ = query(
        contractsCollection(),
        where("status", "in", statuses as unknown as string[]),
        fsLimit(200)
      );
      return onSnapshot(
        fallbackQ,
        (snap) => {
          const list = snap.docs.map((d) =>
            serializeContract(d.data() as Contract)
          );
          callback(list.sort((a, b) => b.updatedAt - a.updatedAt));
        },
        () => callback([])
      );
    }
  );
}

export interface DisputeContext {
  contract: SerializedContract | null;
  milestones: SerializedMilestone[];
  systemMessages: SerializedMessage[];
  recentMessages: SerializedMessage[];
}

export async function getDisputeContext(
  contractId: string
): Promise<DisputeContext> {
  const contractSnap = await getDocs(
    query(
      contractsCollection(),
      where("id", "==", contractId),
      fsLimit(1)
    )
  );
  const contract =
    contractSnap.empty || !contractSnap.docs[0]
      ? null
      : serializeContract(contractSnap.docs[0].data() as Contract);

  const milestonesQ = query(
    collection(db, COLLECTIONS.contracts, contractId, "milestones"),
    orderBy("order", "asc")
  );
  const milestonesSnap = await getDocs(milestonesQ).catch(() => ({ docs: [] }));
  const milestones = milestonesSnap.docs.map((d) =>
    serializeMilestone(d.data() as Milestone)
  );

  const messagesCol = collection(
    db,
    COLLECTIONS.contracts,
    contractId,
    "messages"
  );
  const systemMessagesSnap = await getDocs(
    query(
      messagesCol,
      where("senderId", "==", "system"),
      orderBy("createdAt", "desc"),
      fsLimit(20)
    )
  ).catch(() => ({ docs: [] }));

  const systemMessages = systemMessagesSnap.docs.map((d) =>
    serializeMessage({ ...(d.data() as Message), id: d.id })
  );

  const recentSnap = await getDocs(
    query(messagesCol, orderBy("createdAt", "desc"), fsLimit(20))
  ).catch(() => ({ docs: [] }));

  const recentMessages = recentSnap.docs
    .map((d) => serializeMessage({ ...(d.data() as Message), id: d.id }))
    .reverse();

  return { contract, milestones, systemMessages, recentMessages };
}
