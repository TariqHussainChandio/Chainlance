"use server";

import { getCurrentUser } from "@/lib/firebase/server-auth";
import {
  getUserPaymentsData,
  type UserPaymentsData,
} from "@/lib/payment/balance";

/**
 * Real payment overview for the signed-in freelancer or client:
 * escrow-derived contract money + wallet ledger (deposits/withdrawals).
 */
export async function getMyPaymentsOverview(): Promise<UserPaymentsData> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "freelancer" && user.role !== "client") {
    throw new Error("Payments overview is only available to freelancers and clients.");
  }
  return getUserPaymentsData(user);
}
