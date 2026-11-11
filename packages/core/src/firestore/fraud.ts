import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type FraudAlert,
  type FraudAlertStatus,
} from "@chainwork/shared";
import { toMillis } from "./serialize";
import { bucketFromScore, type RiskBucket } from "@chainwork/shared";

export type AlertFilter = FraudAlertStatus | "all";

export interface SerializedFraudAlert extends Omit<FraudAlert, "createdAt"> {
  createdAt: number;
}

function serializeAlert(a: FraudAlert): SerializedFraudAlert {
  return { ...a, createdAt: toMillis(a.createdAt) };
}

function alertsCollection() {
  return collection(db, COLLECTIONS.fraudAlerts);
}

export async function listFraudAlerts(
  filter: AlertFilter
): Promise<SerializedFraudAlert[]> {
  try {
    const constraints =
      filter === "all"
        ? [orderBy("riskScore", "desc")]
        : [where("status", "==", filter), orderBy("riskScore", "desc")];
    const snap = await getDocs(query(alertsCollection(), ...constraints));
    return snap.docs.map((d) => serializeAlert(d.data() as FraudAlert));
  } catch (err) {
    console.warn("Fallback for listFraudAlerts:", err);
    try {
      const constraints =
        filter === "all" ? [] : [where("status", "==", filter)];
      const snap = await getDocs(query(alertsCollection(), ...constraints));
      const list = snap.docs.map((d) => serializeAlert(d.data() as FraudAlert));
      return list.sort((a, b) => b.riskScore - a.riskScore);
    } catch {
      return [];
    }
  }
}

export function subscribeFraudAlerts(
  filter: AlertFilter,
  callback: (alerts: SerializedFraudAlert[]) => void
): () => void {
  const constraints =
    filter === "all"
      ? [orderBy("riskScore", "desc")]
      : [where("status", "==", filter), orderBy("riskScore", "desc")];

  return onSnapshot(
    query(alertsCollection(), ...constraints),
    (snap) =>
      callback(snap.docs.map((d) => serializeAlert(d.data() as FraudAlert))),
    () => {
      // Fallback query without orderBy in case compound index is building
      const fallbackConstraints =
        filter === "all" ? [] : [where("status", "==", filter)];
      return onSnapshot(
        query(alertsCollection(), ...fallbackConstraints),
        (snap) => {
          const list = snap.docs.map((d) =>
            serializeAlert(d.data() as FraudAlert)
          );
          callback(list.sort((a, b) => b.riskScore - a.riskScore));
        },
        () => callback([])
      );
    }
  );
}

export interface RiskDistribution {
  low: number;
  medLow: number;
  medHigh: number;
  high: number;
  averageScore: number;
  total: number;
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  const snap = await getDocs(collection(db, COLLECTIONS.users)).catch(() => ({
    docs: [],
  }));
  const counts: Record<RiskBucket, number> = {
    low: 0,
    medLow: 0,
    medHigh: 0,
    high: 0,
  };
  let sum = 0;
  let total = 0;
  for (const doc of snap.docs) {
    const score = Number(doc.data().fraudScore ?? 0);
    sum += score;
    total += 1;
    counts[bucketFromScore(score)] += 1;
  }
  return {
    ...counts,
    averageScore: total === 0 ? 0 : sum / total,
    total,
  };
}
