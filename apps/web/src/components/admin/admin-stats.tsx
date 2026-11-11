"use client";

import * as React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  ArrowUpIcon,
  ArrowDownIcon
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientText } from '@/components/ui/gradient-text';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

interface AdminStatsProps {
  stats?: StatItem[];
  loading?: boolean;
}

const defaultStats: StatItem[] = [
  {
    label: 'Total Revenue',
    value: '$45,230',
    change: 12.5,
    icon: DollarSign,
    color: 'text-emerald-500'
  },
  {
    label: 'Platform Fees',
    value: '$9,046',
    change: 12.5,
    icon: TrendingUp,
    color: 'text-purple-500'
  },
  {
    label: 'Total Users',
    value: '1,284',
    change: 8.3,
    icon: Users,
    color: 'text-teal-400'
  },
  {
    label: 'Active Contracts',
    value: '342',
    change: -2.1,
    icon: Activity,
    color: 'text-amber-500'
  }
];

export function AdminStats({ stats = defaultStats, loading = false }: AdminStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-5 animate-pulse">
            <div className="h-4 bg-foreground/10 rounded w-24" />
            <div className="mt-2 h-8 bg-foreground/10 rounded w-32" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change && stat.change > 0;
        
        return (
          <GlassCard key={index} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-foreground/60">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold">
                  <GradientText>{stat.value}</GradientText>
                </div>
                {stat.change !== undefined && (
                  <div className={cn(
                    "mt-2 inline-flex items-center gap-1 text-sm",
                    isPositive ? "text-emerald-500" : "text-red-500"
                  )}>
                    {isPositive ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className={cn(
                "inline-flex size-10 items-center justify-center rounded-full",
                stat.color || "text-[color:var(--azure-500)]",
                "bg-current/10"
              )}>
                <Icon className="size-5" />
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}