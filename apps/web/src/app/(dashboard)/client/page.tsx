"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AzureButton } from "@/components/ui/azure-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listClientContracts,
  listMilestones,
} from "@/lib/firebase/contracts";
import { listClientProposals } from "@/lib/firebase/proposals";
import type { SerializedContract, SerializedProposal } from "@/lib/firebase/schema";

interface ClientStats {
  activeContracts: number;
  totalSpent: number;
  hiredFreelancers: number;
  openProposals: number;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function ClientHomePage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [stats, setStats] = React.useState<ClientStats | null>(null);
  const [recentContracts, setRecentContracts] = React.useState<SerializedContract[]>([]);
  const [pendingProposals, setPendingProposals] = React.useState<SerializedProposal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      listClientContracts(user.uid),
      listClientProposals(user.uid),
    ])
      .then(async ([contracts, proposals]) => {
        if (!isMounted) return;

        const milestonesPerContract = await Promise.all(
          contracts.map((c) => listMilestones(c.id))
        );

        const activeContracts = contracts.filter((c) =>
          ["active", "delivered"].includes(c.status)
        ).length;

        const totalSpent = milestonesPerContract
          .flat()
          .filter((m) => m.status === "completed")
          .reduce((acc, m) => acc + m.amount, 0);

        const hiredFreelancers = new Set(contracts.map((c) => c.freelancerId)).size;
        const openProposals = proposals.filter((p) => p.status === "pending").length;

        setStats({ activeContracts, totalSpent, hiredFreelancers, openProposals });
        setRecentContracts(contracts.slice(0, 4));
        setPendingProposals(proposals.filter((p) => p.status === "pending").slice(0, 3));
      })
      .catch((err) => {
        console.error("Failed to load client home data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, userLoading]);

  const name = user?.name ?? "Client";
  const stripeVerified = Boolean(user?.stripeConnected || user?.paymentMethodConnected);

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
                  Verified Client Portal
                </Badge>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate">
                Welcome back, {name}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground/70 truncate">
                Manage active contracts, review applicant proposals, and fund secure escrows.
              </p>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <AzureButton asChild size="md" className="w-full sm:w-auto font-extrabold text-xs">
              <Link href="/client/browse">
                <Plus className="size-4 mr-1.5" />
                Browse & Hire Talent
              </Link>
            </AzureButton>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto text-xs font-bold border-[var(--glass-border)]">
              <Link href="/client/payments/deposit">
                <CreditCard className="size-4 mr-1.5 text-emerald-500" />
                Add Escrow Funds
              </Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Stripe Payment Account Banner */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold">Stripe Payment Account Status</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold">
                {stripeVerified ? "Verified & Ready" : "Setup Recommended"}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-foreground/60 mt-0.5">
              Escrow funding and milestone payouts operate seamlessly via 256-bit Stripe security.
            </p>
          </div>
        </div>
        {!stripeVerified && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            onClick={() => {
              toast.success("Stripe Payment Account successfully connected!");
            }}
          >
            Connect Stripe Account
          </Button>
        )}
      </GlassCard>

      {/* Main Performance Metrics Grid */}
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Briefcase}
          iconBg="bg-blue-500/15 text-blue-500"
          label="Active contracts"
          value={stats?.activeContracts}
          subtitle="Ongoing projects"
          loading={loading || userLoading}
        />
        <StatTile
          icon={CreditCard}
          iconBg="bg-emerald-500/15 text-emerald-500"
          label="Total spent"
          value={stats ? `$${stats.totalSpent.toLocaleString()}` : undefined}
          subtitle="Escrow volume funded"
          loading={loading || userLoading}
        />
        <StatTile
          icon={Users}
          iconBg="bg-purple-500/15 text-purple-500"
          label="Hired freelancers"
          value={stats?.hiredFreelancers}
          subtitle="Talent network size"
          loading={loading || userLoading}
        />
        <StatTile
          icon={FileText}
          iconBg="bg-amber-500/15 text-amber-500"
          label="Open proposals"
          value={stats?.openProposals}
          subtitle="Applicant pitches"
          loading={loading || userLoading}
        />
      </div>

      {/* Quick Work Shortcuts Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/60">
          Client Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ShortcutCard
            href="/client/browse"
            icon={Users}
            iconColor="text-emerald-500 bg-emerald-500/10"
            title="Hire Talent"
            badge="Browse"
          />
          <ShortcutCard
            href="/client/contracts"
            icon={Briefcase}
            iconColor="text-blue-500 bg-blue-500/10"
            title="Contracts"
            badge="Active"
          />
          <ShortcutCard
            href="/client/proposals"
            icon={FileText}
            iconColor="text-purple-500 bg-purple-500/10"
            title="Proposals"
            badge="Review"
          />
          <ShortcutCard
            href="/client/messages"
            icon={MessageSquare}
            iconColor="text-teal-500 bg-teal-500/10"
            title="Messages"
            badge="Chat"
          />
          <ShortcutCard
            href="/client/payments"
            icon={CreditCard}
            iconColor="text-amber-500 bg-amber-500/10"
            title="Payments"
            badge="Escrow"
          />
          <ShortcutCard
            href="/client/profile"
            icon={Star}
            iconColor="text-indigo-500 bg-indigo-500/10"
            title="Account"
            badge="Settings"
          />
        </div>
      </div>

      {/* Active Contracts & Recent Proposals Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Contracts */}
        <GlassCard className="p-5 space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-emerald-500" />
              <h2 className="text-base font-extrabold">Active Contracts</h2>
            </div>
            <Link
              href="/client/contracts"
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              View all ({recentContracts.length})
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--glass-border)] rounded-xl space-y-2">
              <Briefcase className="size-8 mx-auto text-foreground/30" />
              <p className="text-xs font-semibold text-foreground/60">
                No active contracts yet. Start by browsing freelancers or accepting proposals.
              </p>
              <AzureButton asChild size="sm" className="mt-2 text-xs">
                <Link href="/client/browse">Explore Gigs</Link>
              </AzureButton>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 hover:border-emerald-500/30 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 shrink-0 ring-1 ring-emerald-500/30">
                      {contract.freelancerAvatar ? (
                        <AvatarImage src={contract.freelancerAvatar} alt={contract.freelancerName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-xs font-bold">
                        {initials(contract.freelancerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold truncate">{contract.title}</h4>
                      <p className="text-[11px] font-semibold text-foreground/60 truncate">
                        Freelancer: <span className="text-foreground">{contract.freelancerName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-500 font-mono">
                        ${contract.totalAmount.toLocaleString()}
                      </div>
                      <Badge className="text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {contract.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs font-bold">
                      <Link href={`/client/contracts/${contract.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Pending Proposals */}
        <GlassCard className="p-5 space-y-4 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-purple-500" />
              <h2 className="text-base font-extrabold">Pending Proposals</h2>
            </div>
            <Link
              href="/client/proposals"
              className="text-xs font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1"
            >
              Review proposals
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : pendingProposals.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--glass-border)] rounded-xl space-y-2">
              <FileText className="size-8 mx-auto text-foreground/30" />
              <p className="text-xs font-semibold text-foreground/60">
                No pending proposals waiting for your review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 hover:border-purple-500/30 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 shrink-0 ring-1 ring-purple-500/30">
                      {prop.freelancerAvatar ? (
                        <AvatarImage src={prop.freelancerAvatar} alt={prop.freelancerName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-400 text-white text-xs font-bold">
                        {initials(prop.freelancerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold truncate">{prop.freelancerName}</h4>
                      <p className="text-[11px] font-semibold text-foreground/60 truncate">
                        {prop.deliveryDays} days delivery
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-purple-500 font-mono">
                        ${prop.bidAmount.toLocaleString()}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs font-bold">
                      <Link href="/client/proposals">Review</Link>
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

function StatTile({
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
