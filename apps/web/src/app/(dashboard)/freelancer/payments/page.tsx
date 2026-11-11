"use client";

import * as React from "react";
import Link from "next/link";
import { DollarSign, Wallet, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AzureButton } from "@/components/ui/azure-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionList, type Transaction } from "@/components/payment/transaction-list";
import { getMyPaymentsOverview } from "@/app/actions/payments";
import type { PaymentsStats } from "@/lib/payment/balance";
import { FREELANCER_FEE_PERCENTAGE } from "@chainwork/shared";

const EMPTY_STATS: PaymentsStats = {
  role: "freelancer",
  totalGross: 0,
  totalEarningsNet: 0,
  platformFees: 0,
  pendingEarningsNet: 0,
  withdrawals: 0,
  totalDeposits: 0,
  refunds: 0,
  totalSpent: 0,
  availableBalance: 0,
};

export default function FreelancerPaymentsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [stats, setStats] = React.useState<PaymentsStats>(EMPTY_STATS);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyPaymentsOverview();
      setTransactions(data.transactions as Transaction[]);
      setStats(data.stats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Earnings</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Milestone payouts from your contracts, platform fees, and withdrawals
          </p>
        </div>
        <AzureButton asChild className="w-full sm:w-auto">
          <Link href="/freelancer/payments/withdraw">
            <Wallet className="size-4" />
            Withdraw
          </Link>
        </AzureButton>
      </div>

      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <DollarSign className="size-4" />
            Total Earnings
          </div>
          <div className="mt-2 text-2xl font-semibold">
            <GradientText>${stats.totalEarningsNet.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            Net of the {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% service fee
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-emerald-500/30">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Wallet className="size-4" />
            Available Balance
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-500">
            <GradientText>${stats.availableBalance.toFixed(2)}</GradientText>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Calendar className="size-4" />
            Pending in Escrow
          </div>
          <div className="mt-2 text-2xl font-semibold">
            <GradientText>${stats.pendingEarningsNet.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            Funded milestones not yet released
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <TrendingUp className="size-4" />
            Platform Fees
          </div>
          <div className="mt-2 text-2xl font-semibold text-purple-500">
            <GradientText>${stats.platformFees.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% of released milestones
          </div>
        </GlassCard>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <TransactionList
            transactions={transactions}
            loading={loading}
            onRefresh={load}
            showFilters
          />
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <TransactionList
            transactions={transactions.filter((t) => t.type === "payment" && t.amount > 0)}
            loading={loading}
            onRefresh={load}
          />
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          <TransactionList
            transactions={transactions.filter((t) => t.type === "withdrawal")}
            loading={loading}
            onRefresh={load}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
