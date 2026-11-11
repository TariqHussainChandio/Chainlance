import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Proposal,
  type ProposalMilestone,
  type ProposalStatus,
  type SerializedProposal,
} from "@chainwork/shared";
import { serializeProposal } from "./serialize";

import { createNotification } from "./notifications";

export interface CreateProposalInput {
  gigId: string;
  gigTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string | null;
  freelancerRating?: number;
  clientId: string;
  clientName: string;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  milestones?: ProposalMilestone[];
}

export async function createProposal(
  input: CreateProposalInput
): Promise<string> {
  const proposalsRef = collection(db, COLLECTIONS.proposals);
  const docRef = await addDoc(proposalsRef, {
    ...input,
    freelancerRating: input.freelancerRating ?? 5.0,
    milestones: input.milestones ?? [],
    status: "pending" as ProposalStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  void createNotification({
    userId: input.clientId,
    title: "New Custom Proposal 📬",
    message: `${input.freelancerName} submitted a proposal ($${input.bidAmount}) for "${input.gigTitle}".`,
    type: "proposal",
    link: `/client/proposals`,
  });

  return docRef.id;
}

export async function listFreelancerProposals(
  freelancerId: string
): Promise<SerializedProposal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.proposals),
      where("freelancerId", "==", freelancerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      serializeProposal({ ...(d.data() as Proposal), id: d.id })
    );
  } catch (err) {
    console.warn("Primary query failed for listFreelancerProposals, trying fallback:", err);
    try {
      const q = query(
        collection(db, COLLECTIONS.proposals),
        where("freelancerId", "==", freelancerId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) =>
        serializeProposal({ ...(d.data() as Proposal), id: d.id })
      );
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (fallbackErr) {
      console.warn("Secondary query failed for listFreelancerProposals, reading all proposals:", fallbackErr);
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.proposals));
        const list = snap.docs
          .map((d) => serializeProposal({ ...(d.data() as Proposal), id: d.id }))
          .filter((p) => p.freelancerId === freelancerId);
        return list.sort((a, b) => b.createdAt - a.createdAt);
      } catch (finalErr) {
        console.error("Error reading freelancer proposals:", finalErr);
        return [];
      }
    }
  }
}

export async function listClientProposals(
  clientId: string
): Promise<SerializedProposal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.proposals),
      where("clientId", "==", clientId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      serializeProposal({ ...(d.data() as Proposal), id: d.id })
    );
  } catch (err) {
    console.warn("Primary query failed for listClientProposals, trying fallback:", err);
    try {
      const q = query(
        collection(db, COLLECTIONS.proposals),
        where("clientId", "==", clientId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) =>
        serializeProposal({ ...(d.data() as Proposal), id: d.id })
      );
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (fallbackErr) {
      console.warn("Secondary query failed for listClientProposals, reading all proposals:", fallbackErr);
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.proposals));
        const list = snap.docs
          .map((d) => serializeProposal({ ...(d.data() as Proposal), id: d.id }))
          .filter((p) => p.clientId === clientId);
        return list.sort((a, b) => b.createdAt - a.createdAt);
      } catch (finalErr) {
        console.error("Error reading client proposals:", finalErr);
        return [];
      }
    }
  }
}

export async function listGigProposals(
  gigId: string
): Promise<SerializedProposal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.proposals),
      where("gigId", "==", gigId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      serializeProposal({ ...(d.data() as Proposal), id: d.id })
    );
  } catch (err) {
    console.warn("Primary query failed for listGigProposals, trying fallback:", err);
    try {
      const q = query(
        collection(db, COLLECTIONS.proposals),
        where("gigId", "==", gigId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) =>
        serializeProposal({ ...(d.data() as Proposal), id: d.id })
      );
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (fallbackErr) {
      try {
        const snap = await getDocs(collection(db, COLLECTIONS.proposals));
        const list = snap.docs
          .map((d) => serializeProposal({ ...(d.data() as Proposal), id: d.id }))
          .filter((p) => p.gigId === gigId);
        return list.sort((a, b) => b.createdAt - a.createdAt);
      } catch (finalErr) {
        console.error("Error reading gig proposals:", finalErr);
        return [];
      }
    }
  }
}

export async function updateProposalStatus(
  proposalId: string,
  status: ProposalStatus
): Promise<void> {
  const ref = doc(db, COLLECTIONS.proposals, proposalId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function acceptProposalAndCreateContract(
  proposal: SerializedProposal,
  clientId: string,
  clientName: string,
  clientAvatar: string | null
): Promise<string> {
  // 1. Update proposal status to accepted
  await updateProposalStatus(proposal.id, "accepted");

  // 2. Create contract document
  const contractsRef = collection(db, COLLECTIONS.contracts);
  const contractDoc = await addDoc(contractsRef, {
    clientId,
    clientName,
    clientAvatar,
    freelancerId: proposal.freelancerId,
    freelancerName: proposal.freelancerName,
    freelancerAvatar: proposal.freelancerAvatar,
    gigId: proposal.gigId,
    gigTitle: proposal.gigTitle,
    title: proposal.gigTitle || "Project Contract",
    totalAmount: proposal.bidAmount,
    status: "draft",
    mockTxHash: null,
    escrowFunded: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3. Create milestone subdocuments under contract if any
  const milestonesSub = collection(db, COLLECTIONS.contracts, contractDoc.id, "milestones");
  if (proposal.milestones && proposal.milestones.length > 0) {
    let order = 0;
    for (const m of proposal.milestones) {
      order++;
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + (m.deadlineDays || 7));
      await addDoc(milestonesSub, {
        description: m.description,
        amount: m.amount,
        deadline: deadlineDate,
        status: "pending",
        deliveryEvidence: null,
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } else {
    // Default 1 milestone for full amount
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (proposal.deliveryDays || 7));
    await addDoc(milestonesSub, {
      description: "Complete Project Deliverable",
      amount: proposal.bidAmount,
      deadline: deadlineDate,
      status: "pending",
      deliveryEvidence: null,
      order: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return contractDoc.id;
}
