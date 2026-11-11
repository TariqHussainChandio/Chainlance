import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '@chainwork/firebase-client';
import { COLLECTIONS } from '@chainwork/shared';

export interface FirebaseTransaction {
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const TRANSACTIONS_COLLECTION = 'transactions';

export function getTransactionsCollection() {
  return collection(db, TRANSACTIONS_COLLECTION);
}

export async function addTransaction(
  data: Omit<FirebaseTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(getTransactionsCollection(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTransactionStatus(
  transactionId: string,
  status: FirebaseTransaction['status']
): Promise<void> {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserTransactions(
  userId: string,
  limitCount = 50
): Promise<FirebaseTransaction[]> {
  const q = query(
    getTransactionsCollection(),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirebaseTransaction[];
}

export async function getTransactionById(
  transactionId: string
): Promise<FirebaseTransaction | null> {
  const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as FirebaseTransaction;
}

export async function getTransactionsByReference(
  referenceId: string
): Promise<FirebaseTransaction[]> {
  const q = query(
    getTransactionsCollection(),
    where('referenceId', '==', referenceId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirebaseTransaction[];
}

export async function getPlatformFees(
  startDate?: Date,
  endDate?: Date
): Promise<FirebaseTransaction[]> {
  const constraints = [where('type', '==', 'platform_fee')];
  
  if (startDate) {
    constraints.push(where('createdAt', '>=', startDate));
  }
  if (endDate) {
    constraints.push(where('createdAt', '<=', endDate));
  }
  
  const q = query(getTransactionsCollection(), ...constraints, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirebaseTransaction[];
}