export interface WithdrawalLimits {
  minAmount: number;
  maxAmount: number;
  maxDailyWithdrawals: number;
  maxMonthlyWithdrawals: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export const DEFAULT_WITHDRAWAL_LIMITS: WithdrawalLimits = {
  minAmount: 10,
  maxAmount: 10000,
  maxDailyWithdrawals: 3,
  maxMonthlyWithdrawals: 10,
  dailyLimit: 5000,
  monthlyLimit: 20000,
};

export interface WithdrawalEligibility {
  eligible: boolean;
  reason?: string;
  maxAllowed?: number;
}

export function checkWithdrawalEligibility(
  amount: number,
  userBalance: number,
  dailyWithdrawn: number,
  monthlyWithdrawn: number,
  limits: WithdrawalLimits = DEFAULT_WITHDRAWAL_LIMITS
): WithdrawalEligibility {
  if (amount < limits.minAmount) {
    return { 
      eligible: false, 
      reason: `Minimum withdrawal is $${limits.minAmount}` 
    };
  }
  
  if (amount > limits.maxAmount) {
    return { 
      eligible: false, 
      reason: `Maximum withdrawal is $${limits.maxAmount}` 
    };
  }
  
  if (amount > userBalance) {
    return { 
      eligible: false, 
      reason: 'Insufficient balance' 
    };
  }
  
  if (dailyWithdrawn + amount > limits.dailyLimit) {
    return { 
      eligible: false, 
      reason: `Daily withdrawal limit of $${limits.dailyLimit} exceeded`,
      maxAllowed: Math.max(0, limits.dailyLimit - dailyWithdrawn)
    };
  }
  
  if (monthlyWithdrawn + amount > limits.monthlyLimit) {
    return { 
      eligible: false, 
      reason: `Monthly withdrawal limit of $${limits.monthlyLimit} exceeded`,
      maxAllowed: Math.max(0, limits.monthlyLimit - monthlyWithdrawn)
    };
  }
  
  return { eligible: true };
}

export function getWithdrawalFee(amount: number): number {
  // Example: 1% withdrawal fee with min $0.50, max $10
  const fee = amount * 0.01;
  return Math.min(Math.max(fee, 0.5), 10);
}