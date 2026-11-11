"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type User } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/schemas/review-schema";

const PHONE_RE = /^\+?[0-9]{7,15}$/;

export interface UpdateContactInfoInput {
  phoneNumber?: string | null;
  email?: string;
}

export type UpdateContactInfoResult =
  | {
      ok: true;
      emailChanged: boolean;
      phoneChanged: boolean;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Phone is optional contact metadata. Email is owned by Firebase Auth —
 * we update both Auth and the denormalized Firestore field in lock-step
 * and flip emailVerified back to false so the new address has to be
 * re-verified. Email change failures bubble up so the UI can show the
 * specific reason (already-in-use, etc.).
 */
export async function updateContactInfo(
  input: UpdateContactInfoInput
): Promise<UpdateContactInfoResult> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new Error("Account record missing.");
  const before = snap.data() as User;

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // ── Phone ────────────────────────────────────────────────────────────
  let phoneChanged = false;
  if (input.phoneNumber !== undefined) {
    const next = input.phoneNumber?.trim() ?? "";
    if (next.length > 0 && !PHONE_RE.test(next)) {
      throw new Error(
        "Phone number must be 7–15 digits, optionally starting with +."
      );
    }
    const normalised = next.length === 0 ? null : next;
    if (normalised !== (before.phoneNumber ?? null)) {
      // Uniqueness check: only fire when actually setting a non-null
      // number. Clearing the phone is always allowed.
      if (normalised !== null) {
        const dupSnap = await adminDb
          .collection(COLLECTIONS.users)
          .where("phoneNumber", "==", normalised)
          .limit(2)
          .get();
        const taken = dupSnap.docs.some((d) => d.id !== me.uid);
        if (taken) {
          return {
            ok: false,
            error:
              "This phone number is already registered to another account.",
          };
        }
      }
      updates.phoneNumber = normalised;
      phoneChanged = true;
    }
  }

  // ── Email ────────────────────────────────────────────────────────────
  let emailChanged = false;
  if (input.email !== undefined) {
    const nextEmail = input.email.trim().toLowerCase();
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      throw new Error("Enter a valid email.");
    }
    if (nextEmail !== before.email.toLowerCase()) {
      // Update Firebase Auth first so a 409 (email-already-in-use)
      // surfaces before we touch Firestore.
      await adminAuth.updateUser(me.uid, {
        email: nextEmail,
        emailVerified: false,
      });
      updates.email = nextEmail;
      updates.emailVerified = false;
      emailChanged = true;
    }
  }

  if (Object.keys(updates).length > 1) {
    await userRef.update(updates);
  }

  revalidatePath("/freelancer/profile");
  revalidatePath("/client/profile");
  return { ok: true, emailChanged, phoneChanged };
}

export interface FanoutCounts {
  gigs: number;
  contracts: number;
  reviewsAsReviewer: number;
  reviewsAsReviewee: number;
  messages: number;
  fraudAlerts: number;
  kycSubmissions: number;
}

export interface UpdateProfileResult {
  ok: true;
  fanoutCounts: FanoutCounts;
}

/**
 * Denormalized name/avatar lives on Gig, Contract, Review, Message,
 * FraudAlert, and KycSubmission docs. On profile update we fan out the
 * changes so embedded snapshots don't go stale.
 *
 * Scales to ~1000 documents per user (each batched write tops at 500
 * operations; we re-batch above that). At larger scale, migrate to a
 * Cloud Function trigger on user doc writes that updates embedded
 * snapshots asynchronously.
 */
