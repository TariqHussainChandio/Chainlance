"use client";

import * as React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard,
  RefreshCw,
  Loader2
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'platform_fee' | 'refund';
  amount: number;
  feeAmount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: number | string;
}

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
  limit?: number;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  deposit: Wallet,
  withdrawal: CreditCard,
  payment: RefreshCw,
  platform_fee: RefreshCw,
  refund: RefreshCw,
};

const TYPE_COLORS: Record<string, string> = {
  deposit: 'text-emerald-500',
  withdrawal: 'text-red-500',
  payment: 'text-emerald-400',
  platform_fee: 'text-purple-500',
  refund: 'text-amber-500',
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  payment: 'Payment',
  platform_fee: 'Platform Fee',
  refund: 'Refund',
};

import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 10;

export function TransactionList({ 
  transactions, 
  loading = false,
  onRefresh,
  showFilters = false,
  limit
}: TransactionListProps) {
  const [filter, setFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState<number>(1);
  
  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;
  
  const filteredTransactions = React.useMemo(() => {
    if (filter === 'all') return displayTransactions;
    return displayTransactions.filter(tx => tx.type === filter);
  }, [displayTransactions, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = React.useMemo(() => {
    if (limit) return filteredTransactions;
    return filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredTransactions, page, limit]);

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (transactions.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 text-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground/60">
            No transactions yet
          </h3>
          <p className="text-sm text-foreground/40">
            Your transaction history will appear here
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap shrink-0 max-w-full pb-1 sm:pb-0">
          {['all', 'deposit', 'payment', 'withdrawal', 'platform_fee'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="capitalize text-xs shrink-0"
            >
              {type.replace('_', ' ')}
            </Button>
          ))}
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="shrink-0">
              <RefreshCw className="size-3 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      )}

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto w-full touch-scroll">
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedTransactions.map((tx) => {
                const Icon = TYPE_ICONS[tx.type] || RefreshCw;
                const isPositive = tx.amount > 0;
                const amountStr = tx.type === 'platform_fee' 
                  ? `-$${Math.abs(tx.amount).toFixed(2)}`
                  : isPositive 
                    ? `+$${tx.amount.toFixed(2)}`
                    : `-$${Math.abs(tx.amount).toFixed(2)}`;
                
                const dateStr = tx.createdAt 
                  ? new Date(tx.createdAt).toLocaleDateString() 
                  : '—';
                
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-foreground/60">
                      {dateStr}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Icon className={cn("size-3", TYPE_COLORS[tx.type])} />
                        {TYPE_LABELS[tx.type] || tx.type.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      "font-mono",
                      tx.type === 'platform_fee' ? 'text-purple-500' :
                      isPositive ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {amountStr}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-amber-500/15 text-amber-700' :
                        tx.status === 'failed' ? 'bg-red-500/15 text-red-700' :
                        'bg-slate-500/15 text-slate-700'
                      )}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {tx.referenceId ? tx.referenceId.slice(0, 8) + '...' : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {!limit && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredTransactions.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}