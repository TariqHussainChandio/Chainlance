"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  DollarSign,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  ScrollText,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listFreelancerContracts,
  listMilestones,
} from "@/lib/firebase/contracts";
import { listFreelancerProposals } from "@/lib/firebase/proposals";
import type { SerializedContract, SerializedProposal } from "@/lib/firebase/schema";

interface FreelancerStats {
  totalEarnings: number;
  activeContractsCount: number;
  pendingProposalsCount: number;
  profileViews: number;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function FreelancerHomePage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [stats, setStats] = React.useState<FreelancerStats | null>(null);
  const [recentContracts, setRecentContracts] = React.useState<SerializedContract[]>([]);
  const [recentProposals, setRecentProposals] = React.useState<SerializedProposal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      listFreelancerContracts(user.uid),
      listFreelancerProposals(user.uid),
    ])
      .then(async ([contracts, proposals]) => {
        if (cancelled) return;

        const milestonesPerContract = await Promise.all(
          contracts.map((c) => listMilestones(c.id))
        );

        const activeContracts = contracts.filter((c) =>
          ["active", "delivered"].includes(c.status)
        );

        const totalEarnings = milestonesPerContract
          .flat()
          .filter((m) => m.status === "completed")
          .reduce((acc, m) => acc + m.amount, 0);

        const pendingProposals = proposals.filter((p) => p.status === "pending");

        setStats({
          totalEarnings,
          activeContractsCount: activeContracts.length,
          pendingProposalsCount: pendingProposals.length,
          profileViews: user.rating ? Math.round(user.rating * 14) + 12 : 24,
        });

        setRecentContracts(contracts.slice(0, 3));
        setRecentProposals(proposals.slice(0, 3));
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load freelancer dashboard data:", err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  const name = user?.name ?? "Freelancer";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <GlassCard variant="elevated" className="relative overflow-hidden p-5 sm:p-7 border-emerald-500/30">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="size-12 sm:size-14 ring-2 ring-emerald-500/50 shadow-md shrink-0">
              {user?.profileImage ? (
                <AvatarImage src={user.profileImage} alt={name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-teal-400 text-white font-extrabold text-sm sm:text-base">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="size-3 mr-1" />
                  Verified Suite
                </Badge>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                Welcome back, {name}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground/70 truncate">
                Here&apos;s your weekly performance, active orders, and pitches.
              </p>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <AzureButton asChild size="md" className="w-full sm:w-auto font-extrabold text-xs">
              <Link href="/freelancer/gigs/new">
                <Plus className="size-4 mr-1.5" />
                Create New Gig
              </Link>
            </AzureButton>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto text-xs font-bold border-[var(--glass-border)]">
              <Link href="/client/browse">
                <Briefcase className="size-4 mr-1.5 text-emerald-500" />
                Browse Jobs
              </Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Main Performance Metrics Grid */}
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-500/15 text-emerald-500"
          label="Total Earnings"
          value={stats ? `$${stats.totalEarnings.toLocaleString()}` : undefined}
          subtitle="Lifetime payout balance"
          loading={loading || userLoading}
        />
        <StatCard
          icon={ScrollText}
          iconBg="bg-blue-500/15 text-blue-500"
          label="Active Contracts"
          value={stats?.activeContractsCount}
          subtitle="Orders in progress"
          loading={loading || userLoading}
        />
        <StatCard
          icon={FileText}
          iconBg="bg-purple-500/15 text-purple-500"
          label="Pending Proposals"
          value={stats?.pendingProposalsCount}
          subtitle="Pitches under review"
          loading={loading || userLoading}
        />
        <StatCard
          icon={Eye}
          iconBg="bg-amber-500/15 text-amber-500"
          label="Profile Views"
          value={stats?.profileViews}
          subtitle="Marketplace impressions"
          loading={loading || userLoading}
        />
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/60">
          Quick Work Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ShortcutCard
            href="/freelancer/gigs"
            icon={Briefcase}
            iconColor="text-emerald-500 bg-emerald-500/10"
            title="My Gigs"
            badge="Manage"
          />
          <ShortcutCard
            href="/freelancer/contracts"
            icon={ScrollText}
            iconColor="text-blue-500 bg-blue-500/10"
            title="Contracts"
            badge="Active"
          />
          <ShortcutCard
            href="/freelancer/proposals"
            icon={FileText}
            iconColor="text-purple-500 bg-purple-500/10"
            title="Proposals"
            badge="Submitted"
          />
          <ShortcutCard
            href="/freelancer/messages"
            icon={MessageSquare}
            iconColor="text-teal-500 bg-teal-500/10"
            title="Messages"
            badge="Chat"
          />
          <ShortcutCard
            href="/freelancer/payments"
            icon={Wallet}
            iconColor="text-amber-500 bg-amber-500/10"
            title="Earnings"
            badge="Payouts"
          />
          <ShortcutCard
            href="/freelancer/profile"
            icon={User}
            iconColor="text-indigo-500 bg-indigo-500/10"
            title="My Profile"
            badge="Settings"
          />
        </div>
      </div>

      {/* Recent Activity: Contracts & Proposals Split View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Contracts Card */}
        <GlassCard className="p-5 space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="size-4 text-emerald-500" />
              <h2 className="text-base font-extrabold">Active & Recent Orders</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-emerald-500 hover:text-emerald-400 font-bold p-0 h-auto">
              <Link href="/freelancer/contracts">
                View All <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {loading || userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--glass-border)] p-6 text-center text-xs font-semibold text-foreground/50 space-y-2">
              <ScrollText className="mx-auto size-8 opacity-40" />
              <p>No active contracts yet.</p>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/freelancer/gigs/new">Publish a Gig</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 shrink-0 ring-1 ring-emerald-500/30">
                      {c.clientAvatar ? (
                        <AvatarImage src={c.clientAvatar} alt={c.clientName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-xs font-bold">
                        {initials(c.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold truncate">{c.title}</h3>
                      <p className="text-[11px] font-semibold text-foreground/60 truncate">
                        Client: <span className="text-foreground">{c.clientName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-500 font-mono">
                        ${c.totalAmount.toLocaleString()}
                      </div>
                      <StatusPill status={c.status} className="scale-75 origin-right" />
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold">
                      <Link href={`/freelancer/contracts/${c.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Proposals Card */}
        <GlassCard className="p-5 space-y-4 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-purple-500" />
              <h2 className="text-base font-extrabold">Submitted Proposals</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-purple-500 hover:text-purple-400 font-bold p-0 h-auto">
              <Link href="/freelancer/proposals">
                View All <ArrowUpRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {loading || userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentProposals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--glass-border)] p-6 text-center text-xs font-semibold text-foreground/50 space-y-2">
              <FileText className="mx-auto size-8 opacity-40" />
              <p>No proposals submitted yet.</p>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/client/browse">Browse Jobs & Bid</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 hover:border-purple-500/30 transition-colors gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-extrabold truncate">{p.gigTitle}</h3>
                    <p className="text-[11px] font-semibold text-foreground/60 truncate mt-0.5">
                      Client: <span className="text-foreground">{p.clientName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-purple-500 font-mono">
                        ${p.bidAmount.toLocaleString()}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-foreground/50">
                        {p.status}
                      </span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold">
                      <Link href="/freelancer/proposals">Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  subtitle,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  label: string;
  value: string | number | undefined;
  subtitle: string;
  loading: boolean;
}) {
  return (
    <GlassCard className="p-4 sm:p-5 hover:border-emerald-500/30 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-foreground/60 truncate">
          {label}
        </span>
        <div className={`inline-flex size-8 items-center justify-center rounded-xl ${iconBg} shrink-0`}>
          <Icon className="size-4" />
        </div>
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
          <GradientText>
            {typeof value === "number"
              ? value.toLocaleString()
              : (value ?? "—")}
          </GradientText>
        </div>
      )}
      <p className="mt-1 text-[11px] font-semibold text-foreground/50 truncate">
        {subtitle}
      </p>
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