export async function updateUserProfile(
  input: ProfileUpdateInput
): Promise<UpdateProfileResult> {
  const parsed = profileUpdateSchema.parse(input);

  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error("Account record missing.");
  const before = userSnap.data() as User;

  const nameChanged =
    parsed.name !== undefined && parsed.name.trim() !== before.name;
  const avatarChanged =
    parsed.profileImage !== undefined &&
    (parsed.profileImage ?? null) !== (before.profileImage ?? null);
  const bioChanged =
    parsed.bio !== undefined && (parsed.bio ?? null) !== (before.bio ?? null);
  const tagsChanged =
    parsed.tags !== undefined;

  const profileUpdates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (nameChanged) profileUpdates.name = parsed.name!.trim();
  if (avatarChanged) profileUpdates.profileImage = parsed.profileImage ?? null;
  if (bioChanged) profileUpdates.bio = parsed.bio ?? null;
  if (tagsChanged) profileUpdates.tags = parsed.tags ?? [];

  await userRef.update(profileUpdates);

  const counts: FanoutCounts = {
    gigs: 0,
    contracts: 0,
    reviewsAsReviewer: 0,
    reviewsAsReviewee: 0,
    messages: 0,
    fraudAlerts: 0,
    kycSubmissions: 0,
  };

  if (nameChanged || avatarChanged) {
    const newName = nameChanged ? parsed.name!.trim() : before.name;
    const newAvatar = avatarChanged
      ? parsed.profileImage ?? null
      : before.profileImage ?? null;

    await Promise.all([
      fanoutCollection({
        collection: COLLECTIONS.gigs,
        where: "freelancerId",
        uid: me.uid,
        fields: {
          ...(nameChanged ? { freelancerName: newName } : {}),
          ...(avatarChanged ? { freelancerAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.gigs = n)),

      fanoutCollection({
        collection: COLLECTIONS.contracts,
        where: "clientId",
        uid: me.uid,
        fields: {
          ...(nameChanged ? { clientName: newName } : {}),
          ...(avatarChanged ? { clientAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.contracts += n)),

      fanoutCollection({
        collection: COLLECTIONS.contracts,
        where: "freelancerId",
        uid: me.uid,
        fields: {
          ...(nameChanged ? { freelancerName: newName } : {}),
          ...(avatarChanged ? { freelancerAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.contracts += n)),

      fanoutCollection({
        collection: COLLECTIONS.reviews,
        where: "reviewerId",
        uid: me.uid,
        fields: {
          ...(nameChanged ? { reviewerName: newName } : {}),
          ...(avatarChanged ? { reviewerAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.reviewsAsReviewer = n)),

      fanoutCollection({
        collection: COLLECTIONS.reviews,
        where: "revieweeId",
        uid: me.uid,
        fields: {
          ...(nameChanged ? { revieweeName: newName } : {}),
          ...(avatarChanged ? { revieweeAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.reviewsAsReviewee = n)),

      fanoutMessages({
        uid: me.uid,
        fields: {
          ...(nameChanged ? { senderName: newName } : {}),
          ...(avatarChanged ? { senderAvatar: newAvatar } : {}),
        },
      }).then((n) => (counts.messages = n)),

      fanoutCollection({
        collection: COLLECTIONS.fraudAlerts,
        where: "userId",
        uid: me.uid,
        fields: nameChanged ? { userName: newName } : {},
      }).then((n) => (counts.fraudAlerts = n)),

      fanoutCollection({
        collection: COLLECTIONS.kycSubmissions,
        where: "userId",
        uid: me.uid,
        fields: nameChanged ? { userName: newName } : {},
      }).then((n) => (counts.kycSubmissions = n)),
    ]);
  }

  revalidatePath("/freelancer/profile");
  revalidatePath("/client/profile");
  return { ok: true, fanoutCounts: counts };
}

const BATCH_LIMIT = 400; // Firestore caps at 500; leave headroom.

async function fanoutCollection(args: {
  collection: string;
  where: string;
  uid: string;
  fields: Record<string, unknown>;
}): Promise<number> {
  if (Object.keys(args.fields).length === 0) return 0;
  const snap = await adminDb
    .collection(args.collection)
    .where(args.where, "==", args.uid)
    .get();
  return commitBatched(snap.docs, args.fields);
}

async function fanoutMessages(args: {
  uid: string;
  fields: Record<string, unknown>;
}): Promise<number> {
  if (Object.keys(args.fields).length === 0) return 0;
  const snap = await adminDb
    .collectionGroup("messages")
    .where("senderId", "==", args.uid)
    .get();
  return commitBatched(snap.docs, args.fields);
}

async function commitBatched(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  fields: Record<string, unknown>
): Promise<number> {
  let written = 0;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const slice = docs.slice(i, i + BATCH_LIMIT);
    const batch = adminDb.batch();
    for (const doc of slice) {
      batch.update(doc.ref, fields as FirebaseFirestore.UpdateData<Record<string, unknown>>);
    }
    await batch.commit();
    written += slice.length;
  }
  return written;
}

export interface ConnectStripeAccountInput {
  accountName: string;
  accountEmail: string;
  accountId: string;
  accountType: "individual" | "company";
  country: string;
  bankRoutingNumber?: string | null;
  bankAccountNumber?: string | null;
}

export async function connectStripeAccountAction(
  input: ConnectStripeAccountInput
): Promise<{ success: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const name = input.accountName.trim();
  const email = input.accountEmail.trim().toLowerCase();
  const accountId = input.accountId.trim();

  if (!name || name.length < 3) {
    throw new Error("Please enter a valid Account Holder Full Name (at least 3 characters).");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid Stripe registered email address.");
  }
  if (!accountId || accountId.length < 6) {
    throw new Error("Please enter a valid Stripe Account ID (e.g. acct_1N234567890ABC).");
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  await userRef.update({
    stripeAccountId: accountId,
    stripeAccountEmail: email,
    stripeAccountName: name,
    stripeAccountType: input.accountType,
    stripeCountry: input.country || "United States",
    stripeConnected: true,
    paymentMethodConnected: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/client/profile");
  revalidatePath("/freelancer/profile");
  revalidatePath("/client/payments");
  revalidatePath("/freelancer/payments");
  return { success: true };
}
