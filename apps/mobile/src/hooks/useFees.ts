import { useMemo } from "react";
import {
  calculateTransactionFee,
  type TransactionFee,
} from "@chainwork/shared";

export interface FeeResult {
  fee: TransactionFee | null;
  amountNum: number;
}

export function useFees(rawAmount: string): FeeResult {
  const amountNum = parseFloat(rawAmount.replace(/[$,]/g, "")) || 0;
  const fee = useMemo(
    () => (amountNum > 0 ? calculateTransactionFee(amountNum) : null),
    [amountNum]
  );
  return { fee, amountNum };
}
