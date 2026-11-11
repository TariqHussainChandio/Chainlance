import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Contract,
  type ContractTransaction,
  type Milestone,
  type SerializedContract,
  type SerializedContractTransaction,
  type SerializedMilestone,
} from "@chainwork/shared";
import {
  serializeContract,
  serializeContractTransaction,
  serializeMilestone,
} from "./serialize";

const MILESTONES_SUB = "milestones";
const TRANSACTIONS_SUB = "transactions";

function contractDocRef(contractId: string) {
  return doc(db, COLLECTIONS.contracts, contractId);
}

function milestonesCollectionRef(contractId: string) {
  return collection(db, COLLECTIONS.contracts, contractId, MILESTONES_SUB);
}

function transactionsCollectionRef(contractId: string) {
  return collection(db, COLLECTIONS.contracts, contractId, TRANSACTIONS_SUB);
}

export async function listClientContracts(
  clientId: string
): Promise<SerializedContract[]> {
  const q = query(
    collection(db, COLLECTIONS.contracts),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeContract(d.data() as Contract));
}

export async function listFreelancerContracts(
  freelancerId: string
): Promise<SerializedContract[]> {
  const q = query(
    collection(db, COLLECTIONS.contracts),
    where("freelancerId", "==", freelancerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeContract(d.data() as Contract));
}

export async function getContractById(
  contractId: string
): Promise<SerializedContract | null> {
  const snap = await getDoc(contractDocRef(contractId));
  if (!snap.exists()) return null;
  return serializeContract(snap.data() as Contract);
}

export async function listMilestones(
  contractId: string
): Promise<SerializedMilestone[]> {
  const q = query(milestonesCollectionRef(contractId), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeMilestone(d.data() as Milestone));
}

export async function listTransactions(
  contractId: string
): Promise<SerializedContractTransaction[]> {
  const q = query(
    transactionsCollectionRef(contractId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    serializeContractTransaction({
      ...(d.data() as ContractTransaction),
      id: d.id,
    })
  );
}

export function subscribeContract(
  contractId: string,
  callback: (contract: SerializedContract | null) => void
): () => void {
  return onSnapshot(
    contractDocRef(contractId),
    (snap) =>
      callback(
        snap.exists() ? serializeContract(snap.data() as Contract) : null
      ),
    () => callback(null)
  );
}

export function subscribeMilestones(
  contractId: string,
  callback: (milestones: SerializedMilestone[]) => void
): () => void {
  const q = query(milestonesCollectionRef(contractId), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) =>
      callback(snap.docs.map((d) => serializeMilestone(d.data() as Milestone))),
    () => callback([])
  );
}

export function subscribeTransactions(
  contractId: string,
  callback: (transactions: SerializedContractTransaction[]) => void
): () => void {
  const q = query(
    transactionsCollectionRef(contractId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((d) =>
          serializeContractTransaction({
            ...(d.data() as ContractTransaction),
            id: d.id,
          })
        )
      ),
    () => callback([])
  );
}
