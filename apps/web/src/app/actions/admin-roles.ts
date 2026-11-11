"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type AdminAuditAction,
  type AdminRole,
  type User,
} from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";

async function writeAuditEntry(args: {
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  action: AdminAuditAction;
}): Promise<void> {
  const ref = adminDb.collection(COLLECTIONS.adminAuditLog).doc();
  await ref.set({
    id: ref.id,
    actorId: args.actorId,
    actorName: args.actorName,
    targetId: args.targetId,
    targetName: args.targetName,
    action: args.action,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Creates a brand new Admin user in Auth and Firestore.
 * Requires Super Admin privileges.
 */
export async function createAdminUser(args: {
  name: string;
  email: string;
  password: string;
  adminRole: AdminRole;
}): Promise<{ ok: true; uid: string }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (!isSuperAdmin(me)) {
    throw new Error("Super Admin access required to create new admins.");
  }

  const { name, email, password, adminRole } = args;

  if (!email || !password || !name) {
    throw new Error("Name, email, and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  let uid: string;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    uid = userRecord.uid;
  } catch (err: any) {
    if (err?.code === "auth/email-already-exists") {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
      await adminAuth.updateUser(uid, { displayName: name, password });
    } else {
      throw new Error(err?.message || "Failed to create admin user.");
    }
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(uid);
  await userRef.set(
    {
      uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: "admin",
      adminRole: adminRole || "support_admin",
      walletAddress: null,
      kycStatus: "approved",
      fraudScore: 0,
      profileImage: null,
      bio: `Platform ${adminRole === "super_admin" ? "Super Admin" : "Support Admin"}`,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await writeAuditEntry({
    actorId: me.uid,
    actorName: me.name,
    targetId: uid,
    targetName: name,
    action: "promote_admin",
  });

  return { ok: true, uid };
}

/**
 * Promotes an arbitrary user to admin. Stores the prior role in
 * `previousRole` so a later demotion can revert cleanly.
 */
export async function promoteUserToAdmin(
  targetUserId: string,
  adminRole: AdminRole = "support_admin"
): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (!isSuperAdmin(me)) {
    throw new Error("Super Admin access required to promote users to admin.");
  }

  const targetRef = adminDb.collection(COLLECTIONS.users).doc(targetUserId);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new Error("User not found.");
  const target = targetSnap.data() as User;

  if (target.role === "admin") {
    // If already admin, update their subRole
    await targetRef.update({
      adminRole,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  }

  const priorRole =
    target.role === "freelancer" || target.role === "client"
      ? target.role
      : null;

  await targetRef.update({
    role: "admin",
    adminRole,
    previousRole: priorRole,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditEntry({
    actorId: me.uid,
    actorName: me.name,
    targetId: targetUserId,
    targetName: target.name,
    action: "promote_admin",
  });

  return { ok: true };
}

/**
 * Demotes an admin back to their `previousRole`.
 */
export async function demoteAdmin(
  targetUserId: string
): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (!isSuperAdmin(me)) {
    throw new Error("Super Admin access required to demote admins.");
  }

  if (me.uid === targetUserId) {
    throw new Error(
      "You cannot demote yourself. Promote another admin first."
    );
  }

  const targetRef = adminDb.collection(COLLECTIONS.users).doc(targetUserId);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new Error("User not found.");
  const target = targetSnap.data() as User;

  if (target.role !== "admin") {
    throw new Error("User is not an admin.");
  }

  const adminCountSnap = await adminDb
    .collection(COLLECTIONS.users)
    .where("role", "==", "admin")
    .count()
    .get();
  if (adminCountSnap.data().count <= 1) {
    throw new Error(
      "Cannot demote the last admin. Promote another user first."
    );
  }

  const revertTo =
    target.previousRole === "freelancer" || target.previousRole === "client"
      ? target.previousRole
      : "client";

  await targetRef.update({
    role: revertTo,
    adminRole: FieldValue.delete(),
    previousRole: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAuditEntry({
    actorId: me.uid,
    actorName: me.name,
    targetId: targetUserId,
    targetName: target.name,
    action: "demote_admin",
  });

  return { ok: true };
}
