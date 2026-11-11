import { NextResponse } from 'next/server';
import { calculateTransactionFee } from '@/lib/payment/platform-fees';
import { getCurrentUser } from '@/lib/firebase/server-auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, taxRate } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const fee = calculateTransactionFee(amount, { taxRate });
    
    return NextResponse.json({ fee });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate fees' },
      { status: 500 }
    );
  }
}