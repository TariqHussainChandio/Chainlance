export const CLIENT_FEE_PERCENTAGE = 0.05;
export const FREELANCER_FEE_PERCENTAGE = 0.10;
export const PLATFORM_FEE_PERCENTAGE = CLIENT_FEE_PERCENTAGE + FREELANCER_FEE_PERCENTAGE;

export interface TransactionFee {
  total: number;
  subtotal: number;
  clientFee: number;
  clientTotal: number;
  freelancerFee: number;
  platformFee: number;
  freelancerEarnings: number;
  tax?: number;
  currency?: string;
}

export function calculateClientFee(amount: number): number {
  return amount * CLIENT_FEE_PERCENTAGE;
}

export function calculateFreelancerFee(amount: number): number {
  return amount * FREELANCER_FEE_PERCENTAGE;
}

export function calculatePlatformFee(amount: number): number {
  return calculateFreelancerFee(amount);
}

export function calculateNetAmount(amount: number): number {
  return amount - calculateFreelancerFee(amount);
}

export function calculateTransactionFee(
  amount: number,
  options?: { taxRate?: number }
): TransactionFee {
  const subtotal = amount;
  const clientFee = calculateClientFee(subtotal);
  const clientTotal = subtotal + clientFee;
  const freelancerFee = calculateFreelancerFee(subtotal);
  const freelancerEarnings = subtotal - freelancerFee;
  const tax = options?.taxRate ? subtotal * options.taxRate : 0;

  return {
    total: clientTotal + tax,
    subtotal,
    clientFee,
    clientTotal,
    freelancerFee,
    platformFee: freelancerFee + clientFee,
    freelancerEarnings,
    tax: tax > 0 ? tax : undefined,
    currency: "USD",
  };
}

export function formatFeeBreakdown(fee: TransactionFee): string {
  let breakdown = `Subtotal: $${fee.subtotal.toFixed(2)}\n`;
  breakdown += `Client Fee (${(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}%): +$${fee.clientFee.toFixed(2)}\n`;
  breakdown += `Client Total: $${fee.clientTotal.toFixed(2)}\n`;
  breakdown += `Freelancer Fee (${(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}%): -$${fee.freelancerFee.toFixed(2)}\n`;
  if (fee.tax) {
    breakdown += `Tax: -$${fee.tax.toFixed(2)}\n`;
  }
  breakdown += `Freelancer Earns: $${fee.freelancerEarnings.toFixed(2)}`;
  return breakdown;
}
