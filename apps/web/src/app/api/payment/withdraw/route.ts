import { NextResponse } from 'next/server';
import { logTransaction } from '@/lib/payment/transaction-log';
import { checkWithdrawalEligibility, getWithdrawalFee } from '@/lib/payment/withdrawal-limits';
import { getUserPaymentsData, getWithdrawnInWindow } from '@/lib/payment/balance';
import { getCurrentUser } from '@/lib/firebase/server-auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'freelancer' && user.role !== 'client') {
    return NextResponse.json({ error: 'Withdrawals are only available to freelancers and clients' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { amount, paymentMethod } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Real balance: escrow-derived earnings/refunds + wallet ledger.
    const { stats } = await getUserPaymentsData(user);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const [dailyWithdrawn, monthlyWithdrawn] = await Promise.all([
      getWithdrawnInWindow(user.uid, startOfDay),
      getWithdrawnInWindow(user.uid, startOfMonth),
    ]);

    const eligibility = checkWithdrawalEligibility(
      amount,
      stats.availableBalance,
      dailyWithdrawn,
      monthlyWithdrawn
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason },
        { status: 400 }
      );
    }

    const withdrawalFee = getWithdrawalFee(amount);
    const netAmount = amount - withdrawalFee;

    // Create the withdrawal request. It stays `pending` until an admin
    // approves or rejects it on the admin payments console.
    const withdrawalId = await logTransaction({
      userId: user.uid,
      userName: user.name,
      type: 'withdrawal',
      amount: -netAmount,
      feeAmount: withdrawalFee,
      netAmount: -amount,
      status: 'pending',
      metadata: {
        paymentMethod: paymentMethod || 'stripe',
        withdrawalFee,
        requestedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      withdrawalId,
      status: 'pending',
      amount: netAmount,
      fee: withdrawalFee,
      remainingBalance: stats.availableBalance - amount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Withdrawal failed' },
      { status: 500 }
    );
  }
}
