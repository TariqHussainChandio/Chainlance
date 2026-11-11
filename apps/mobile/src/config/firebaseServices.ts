import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { COLLECTIONS } from "@chainwork/shared";

// Real-Time Firebase Services for Gigs, Contracts, Proposals, Notifications, Withdrawals
// Same collections as web app — shared Firestore database

type FirestoreTimestamp = FieldValue | Timestamp | Date | null | undefined;

export interface FirestoreGig {
  id?: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  title: string;
  category: string;
  description: string;
  pricingBasic: string;
  pricingStandard?: string;
  pricingPremium?: string;
  deliveryDays: number;
  skills: string[];
  thumbnailUrl?: string;
  status: "published" | "draft" | "unpublished";
  createdAt?: FirestoreTimestamp;
}

export interface FirestoreProposal {
  id?: string;
  gigId?: string;
  gigTitle: string;
  clientId?: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  coverLetter: string;
  bidAmount: string;
  timeline: string;
  status: "pending" | "active" | "rejected" | "withdrawn";
  createdAt?: FirestoreTimestamp;
}

export interface FirestoreNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: "contract" | "milestone" | "proposal" | "dispute" | "system" | "message";
  read: boolean;
  createdAt?: FirestoreTimestamp;
}

// Create Gig in Firestore
export const createFirestoreGig = async (gigData: FirestoreGig) => {
  try {
    const docRef = await addDoc(collection(db, "gigs"), {
      ...gigData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Firestore Gig creation offline fallback mode:", err);
    return `GIG-${Date.now()}`;
  }
};

// Update Gig in Firestore
export const updateFirestoreGig = async (gigId: string, updates: Partial<FirestoreGig>) => {
  try {
    const docRef = doc(db, "gigs", gigId);
    await updateDoc(docRef, updates);
  } catch (err) {
    console.warn("Firestore Gig update offline fallback mode:", err);
  }
};

// Create Proposal in Firestore
export const createFirestoreProposal = async (proposalData: FirestoreProposal) => {
  try {
    const docRef = await addDoc(collection(db, "proposals"), {
      ...proposalData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Firestore Proposal creation offline fallback mode:", err);
    return `PROP-${Date.now()}`;
  }
};

// Request Withdrawal in Firestore
export const requestFirestoreWithdrawal = async (
  userId: string,
  amount: string,
  destination: string,
  method: "stripe" | "web3" | "iban"
) => {
  try {
    const docRef = await addDoc(collection(db, "withdrawals"), {
      userId,
      amount,
      destination,
      method,
      status: "pending_clearance",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Firestore Withdrawal request offline fallback mode:", err);
    return `PO-${Date.now()}`;
  }
};

// Subscribe to Notifications for User
export const subscribeUserNotifications = (
  userId: string,
  callback: (notifications: FirestoreNotification[]) => void
) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.notifications),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notifs: FirestoreNotification[] = [];
      snapshot.forEach((d) => {
        notifs.push({ id: d.id, ...d.data() } as FirestoreNotification);
      });
      callback(notifs);
    });
  } catch (err) {
    console.warn("Firestore notifications subscription fallback:", err);
    callback([]);
    return () => {};
  }
};

// ─── Contract Queries (same schema as web) ─────────────────────────────────

export interface FirestoreContract {
  id: string;
  clientId: string;
  freelancerId: string;
  clientName: string;
  clientAvatar: string | null;
  freelancerName: string;
  freelancerAvatar: string | null;
  title: string;
  totalAmount: number;
  status: "draft" | "active" | "delivered" | "disputed" | "completed" | "cancelled";
  escrowFunded: boolean;
  mockTxHash: string | null;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface FirestoreMilestone {
  id: string;
  description: string;
  amount: number;
  status: "pending" | "delivered" | "approved" | "disputed" | "completed";
  order: number;
  deliveryEvidence: string | null;
  deliveredAt?: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp;
}

export const listFreelancerContracts = async (freelancerId: string): Promise<FirestoreContract[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.contracts),
      where("freelancerId", "==", freelancerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContract));
  } catch (err) {
    console.warn("listFreelancerContracts fallback:", err);
    return [];
  }
};

export const listClientContracts = async (clientId: string): Promise<FirestoreContract[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.contracts),
      where("clientId", "==", clientId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContract));
  } catch (err) {
    console.warn("listClientContracts fallback:", err);
    return [];
  }
};

export const getContractById = async (contractId: string): Promise<FirestoreContract | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.contracts, contractId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirestoreContract;
  } catch (err) {
    console.warn("getContractById fallback:", err);
    return null;
  }
};

export const listMilestones = async (contractId: string): Promise<FirestoreMilestone[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.contracts, contractId, "milestones"),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMilestone));
  } catch (err) {
    console.warn("listMilestones fallback:", err);
    return [];
  }
};

export const subscribeMilestones = (
  contractId: string,
  callback: (milestones: FirestoreMilestone[]) => void
) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.contracts, contractId, "milestones"),
      orderBy("order", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMilestone)));
    });
  } catch (err) {
    console.warn("subscribeMilestones fallback:", err);
    callback([]);
    return () => {};
  }
};

// ─── Proposal Queries ──────────────────────────────────────────────────────

export interface FirestoreProposalFull {
  id: string;
  gigId: string;
  gigTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string | null;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  status: "pending" | "active" | "rejected" | "withdrawn";
  createdAt?: FirestoreTimestamp;
}

export const listFreelancerProposals = async (freelancerId: string): Promise<FirestoreProposalFull[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.proposals),
      where("freelancerId", "==", freelancerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProposalFull));
  } catch (err) {
    console.warn("listFreelancerProposals fallback:", err);
    return [];
  }
};

export const listClientProposals = async (clientId: string): Promise<FirestoreProposalFull[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.proposals),
      where("clientId", "==", clientId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProposalFull));
  } catch (err) {
    console.warn("listClientProposals fallback:", err);
    return [];
  }
};

// ─── Gig Queries ───────────────────────────────────────────────────────────

export const listFreelancerGigs = async (freelancerId: string): Promise<FirestoreGig[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.gigs),
      where("freelancerId", "==", freelancerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreGig));
  } catch (err) {
    console.warn("listFreelancerGigs fallback:", err);
    return [];
  }
};

export const listPublishedGigs = async (): Promise<FirestoreGig[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.gigs),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreGig));
  } catch (err) {
    console.warn("listPublishedGigs fallback:", err);
    return [];
  }
};
