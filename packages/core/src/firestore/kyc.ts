import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type KycSubmission,
  type KycSubmissionStatus,
  type SerializedKycSubmission,
} from "@chainwork/shared";
import { serializeKycSubmission } from "./serialize";

export type KycListFilter = KycSubmissionStatus | "all";

function kycCollection() {
  return collection(db, COLLECTIONS.kycSubmissions);
}

export async function listKycSubmissions(
  filter: KycListFilter
): Promise<SerializedKycSubmission[]> {
  const constraints =
    filter === "all"
      ? [orderBy("createdAt", "desc")]
      : [where("status", "==", filter), orderBy("createdAt", "desc")];
  const snap = await getDocs(query(kycCollection(), ...constraints));
  return snap.docs.map((d) =>
    serializeKycSubmission(d.data() as KycSubmission)
  );
}
