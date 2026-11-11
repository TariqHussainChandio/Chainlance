"use client";

import * as React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'payment' | 'withdrawal' | 'deposit' | 'fee';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
  loading?: boolean;
  limit?: number;
  onViewAll?: () => void;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user: { name: 'John Doe', email: 'john@example.com' },
    type: 'payment',
    amount: 245.50,
    status: 'completed',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    user: { name: 'Jane Smith', email: 'jane@example.com' },
    type: 'withdrawal',
    amount: -500.00,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    user: { name: 'Bob Johnson', email: 'bob@example.com' },
    type: 'deposit',
    amount: 1000.00,
    status: 'completed',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

const statusColors = {
  completed: 'bg-emerald-500/15 text-emerald-700',
  pending: 'bg-amber-500/15 text-amber-700',
  failed: 'bg-red-500/15 text-red-700'
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]!.toUpperCase())
    .join('');
}

export function RecentTransactions({ 
  transactions = mockTransactions, 
  loading = false,
  limit = 5,
  onViewAll 
}: RecentTransactionsProps) {
  const displayTransactions = transactions.slice(0, limit);

  if (loading) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-foreground/10 rounded w-40 animate-pulse" />
          <div className="h-8 bg-foreground/10 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="size-10 rounded-full bg-foreground/10" />
              <div className="flex-1">
                <div className="h-4 bg-foreground/10 rounded w-32" />
                <div className="mt-1 h-3 bg-foreground/10 rounded w-24" />
              </div>
              <div className="h-4 bg-foreground/10 rounded w-16" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Recent Transactions</h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ChevronRight className="size-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {displayTransactions.length === 0 ? (
          <p className="text-sm text-foreground/60 text-center py-6">
            No recent transactions
          </p>
        ) : (
          displayTransactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isNegative = tx.amount < 0;
            
            return (
              <div 
                key={tx.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs">
                    {initials(tx.user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {tx.user.name}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-mono font-semibold",
                        isPositive ? "text-emerald-500" : 
                        isNegative ? "text-red-500" : 
                        "text-foreground"
                      )}>
                        {isPositive ? '+' : ''}{tx.amount.toFixed(2)}
                      </p>
                      <span className={cn(
                        "inline-block text-[10px] px-2 py-0.5 rounded-full",
                        statusColors[tx.status]
                      )}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/40">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex justify-between text-xs text-foreground/50">
        <span>Showing {Math.min(limit, displayTransactions.length)} of {transactions.length}</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </GlassCard>
  );
}