"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionList, type Transaction } from "@/components/payment/transaction-list";
import { getMyPaymentsOverview } from "@/app/actions/payments";
import type { PaymentsStats } from "@/lib/payment/balance";
import { CLIENT_FEE_PERCENTAGE } from "@chainwork/shared";

const EMPTY_STATS: PaymentsStats = {
  role: "client",
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

export default function ClientPaymentsPage() {
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
      toast.error(err instanceof Error ? err.message : "Failed to load payments.");
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
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Escrow funding, fees, refunds, and your wallet activity
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/client/payments/withdraw">
              <ArrowUpRight className="size-4" />
              Withdraw
            </Link>
          </Button>
          <AzureButton asChild className="flex-1 sm:flex-none">
            <Link href="/client/payments/deposit">
              <Wallet className="size-4" />
              Add Funds
            </Link>
          </AzureButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <CreditCard className="size-4" />
            Total Spent
          </div>
          <div className="mt-2 text-2xl font-semibold">
            <GradientText>${stats.totalSpent.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            Escrow funding plus service fees
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <TrendingUp className="size-4" />
            Platform Fees
          </div>
          <div className="mt-2 text-2xl font-semibold">
            <GradientText>${stats.platformFees.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            {(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}% of funded contracts
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-emerald-500/30">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Wallet className="size-4" />
            Wallet Balance
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-500">
            <GradientText>${stats.availableBalance.toFixed(2)}</GradientText>
          </div>
          <div className="mt-1 text-xs text-foreground/50">
            Deposits and refunds, minus withdrawals
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Wallet className="size-4" />
            Deposits
          </div>
          <div className="mt-2 text-2xl font-semibold">
            <GradientText>${stats.totalDeposits.toFixed(2)}</GradientText>
          </div>
        </GlassCard>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="payment">Escrow Funding</TabsTrigger>
          <TabsTrigger value="platform_fee">Fees</TabsTrigger>
          <TabsTrigger value="deposit">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <TransactionList
            transactions={transactions}
            loading={loading}
            onRefresh={load}
            showFilters
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <TransactionList
            transactions={transactions.filter((t) => t.type === "payment" || t.type === "refund")}
            loading={loading}
            onRefresh={load}
          />
        </TabsContent>

        <TabsContent value="platform_fee" className="mt-4">
          <TransactionList
            transactions={transactions.filter((t) => t.type === "platform_fee")}
            loading={loading}
            onRefresh={load}
          />
        </TabsContent>

        <TabsContent value="deposit" className="mt-4">
          <TransactionList
            transactions={transactions.filter(
              (t) => t.type === "deposit" || t.type === "withdrawal"
            )}
            loading={loading}
            onRefresh={load}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
