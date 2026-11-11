"use client";

import * as React from "react";
import Link from "next/link";
import {
  ActivitySquare,
  AlertOctagon,
  ArrowRight,
  BarChart3,
  Download,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  generatePlatformReport,
  type PlatformReport,
  type ReportRange,
} from "@/app/actions/reports";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContractStatus, UserRole } from "@/lib/firebase/schema";

const RANGES: { value: ReportRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: "Draft",
  active: "Active",
  delivered: "Delivered",
  disputed: "Disputed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  draft: "#64748b",
  active: "#0ea5e9",
  delivered: "#f59e0b",
  disputed: "#ef4444",
  completed: "#10b981",
  cancelled: "#94a3b8",
};

const ROLE_LABEL: Record<UserRole, string> = {
  freelancer: "Freelancers",
  client: "Clients",
  admin: "Admins",
  banned: "Banned",
};

const ROLE_COLOR: Record<UserRole, string> = {
  freelancer: "#0ea5e9",
  client: "#8b5cf6",
  admin: "#f59e0b",
  banned: "#ef4444",
};

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function AdminReportsPage() {
  const [range, setRange] = React.useState<ReportRange>("30d");
  const [report, setReport] = React.useState<PlatformReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (r: ReportRange) => {
    setLoading(true);
    try {
      const result = await generatePlatformReport({ range: r });
      setReport(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load report.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(range);
  }, [range, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <BarChart3 className="size-7 text-[color:var(--azure-500)]" />
            Platform Analytics
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Aggregated metrics across users, gigs, contracts, and volume.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={range}
            onValueChange={(v) => setRange(v as ReportRange)}
          >
            <SelectTrigger className="min-w-[10rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || !report}
            onClick={() => {
              if (!report) return;
              const headers = ["Metric / Section", "Subcategory", "Value", "Notes / Detail"];
              const rows: (string | number)[][] = [
                ["Platform Summary", "Range", range, "Selected reporting period"],
                ["Platform Summary", "Total Volume", report.totalVolume, "Lifetime volume"],
                ["Platform Summary", "Volume in Range", report.volumeInRange, "Volume within range"],
                ["Platform Summary", "Total Users", report.totalUsers, "All registered users"],
                ["Platform Summary", "New Users in Range", report.newUsersInRange, "Users joined in range"],
                ["Platform Summary", "Total Contracts", report.totalContracts, "All contracts"],
                ["Platform Summary", "Contracts in Range", report.contractsInRange, "Contracts in range"],
                ["Platform Summary", "Avg Contract Value", report.avgContractValue, "Average USD"],
                ["Platform Summary", "Active Disputes", report.activeDisputes, "Currently disputed"],
                ["Platform Summary", "Pending KYC", report.kycPending, "Awaiting review"],
                ["Platform Summary", "High Risk Users", report.highRiskUsers, "Fraud score >= 70"],
              ];
              Object.entries(report.contractsByStatus).forEach(([status, count]) => {
                rows.push(["Contract Status Breakdown", status, count, "Number of contracts"]);
              });
              Object.entries(report.usersByRole).forEach(([role, count]) => {
                rows.push(["User Role Breakdown", role, count, "Number of users"]);
              });
              report.topFreelancers.forEach((f) => {
                rows.push(["Top Freelancers", f.name, f.earnings, `${f.contracts} contract(s)`]);
              });
              report.topCategories.forEach((c) => {
                rows.push(["Top Categories", c.category, c.count, "Published gigs"]);
              });
              const csv = buildCsvString(headers, rows);
              downloadCsv(`chainwork-platform-report-${range}-${Date.now()}.csv`, csv);
              toast.success("Platform report exported to CSV.");
            }}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading || !report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <ReportBody report={report} />
      )}
    </div>
  );
}

