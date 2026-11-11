import { NextResponse } from 'next/server';
import { calculatePlatformFee } from '@/lib/payment/platform-fees';
import { logTransaction } from '@/lib/payment/transaction-log';
import { getCurrentUser } from '@/lib/firebase/server-auth';
import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/schema';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      amount, 
      freelancerId, 
      freelancerName,
      contractId, 
      milestoneId,
      type = 'payment' 
    } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Wallet deposit: a single ledger credit, no contract involved and no fee
    // (platform fees are charged on contract money, per shared fee constants).
    if (type === 'deposit') {
      const depositId = await logTransaction({
        userId: user.uid,
        userName: user.name,
        type: 'deposit',
        amount,
        status: 'completed',
        referenceId: contractId || `deposit_${Date.now()}`,
        metadata: { method: 'stripe_demo' },
      });
      return NextResponse.json({ success: true, depositId, amount });
    }

    if (!freelancerId || !contractId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const platformFee = calculatePlatformFee(amount);
    const freelancerEarnings = amount - platformFee;

    // Process payment logic (mock for now)
    const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Date.now().toString(16)}`;

    // Log client payment
    await logTransaction({
      userId: user.uid,
      userName: user.name,
      type: 'payment',
      amount: -amount,
      status: 'completed',
      referenceId: contractId,
      metadata: { 
        freelancerId, 
        contractId, 
        milestoneId,
        txHash,
        platformFee,
        freelancerEarnings
      }
    });

    // Log platform fee
    await logTransaction({
      userId: user.uid,
      userName: user.name,
      type: 'platform_fee',
      amount: -platformFee,
      status: 'completed',
      referenceId: contractId,
      metadata: { 
        originalAmount: amount,
        contractId,
        milestoneId
      }
    });

    // Log freelancer earnings
    await logTransaction({
      userId: freelancerId,
      userName: freelancerName || 'Freelancer',
      type: 'payment',
      amount: freelancerEarnings,
      status: 'completed',
      referenceId: contractId,
      metadata: { 
        clientId: user.uid,
        clientName: user.name,
        contractId,
        milestoneId,
        txHash,
        platformFee
      }
    });

    // Update contract with transaction reference (only if the contract exists —
    // simulated payments may reference synthetic ids).
    const contractRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
    const contractSnap = await contractRef.get();
    if (contractSnap.exists) {
      await contractRef.update({
        mockTxHash: txHash,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({ 
      success: true, 
      txHash,
      platformFee,
      freelancerEarnings 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    );
  }
}