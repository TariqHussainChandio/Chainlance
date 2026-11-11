import type { SerializedUser, User } from "@/lib/firebase/schema";

/**
 * Returns true if user is a Super Admin.
 * Super Admins are either admin@gmail.com, have adminRole === "super_admin", or default legacy admin accounts.
 */
export function isSuperAdmin(user: User | SerializedUser | null | undefined): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.email === "admin@gmail.com") return true;
  if (user.adminRole === "super_admin") return true;
  if (!user.adminRole) return true;
  return false;
}

/**
 * Returns true if user is a Support Admin (limited permissions).
 */
export function isSupportAdmin(user: User | SerializedUser | null | undefined): boolean {
  if (!user || user.role !== "admin") return false;
  return user.adminRole === "support_admin";
}

/**
 * Human readable label for the admin user's role.
 */
export function getAdminRoleLabel(user: User | SerializedUser | null | undefined): string {
  if (!user || user.role !== "admin") return "";
  return isSuperAdmin(user) ? "Super Admin" : "Support Admin";
}
