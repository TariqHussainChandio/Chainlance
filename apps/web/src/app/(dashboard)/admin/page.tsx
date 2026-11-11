"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertOctagon,
  BadgeCheck,
  FileSearch,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "@/app/actions/admin-dashboard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAdminRoleLabel, isSuperAdmin } from "@/lib/admin-permissions";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, UserPlus } from "lucide-react";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function AdminHomePage() {
  const { user: me } = useCurrentUser();
  const isSuper = isSuperAdmin(me);
  const [stats, setStats] = React.useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboardStats()
      .then((s) => {
        if (cancelled) return;
        setStats(s);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Stats failed.";
        toast.error(msg);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Hero Welcome Banner */}
      <GlassCard variant="elevated" className="relative overflow-hidden p-5 sm:p-7 border-emerald-500/30">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-teal-400 p-0.5 shadow-md shrink-0 flex items-center justify-center text-white">
              <Shield className="size-6 sm:size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center">
                  <Shield className="size-3 mr-1" />
                  {getAdminRoleLabel(me)} Control
                </span>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                Welcome back, {me?.name || "Admin"}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground/70 truncate">
                {isSuper
                  ? "Full control over platform queues, user management, and super admin operations."
                  : "Operational access to active contract disputes, KYC submissions, and support."}
              </p>
            </div>
          </div>

          {isSuper && (
            <div className="shrink-0">
              <Link href="/admin/users">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs gap-2">
                  <UserPlus className="size-4" />
                  Add New Admin
                </Button>
              </Link>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Primary Operations Stat Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/60">
          Priority Action Queues
        </h2>
        <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
          <PrimaryStat
            icon={<BadgeCheck className="size-4" />}
            iconBg="bg-blue-500/15 text-blue-500"
            label="Pending KYC"
            value={stats?.pendingKyc}
            subtitle="Identities awaiting review"
            loading={loading}
            href="/admin/kyc"
          />
          <PrimaryStat
            icon={<AlertOctagon className="size-4" />}
            iconBg="bg-red-500/15 text-red-500"
            label="Open Fraud Alerts"
            value={stats?.openFraudAlerts}
            subtitle="Flagged user risks"
            loading={loading}
            href="/admin/fraud"
          />
          <PrimaryStat
            icon={<FileSearch className="size-4" />}
            iconBg="bg-purple-500/15 text-purple-500"
            label="Active Disputes"
            value={stats?.activeDisputes}
            subtitle="Contract arbitration"
            loading={loading}
            href="/admin/disputes"
          />
          <PrimaryStat
            icon={<Users className="size-4" />}
            iconBg="bg-emerald-500/15 text-emerald-500"
            label="Total Users"
            value={stats?.totalUsers}
            subtitle="Platform accounts"
            loading={loading}
            href="/admin/users"
          />
        </div>
      </div>

      {/* Quick Admin Operations Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/60">
          Operations Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ShortcutCard
            href="/admin/kyc"
            icon={BadgeCheck}
            iconColor="text-blue-500 bg-blue-500/10"
            title="KYC Review"
            badge="Queue"
          />
          <ShortcutCard
            href="/admin/fraud"
            icon={AlertOctagon}
            iconColor="text-red-500 bg-red-500/10"
            title="Fraud Alerts"
            badge="Risk"
          />
          <ShortcutCard
            href="/admin/disputes"
            icon={FileSearch}
            iconColor="text-purple-500 bg-purple-500/10"
            title="Disputes"
            badge="Cases"
          />
          <ShortcutCard
            href="/admin/users"
            icon={Users}
            iconColor="text-emerald-500 bg-emerald-500/10"
            title="Users"
            badge="Manage"
          />
          <ShortcutCard
            href="/admin/reports"
            icon={TrendingUp}
            iconColor="text-amber-500 bg-amber-500/10"
            title="Reports"
            badge="Metrics"
          />
          <ShortcutCard
            href="/admin/settings"
            icon={Shield}
            iconColor="text-indigo-500 bg-indigo-500/10"
            title="Settings"
            badge="System"
          />
        </div>
      </div>

      {/* Weekly Activity Performance Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/60">
          This Week&apos;s Velocity
        </h2>
        <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
          <SecondaryStat
            icon={<Wallet className="size-4" />}
            label="Total volume processed"
            value={
              stats && stats.totalVolume !== null
                ? formatUsd(stats.totalVolume)
                : "—"
            }
            loading={loading}
          />
          <SecondaryStat
            icon={<Users className="size-4" />}
            label="New users this week"
            value={
              stats && stats.newUsersThisWeek !== null
                ? `+${stats.newUsersThisWeek}`
                : "—"
            }
            loading={loading}
          />
          <SecondaryStat
            icon={<TrendingUp className="size-4" />}
            label="Gigs published this week"
            value={
              stats && stats.gigsPublishedThisWeek !== null
                ? `+${stats.gigsPublishedThisWeek}`
                : "—"
            }
            loading={loading}
          />
          <SecondaryStat
            icon={<FileSearch className="size-4" />}
            label="Contracts created this week"
            value={
              stats && stats.contractsThisWeek !== null
                ? `+${stats.contractsThisWeek}`
                : "—"
            }
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

function PrimaryStat({
  icon,
  iconBg,
  label,
  value,
  subtitle,
  loading,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | null | undefined;
  subtitle: string;
  loading: boolean;
  href: string;
}) {
  const display =
    value === null || value === undefined ? "—" : value.toLocaleString();
  return (
    <Link href={href} className="block group">
      <GlassCard className="p-4 sm:p-5 hover:border-emerald-500/30 transition-all duration-200">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-foreground/60 truncate">
            {label}
          </span>
          <div className={`inline-flex size-8 items-center justify-center rounded-xl ${iconBg} shrink-0 group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </div>

        {loading ? (
          <Skeleton className="mt-3 h-8 w-20" />
        ) : (
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            <GradientText>{display}</GradientText>
          </div>
        )}
        <p className="mt-1 text-[11px] font-semibold text-foreground/50 truncate">
          {subtitle}
        </p>
      </GlassCard>
    </Link>
  );
}

function SecondaryStat({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <GlassCard className="p-4 sm:p-5 space-y-2">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground/60">
        <span className="text-emerald-500">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight font-mono">{value}</div>
      )}
    </GlassCard>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  iconColor,
  title,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between p-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 group shadow-sm min-h-[96px]"
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex size-8 items-center justify-center rounded-xl ${iconColor} transition-transform group-hover:scale-110`}>
          <Icon className="size-4" />
        </div>
        <span className="text-[9px] uppercase font-extrabold text-foreground/40 bg-foreground/5 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      </div>
      <div className="mt-2 text-xs font-extrabold text-foreground group-hover:text-emerald-500 transition-colors truncate">
        {title}
      </div>
    </Link>
  );
}
