import { adminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/schema';
import { FieldValue } from 'firebase-admin/firestore';

export interface TransactionLogEntry {
  id?: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'platform_fee' | 'refund';
  amount: number;
  feeAmount?: number;
  netAmount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: FirebaseFirestore.FieldValue | number;
}

export async function logTransaction(
  entry: Omit<TransactionLogEntry, 'id' | 'createdAt'>
): Promise<string> {
  const ref = adminDb.collection(COLLECTIONS.transactions).doc();
  await ref.set({
    ...entry,
    id: ref.id,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getTransactionHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<TransactionLogEntry[]> {
  const query = adminDb
    .collection(COLLECTIONS.transactions)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (offset > 0) {
    // Would need cursor-based pagination for offset
    // This is a simplified version
  }

  const snap = await query.get();
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TransactionLogEntry[];
}

export async function getTransactionById(
  transactionId: string
): Promise<TransactionLogEntry | null> {
  const snap = await adminDb
    .collection(COLLECTIONS.transactions)
    .doc(transactionId)
    .get();
  
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as TransactionLogEntry;
}

export async function getTransactionsByReference(
  referenceId: string
): Promise<TransactionLogEntry[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.transactions)
    .where('referenceId', '==', referenceId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TransactionLogEntry[];
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionLogEntry['status']
): Promise<void> {
  await adminDb
    .collection(COLLECTIONS.transactions)
    .doc(transactionId)
    .update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });
}