"use client";

import * as React from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { COLLECTIONS, type User, type UserRole } from "@/lib/firebase/schema";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";
import { formatDateShort } from "@/lib/format-time";

import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

interface UserMetric {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  kycStatus: string;
  fraudScore: number;
  createdAt: number;
}

export default function UserAnalyticsPage() {
  const [users, setUsers] = React.useState<UserMetric[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, COLLECTIONS.users), orderBy("createdAt", "desc"), limit(200));
      const snap = await getDocs(q);
      const list: UserMetric[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as User;
        const createdAtMs = (data.createdAt as unknown as { _seconds?: number })?._seconds
          ? (data.createdAt as unknown as { _seconds: number })._seconds * 1000
          : typeof data.createdAt === "number"
          ? data.createdAt
          : Date.now();
        list.push({
          uid: doc.id,
          name: data.name || "Unnamed User",
          email: data.email || "N/A",
          role: data.role || "freelancer",
          kycStatus: data.kycStatus || "pending",
          fraudScore: data.fraudScore || 0,
          createdAt: createdAtMs,
        });
      });
      setUsers(list);
    } catch {
      toast.error("Failed to load user analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setPage(1);
  }, [roleFilter, search]);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = React.useMemo(
    () => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsers, page]
  );

  const stats = React.useMemo(() => {
    const total = users.length;
    const freelancers = users.filter((u) => u.role === "freelancer").length;
    const clients = users.filter((u) => u.role === "client").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const kycApproved = users.filter((u) => u.kycStatus === "approved").length;
    const highRisk = users.filter((u) => u.fraudScore >= 65).length;
    return { total, freelancers, clients, admins, kycApproved, highRisk };
  }, [users]);

  const exportCsv = () => {
    if (users.length === 0) {
      toast.error("No user data available to export.");
      return;
    }
    const headers = ["User ID", "Name", "Email", "Role", "KYC Status", "Fraud Score", "Joined Date"];
    const rows = filteredUsers.map((u) => [
      u.uid,
      u.name,
      u.email,
      u.role,
      u.kycStatus,
      u.fraudScore,
      new Date(u.createdAt).toISOString(),
    ]);
    const csv = buildCsvString(headers, rows);
    downloadCsv(`chainwork-user-analytics-${Date.now()}.csv`, csv);
    toast.success("User analytics exported to CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Users className="size-7 text-[color:var(--azure-500)]" />
            User Analytics & Activity
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            User retention, role distribution, KYC completion rates, and risk demographics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || users.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 border-sky-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Registered</span>
            <Users className="size-4 text-sky-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums">
              <GradientText>{stats.total}</GradientText>
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">Platform user base</div>
        </GlassCard>

        <GlassCard className="p-5 border-indigo-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Role Breakdown</span>
            <TrendingUp className="size-4 text-indigo-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="text-sm font-semibold mt-2 space-y-0.5">
              <div>Freelancers: <span className="text-indigo-400">{stats.freelancers}</span></div>
              <div>Clients: <span className="text-sky-400">{stats.clients}</span></div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">KYC Verified Rate</span>
            <UserCheck className="size-4 text-emerald-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.total > 0 ? Math.round((stats.kycApproved / stats.total) * 100) : 0}%
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">{stats.kycApproved} verified profiles</div>
        </GlassCard>

        <GlassCard className="p-5 border-rose-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">High Risk Flagged</span>
            <ShieldAlert className="size-4 text-rose-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums text-rose-600 dark:text-rose-400">
              {stats.highRisk}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">Score ≥ 65 fraud threshold</div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-foreground/50" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[11rem] text-xs">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Table */}
      {loading ? (
        <Skeleton className="h-80 w-full" />
      ) : filteredUsers.length === 0 ? (
        <GlassCard className="p-12 text-center text-sm text-foreground/60">
          No users found matching current filters.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-sky-500/20 text-sky-400 text-[10px]">
                            {u.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-semibold">{u.name}</div>
                          <div className="font-mono text-[10px] text-foreground/50">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs capitalize font-medium">{u.role}</TableCell>
                    <TableCell className="text-xs capitalize">{u.kycStatus}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{u.fraudScore}</TableCell>
                    <TableCell className="text-xs text-foreground/60">{formatDateShort(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}