function ReportBody({ report }: { report: PlatformReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat
          label="Total volume"
          big={formatUsd(report.totalVolume)}
          small={`${formatUsd(report.volumeInRange)} in range`}
        />
        <HeroStat
          label="Total users"
          big={report.totalUsers.toLocaleString()}
          small={`+${report.newUsersInRange} in range`}
        />
        <HeroStat
          label="Total contracts"
          big={report.totalContracts.toLocaleString()}
          small={`+${report.contractsInRange} in range · avg ${formatUsd(report.avgContractValue)}`}
        />
        <HeroStat
          label="Active disputes"
          big={report.activeDisputes.toLocaleString()}
          small={
            report.activeDisputes === 0
              ? "Quiet on the dispute front"
              : "Open for resolution"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Contracts by status
          </h2>
          <StatusBars data={report.contractsByStatus} total={report.totalContracts} />
        </GlassCard>
        <GlassCard className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Users by role
          </h2>
          <RoleBars data={report.usersByRole} total={report.totalUsers} />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="space-y-3 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Top freelancers
          </h2>
          {report.topFreelancers.length === 0 ? (
            <p className="text-xs text-foreground/60">
              No completed milestone payments yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {report.topFreelancers.map((f) => (
                <li
                  key={f.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      {f.avatar ? (
                        <AvatarImage src={f.avatar} alt={f.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-[10px] text-white">
                        {initials(f.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium leading-tight">
                        {f.name}
                      </div>
                      <div className="text-[10px] text-foreground/50 leading-tight">
                        {f.contracts} contract{f.contracts === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    <GradientText>{formatUsd(f.earnings)}</GradientText>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="space-y-3 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Top categories
          </h2>
          {report.topCategories.length === 0 ? (
            <p className="text-xs text-foreground/60">No gigs published yet.</p>
          ) : (
            <ul className="space-y-2">
              {report.topCategories.map((c) => {
                const max = report.topCategories[0]?.count ?? 1;
                const pct = Math.max(2, Math.round((c.count / max) * 100));
                return (
                  <li key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{c.category}</span>
                      <span className="font-mono text-foreground/60">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--glass-bg)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--azure-500)] to-[var(--cyan-accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickActionCard
          icon={<Users className="size-5" />}
          label="KYC pending"
          value={report.kycPending}
          href="/admin/kyc"
        />
        <QuickActionCard
          icon={<AlertOctagon className="size-5" />}
          label="Active disputes"
          value={report.activeDisputes}
          href="/admin/disputes"
        />
        <QuickActionCard
          icon={<ShieldAlert className="size-5" />}
          label="High-risk users"
          value={report.highRiskUsers}
          href="/admin/fraud"
        />
      </div>
    </div>
  );
}

function HeroStat({
  label,
  big,
  small,
}: {
  label: string;
  big: string;
  small: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="text-xs uppercase tracking-wider text-foreground/60">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold">
        <GradientText>{big}</GradientText>
      </div>
      <div className="mt-1 text-xs text-foreground/60">{small}</div>
    </GlassCard>
  );
}

function StatusBars({
  data,
  total,
}: {
  data: Record<ContractStatus, number>;
  total: number;
}) {
  const entries = (Object.keys(data) as ContractStatus[])
    .map((status) => ({ status, count: data[status] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  if (total === 0) {
    return (
      <p className="text-xs text-foreground/60">No contracts yet.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {entries.map(({ status, count }) => {
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <li key={status} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2">
                <ActivitySquare
                  className="size-3"
                  style={{ color: STATUS_COLOR[status] }}
                />
                {STATUS_LABEL[status]}
              </span>
              <span className="font-mono text-foreground/60">
                {count} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--glass-bg)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, pct)}%`,
                  backgroundColor: STATUS_COLOR[status],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RoleBars({
  data,
  total,
}: {
  data: Record<UserRole, number>;
  total: number;
}) {
  const entries = (Object.keys(data) as UserRole[])
    .map((role) => ({ role, count: data[role] ?? 0 }))
    .filter((e) => e.count > 0 || total === 0);
  if (total === 0) {
    return <p className="text-xs text-foreground/60">No users yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map(({ role, count }) => {
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <li key={role} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: ROLE_COLOR[role] }}
                />
                {ROLE_LABEL[role]}
              </span>
              <span className="font-mono text-foreground/60">
                {count} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--glass-bg)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, pct)}%`,
                  backgroundColor: ROLE_COLOR[role],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function QuickActionCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <GlassCard className="flex items-center justify-between gap-3 p-5 transition-colors hover:bg-[color:var(--azure-500)]/5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[var(--azure-500)]">
            {icon}
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground/60">
              {label}
            </div>
            <div className="text-2xl font-semibold">
              <GradientText>{value.toLocaleString()}</GradientText>
            </div>
          </div>
        </div>
        <ArrowRight className="size-4 text-foreground/40" />
      </GlassCard>
    </Link>
  );
}
