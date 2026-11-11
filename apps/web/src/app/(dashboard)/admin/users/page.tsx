"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  CheckCircle,
  Download,
  Loader2,
  ShieldBan,
  ShieldCheck,
  ShieldOff,
  UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";

import {
  getUserProfileStats,
  setUserBanState,
  type UserProfileStats,
} from "@/app/actions/admin-users";
import {
  createAdminUser,
  demoteAdmin,
  promoteUserToAdmin,
} from "@/app/actions/admin-roles";
import { runFraudCheckForUser } from "@/app/actions/fraud";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isSuperAdmin, isSupportAdmin, getAdminRoleLabel } from "@/lib/admin-permissions";
import { UserPlus, ShieldAlert } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/client";
import {
  BUCKET_COLOR,
  bucketFromScore,
} from "@/lib/ai/fraud";
import {
  COLLECTIONS,
  type KycStatus,
  type SerializedUser,
  type User,
  type UserRole,
} from "@/lib/firebase/schema";
import { serializeUser } from "@/lib/firebase/serialize";
import { formatDateShort, formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const ALL = "__all__" as const;

type SortKey = "newest" | "oldest" | "fraudDesc" | "ratingDesc";

const KYC_CHIP: Record<KycStatus, string> = {
  pending:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  submitted:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  rejected:
    "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const ROLE_CHIP: Record<UserRole, string> = {
  freelancer:
    "bg-[color:var(--azure-500)]/15 text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] border-[color:var(--azure-500)]/30",
  client:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  admin: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  banned: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = React.useState<SerializedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<UserRole | typeof ALL>(
    ALL
  );
  const [kycFilter, setKycFilter] = React.useState<KycStatus | typeof ALL>(ALL);
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [page, setPage] = React.useState(0);
  const [busyUid, setBusyUid] = React.useState<string | null>(null);
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);

  // Live subscription to all users (capped at 500 for the table).
  React.useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, COLLECTIONS.users),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: SerializedUser[] = [];
        snap.forEach((d) => {
          // Force uid to the Firestore doc ID. The doc's `uid` field
          // should already match, but some legacy/seeded rows have a
          // stale or missing value — the doc ID is the only path that's
          // guaranteed to look up the same user server-side.
          const data = d.data() as User;
          rows.push(serializeUser({ ...data, uid: d.id }));
        });
        setAllUsers(rows.slice(0, 500));
        setLoading(false);
      },
      () => {
        setAllUsers([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Debounce search input by 300ms.
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 0 when any filter changes.
  React.useEffect(() => {
    setPage(0);
  }, [search, roleFilter, kycFilter, sortKey]);

  const filtered = React.useMemo(() => {
    const needle = search.toLowerCase();
    let rows = allUsers;
    if (roleFilter !== ALL) {
      rows = rows.filter((u) => u.role === roleFilter);
    }
    if (kycFilter !== ALL) {
      rows = rows.filter((u) => u.kycStatus === kycFilter);
    }
    if (needle) {
      rows = rows.filter(
        (u) =>
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "fraudDesc":
          return (b.fraudScore ?? 0) - (a.fraudScore ?? 0);
        case "ratingDesc":
          return (b.rating ?? 0) - (a.rating ?? 0);
      }
    });
    return sorted;
  }, [allUsers, search, roleFilter, kycFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function runCheck(uid: string) {
    setBusyUid(uid);
    try {
      const score = await runFraudCheckForUser(uid);
      toast.success(
        `Score: ${score.totalScore} · ${score.detectedPatterns.length} signals`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed.";
      toast.error(msg);
    } finally {
      setBusyUid(null);
    }
  }

  const { user: currentUser } = useCurrentUser();
  const isSuper = isSuperAdmin(currentUser);

  const [createAdminOpen, setCreateAdminOpen] = React.useState(false);
  const [newAdminName, setNewAdminName] = React.useState("");
  const [newAdminEmail, setNewAdminEmail] = React.useState("");
  const [newAdminPassword, setNewAdminPassword] = React.useState("");
  const [newAdminRole, setNewAdminRole] = React.useState<"super_admin" | "support_admin">("support_admin");
  const [creatingAdmin, setCreatingAdmin] = React.useState(false);

  async function handleCreateAdmin() {
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setCreatingAdmin(true);
    try {
      await createAdminUser({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        adminRole: newAdminRole,
      });
      toast.success(`Created ${newAdminRole === "super_admin" ? "Super Admin" : "Support Admin"}: ${newAdminEmail}`);
      setCreateAdminOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create admin.";
      toast.error(msg);
    } finally {
      setCreatingAdmin(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <ShieldCheck className="size-7 text-[color:var(--azure-500)]" />
            Users & Admins
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {allUsers.length} total · {filtered.length} matching filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (filtered.length === 0) {
                toast.error("No users to export.");
                return;
              }
              const headers = ["User ID", "Name", "Email", "Role", "KYC Status", "Fraud Score", "Joined Date"];
              const rows = filtered.map((u) => [
                u.uid,
                u.name,
                u.email,
                u.role,
                u.kycStatus,
                u.fraudScore ?? 0,
                new Date(u.createdAt).toISOString(),
              ]);
              const csv = buildCsvString(headers, rows);
              downloadCsv(`chainwork-users-${Date.now()}.csv`, csv);
              toast.success("Users report exported to CSV.");
            }}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          {isSuper && (
            <Button
              type="button"
              onClick={() => setCreateAdminOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              <UserPlus className="size-4" />
              Add New Admin
            </Button>
          )}
        </div>
      </div>

      <GlassCard className="flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Search name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-[14rem] flex-1"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
        >
          <SelectTrigger className="min-w-[10rem]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={kycFilter}
          onValueChange={(v) => setKycFilter(v as typeof kycFilter)}
        >
          <SelectTrigger className="min-w-[10rem]">
            <SelectValue placeholder="KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortKey}
          onValueChange={(v) => setSortKey(v as SortKey)}
        >
          <SelectTrigger className="min-w-[12rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="fraudDesc">Highest fraud score</SelectItem>
            <SelectItem value="ratingDesc">Highest rating</SelectItem>
          </SelectContent>
        </Select>
      </GlassCard>

      {loading ? (
        <Skeleton className="h-96" />
      ) : pageRows.length === 0 ? (
        <GlassCard className="p-12 text-center text-sm text-foreground/60">
          No users match the current filters.
        </GlassCard>
      ) : (
        <>
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Fraud score</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((u) => {
                  const score = u.fraudScore ?? 0;
                  const color = BUCKET_COLOR[bucketFromScore(score)];
                  return (
                    <TableRow key={u.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            {u.profileImage ? (
                              <AvatarImage src={u.profileImage} alt={u.name} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-[10px] text-white">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium leading-tight">
                              {u.name}
                            </div>
                            <div className="font-mono text-[11px] text-foreground/60 leading-tight">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize backdrop-blur-xl",
                            u.role === "admin"
                              ? isSuperAdmin(u)
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold"
                                : "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-semibold"
                              : ROLE_CHIP[u.role]
                          )}
                        >
                          {u.role === "admin" ? getAdminRoleLabel(u) : u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize backdrop-blur-xl",
                            KYC_CHIP[u.kycStatus]
                          )}
                        >
                          {u.kycStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border"
                          style={{
                            backgroundColor: `${color}26`,
                            color,
                            borderColor: `${color}66`,
                          }}
                        >
                          {score}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/60">
                        {formatDateShort(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void runCheck(u.uid)}
                            disabled={busyUid === u.uid}
                          >
                            {busyUid === u.uid ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : null}
                            Run check
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUid(u.uid)}
                          >
                            View profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCard>

          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}

      <Dialog
        open={!!selectedUid}
        onOpenChange={(open) => {
          if (!open) setSelectedUid(null);
        }}
      >
        <DialogContent className="max-w-2xl sm:max-w-2xl">
          {selectedUid ? (
            <UserProfileSlideOver
              userId={selectedUid}
              onClose={() => setSelectedUid(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <UserPlus className="size-5" />
            Create New Admin Account
          </DialogTitle>

          <DialogDescription className="text-xs">
            Add a new platform admin with custom role permissions. Super Admins have full access, while Support Admins handle customer support, disputes, and transactions.
          </DialogDescription>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/80">Full Name</label>
              <Input
                placeholder="e.g. Support Admin"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                disabled={creatingAdmin}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/80">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. support@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                disabled={creatingAdmin}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/80">Password</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                disabled={creatingAdmin}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/80">Admin Privilege Level</label>
              <Select
                value={newAdminRole}
                onValueChange={(v) => setNewAdminRole(v as "super_admin" | "support_admin")}
                disabled={creatingAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_admin">
                    Support Admin (Disputes, Users, KYC & Payments)
                  </SelectItem>
                  <SelectItem value="super_admin">
                    Super Admin (Full access + Add/Manage Admins)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateAdminOpen(false)}
              disabled={creatingAdmin}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateAdmin}
              disabled={creatingAdmin}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {creatingAdmin ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Creating Admin…
                </>
              ) : (
                "Create Admin Account"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserProfileSlideOver({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { user: me } = useCurrentUser();
  const [stats, setStats] = React.useState<UserProfileStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [roleBusy, setRoleBusy] = React.useState(false);
  const [roleConfirm, setRoleConfirm] = React.useState<
    "promote" | "demote" | null
  >(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await getUserProfileStats(userId);
      setStats(s);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handlePromote() {
    setRoleConfirm(null);
    setRoleBusy(true);
    try {
      await promoteUserToAdmin(userId);
      toast.success("Promoted to admin.");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Promotion failed.";
      toast.error(msg);
    } finally {
      setRoleBusy(false);
    }
  }

  async function handleDemote() {
    setRoleConfirm(null);
    setRoleBusy(true);
    try {
      await demoteAdmin(userId);
      toast.success("Demoted from admin.");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Demotion failed.";
      toast.error(msg);
    } finally {
      setRoleBusy(false);
    }
  }

  async function toggleBan() {
    if (!stats) return;
    const banned = stats.user.role !== "banned";
    setBusy(true);
    try {
      await setUserBanState({
        userId,
        banned,
        restoreRole: banned ? undefined : "freelancer",
      });
      toast.success(banned ? "User restricted." : "User unrestricted.");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <DialogTitle>Loading…</DialogTitle>
        <Skeleton className="h-72" />
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <DialogTitle>Not found</DialogTitle>
        <p className="text-sm text-foreground/60">
          Could not load user profile.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </>
    );
  }

  const u = stats.user;
  const isBanned = u.role === "banned";

  return (
    <>
      <DialogTitle className="flex items-center gap-2">
        <Avatar className="size-9">
          {u.profileImage ? (
            <AvatarImage src={u.profileImage} alt={u.name} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-xs text-white">
            {initials(u.name)}
          </AvatarFallback>
        </Avatar>
        <span>{u.name}</span>
      </DialogTitle>
      <DialogDescription className="font-mono text-xs">
        {u.email} · joined {formatDateShort(u.createdAt)}
      </DialogDescription>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Profile
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-foreground/60">Role</dt>
            <dd>{u.role}</dd>
            <dt className="text-foreground/60">KYC</dt>
            <dd className="capitalize">{u.kycStatus}</dd>
            <dt className="text-foreground/60">Fraud score</dt>
            <dd>{u.fraudScore ?? 0}</dd>
            {u.bio ? (
              <>
                <dt className="text-foreground/60">Bio</dt>
                <dd>{u.bio}</dd>
              </>
            ) : null}
            {u.skills && u.skills.length > 0 ? (
              <>
                <dt className="text-foreground/60">Skills</dt>
                <dd>{u.skills.join(", ")}</dd>
              </>
            ) : null}
            {u.companyName ? (
              <>
                <dt className="text-foreground/60">Company</dt>
                <dd>{u.companyName}</dd>
              </>
            ) : null}
            {u.walletAddress ? (
              <>
                <dt className="text-foreground/60">Wallet</dt>
                <dd className="font-mono text-[10px]">{u.walletAddress}</dd>
              </>
            ) : null}
            <dt className="text-foreground/60">Stripe Payment</dt>
            <dd>
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border",
                u.stripeConnected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              )}>
                {u.stripeConnected ? "Connected & Verified" : "Not Setup"}
              </span>
            </dd>
            {u.stripeAccountId && (
              <>
                <dt className="text-foreground/60">Stripe Account ID</dt>
                <dd className="font-mono font-bold text-[10px]">{u.stripeAccountId}</dd>
              </>
            )}
            {u.stripeAccountEmail && (
              <>
                <dt className="text-foreground/60">Stripe Email</dt>
                <dd className="font-mono text-[10px]">{u.stripeAccountEmail}</dd>
              </>
            )}
            {u.stripeAccountName && (
              <>
                <dt className="text-foreground/60">Stripe Holder Name</dt>
                <dd className="font-bold text-xs">{u.stripeAccountName}</dd>
              </>
            )}
          </dl>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Stats
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label="Gigs" value={stats.gigCount.toString()} />
            <StatTile
              label="Contracts (client)"
              value={stats.contractsAsClient.toString()}
            />
            <StatTile
              label="Contracts (freelancer)"
              value={stats.contractsAsFreelancer.toString()}
            />
            <StatTile
              label="Reviews"
              value={stats.reviewsReceived.toString()}
            />
            <StatTile
              label="Avg rating"
              value={
                stats.reviewsReceived === 0
                  ? "—"
                  : stats.avgRating.toFixed(2)
              }
            />
            <StatTile
              label="Completion"
              value={
                stats.contractsAsFreelancer === 0
                  ? "—"
                  : `${Math.round(stats.completionRate * 100)}%`
              }
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Recent activity
          </h3>
          {stats.recentActivity.length === 0 ? (
            <p className="mt-2 text-xs text-foreground/60">
              No activity yet.
            </p>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {stats.recentActivity.map((ev) => (
                <li
                  key={`${ev.type}-${ev.id}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{ev.label}</span>
                  <span className="text-foreground/50">
                    {formatRelativeTime(ev.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-3 border-t border-[var(--glass-border)] pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Role management
          </h3>
          <RoleManagement
            currentUserId={me?.uid ?? ""}
            targetUid={u.uid}
            targetRole={u.role}
            targetName={u.name}
            busy={roleBusy}
            onPromoteClick={() => setRoleConfirm("promote")}
            onDemoteClick={() => setRoleConfirm("demote")}
          />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-border)] pt-3">
          {isBanned ? (
            <Button
              type="button"
              onClick={() => void toggleBan()}
              disabled={busy}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              Unrestrict
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
              onClick={() => void toggleBan()}
              disabled={busy || u.role === "admin"}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldBan className="size-4" />
              )}
              Restrict account
            </Button>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-foreground/50">
            <UserRoundCog className="size-3" />
            Restrict flips role to &ldquo;banned&rdquo; — demote admins
            first if needed.
          </span>
        </section>
      </div>

      <Dialog
        open={roleConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setRoleConfirm(null);
        }}
      >
        <DialogContent>
          {roleConfirm === "promote" ? (
            <>
              <DialogTitle>Promote {u.name} to admin?</DialogTitle>
              <DialogDescription>
                This grants them full platform access — KYC review,
                fraud dashboard, dispute resolution, and the ability to
                promote or restrict other users. Continue?
              </DialogDescription>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handlePromote()}
                  className="bg-[var(--azure-500)] text-white hover:bg-[var(--azure-600)]"
                >
                  Promote
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle>Demote {u.name} from admin?</DialogTitle>
              <DialogDescription>
                They will return to their previous role (
                {u.previousRole ?? "client"}
                ). Audit log will record the action.
              </DialogDescription>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => void handleDemote()}
                >
                  Demote
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleManagement({
  currentUserId,
  targetUid,
  targetRole,
  targetName: _targetName,
  busy,
  onPromoteClick,
  onDemoteClick,
}: {
  currentUserId: string;
  targetUid: string;
  targetRole: UserRole;
  targetName: string;
  busy: boolean;
  onPromoteClick: () => void;
  onDemoteClick: () => void;
}) {
  // Suppress unused-prop lint without changing the function signature
  // (callers pass it for symmetry with future logging).
  void _targetName;
  const isSelf = currentUserId && currentUserId === targetUid;

  if (isSelf && targetRole === "admin") {
    return (
      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
        This is your account. Promote another user to admin first before
        demoting yourself.
      </p>
    );
  }

  if (targetRole === "admin") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
          onClick={onDemoteClick}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldOff className="size-4" />
          )}
          Demote from admin
        </Button>
        <span className="text-[10px] text-foreground/50">
          Reverts to previous role.
        </span>
      </div>
    );
  }

  if (targetRole === "banned") {
    return (
      <p className="text-xs text-foreground/60">
        Unrestrict the account first if you need to promote this user.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        className="border-[var(--azure-500)]/50 text-[var(--azure-700)] hover:bg-[var(--azure-500)]/10 dark:text-[var(--azure-300)]"
        onClick={onPromoteClick}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        Promote to admin
      </Button>
      <span className="text-[10px] text-foreground/50">
        Grants full platform access.
      </span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-foreground/60">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

