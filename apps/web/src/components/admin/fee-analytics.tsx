"use client";

import * as React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientText } from '@/components/ui/gradient-text';
import { cn } from '@/lib/utils';

interface FeeAnalyticsData {
  totalFees: number;
  averageFee: number;
  feeGrowth: number;
  feeDistribution: {
    contractFees: number;
    withdrawalFees: number;
    depositFees: number;
  };
}

interface FeeAnalyticsProps {
  data?: FeeAnalyticsData;
  loading?: boolean;
}

const defaultData: FeeAnalyticsData = {
  totalFees: 9046,
  averageFee: 142.50,
  feeGrowth: 12.5,
  feeDistribution: {
    contractFees: 6245,
    withdrawalFees: 1801,
    depositFees: 1000,
  }
};

export function FeeAnalytics({ data = defaultData, loading = false }: FeeAnalyticsProps) {
  if (loading) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-foreground/10 rounded w-32 animate-pulse" />
          <div className="h-10 bg-foreground/10 rounded w-24 animate-pulse" />
        </div>
        <div className="mt-4 h-32 bg-foreground/10 rounded animate-pulse" />
      </GlassCard>
    );
  }

  const total = data.feeDistribution.contractFees + 
                data.feeDistribution.withdrawalFees + 
                data.feeDistribution.depositFees;

  const percentages = {
    contract: total > 0 ? (data.feeDistribution.contractFees / total) * 100 : 0,
    withdrawal: total > 0 ? (data.feeDistribution.withdrawalFees / total) * 100 : 0,
    deposit: total > 0 ? (data.feeDistribution.depositFees / total) * 100 : 0,
  };

  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-foreground/60">Platform Fees</div>
          <div className="mt-1 text-3xl font-semibold">
            <GradientText>${data.totalFees.toFixed(2)}</GradientText>
          </div>
          <div className={cn(
            "mt-1 inline-flex items-center gap-1 text-sm",
            data.feeGrowth >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {data.feeGrowth >= 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(data.feeGrowth)}% from last month
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-foreground/60">Average Fee</div>
          <div className="mt-1 text-xl font-semibold">
            <GradientText>${data.averageFee.toFixed(2)}</GradientText>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Contract Fees</span>
            <span className="font-medium">${data.feeDistribution.contractFees.toFixed(2)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[var(--azure-500)] to-[var(--cyan-accent)]"
              style={{ width: `${Math.max(2, percentages.contract)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Withdrawal Fees</span>
            <span className="font-medium">${data.feeDistribution.withdrawalFees.toFixed(2)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${Math.max(2, percentages.withdrawal)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Deposit Fees</span>
            <span className="font-medium">${data.feeDistribution.depositFees.toFixed(2)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              style={{ width: `${Math.max(2, percentages.deposit)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-xs text-foreground/50">
        <span>Total transactions: 2,341</span>
        <span>Last 30 days</span>
      </div>
    </GlassCard>
  );
}