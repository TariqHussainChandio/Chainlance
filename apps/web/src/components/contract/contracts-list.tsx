"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase, Plus, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listClientContracts,
  listFreelancerContracts,
  listMilestones,
} from "@/lib/firebase/contracts";
import type {
  ContractStatus,
  SerializedContract,
} from "@/lib/firebase/schema";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/ui/pagination";

type Role = "client" | "freelancer";

type FilterTab = "all" | ContractStatus;

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
];
const PAGE_SIZE = 8;

interface MilestoneProgress {
  completed: number;
  total: number;
}

interface ContractsListProps {
  role: Role;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function ContractsList({ role }: ContractsListProps) {
  const { user, loading: userLoading } = useCurrentUser();
  const [contracts, setContracts] = React.useState<SerializedContract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [progress, setProgress] = React.useState<
    Record<string, MilestoneProgress>
  >({});

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const loader =
      role === "client" ? listClientContracts : listFreelancerContracts;
    loader(user.uid)
      .then((list) => {
        if (!cancelled) {
          setContracts(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, user, userLoading]);

  // Lazy milestone progress per contract — N+1 but bounded by list size and
  // acceptable for MVP. Optimize via collectionGroup query when scale demands.
  React.useEffect(() => {
    let cancelled = false;
    contracts.forEach((c) => {
      if (progress[c.id]) return;
      listMilestones(c.id)
        .then((ms) => {
          if (cancelled) return;
          const completed = ms.filter((m) => m.status === "completed").length;
          setProgress((prev) =>
            prev[c.id]
              ? prev
              : { ...prev, [c.id]: { completed, total: ms.length } }
          );
        })
        .catch(() => {
          /* progress just stays "—" */
        });
    });
    return () => {
      cancelled = true;
    };
  }, [contracts, progress]);

  const counts = React.useMemo(() => {
    const c: Record<FilterTab, number> = {
      all: contracts.length,
      draft: 0,
      active: 0,
      delivered: 0,
      completed: 0,
      disputed: 0,
      cancelled: 0,
    };
    for (const k of contracts) {
      c[k.status] = (c[k.status] ?? 0) + 1;
    }
    return c;
  }, [contracts]);

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = React.useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const counterpartyLabel = role === "client" ? "Freelancer" : "Client";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Contracts</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {contracts.length} total
        </p>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterTab)}
      >
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar flex-nowrap shrink-0 p-1 max-w-full">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value} className="gap-2 shrink-0">
              {f.label}
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--glass-border)] bg-foreground/5 px-1.5 text-[10px] font-semibold text-foreground/60"
                )}
              >
                {counts[f.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading || userLoading ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="divide-y divide-[var(--glass-border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 p-4">
                {Array.from({ length: 7 }).map((__, j) => (
                  <Skeleton key={j} className="h-5" />
                ))}
              </div>
            ))}
          </div>
        </GlassCard>
      ) : contracts.length === 0 ? (
        <EmptyState role={role} />
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-foreground/60">
          No contracts in this tab.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto w-full touch-scroll">
              <Table className="min-w-[650px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{counterpartyLabel}</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => {
                    const counterpartyName =
                      role === "client" ? c.freelancerName : c.clientName;
                    const counterpartyAvatar =
                      role === "client" ? c.freelancerAvatar : c.clientAvatar;
                    const prog = progress[c.id];
                    const progLabel = prog
                      ? `${prog.completed} / ${prog.total}`
                      : "—";
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              {counterpartyAvatar ? (
                                <AvatarImage
                                  src={counterpartyAvatar}
                                  alt={counterpartyName}
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                                {initials(counterpartyName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">
                              {counterpartyName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <span className="line-clamp-1 text-sm font-medium">
                            {c.title}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <GradientText>
                            ${c.totalAmount.toLocaleString()}
                          </GradientText>
                        </TableCell>
                        <TableCell className="text-sm text-foreground/70">
                          {progLabel}
                        </TableCell>
                        <TableCell>
                          <StatusPill status={c.status} />
                        </TableCell>
                        <TableCell className="text-sm text-foreground/60">
                          {formatRelativeTime(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild type="button" variant="outline" size="sm">
                            <Link href={`/${role}/contracts/${c.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </GlassCard>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({ role }: { role: Role }) {
  if (role === "client") {
    return (
      <GlassCard className="p-10 text-center space-y-4">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
          <Briefcase className="size-7" />
        </span>
        <div>
          <h3 className="text-base font-semibold">No contracts yet</h3>
          <p className="mt-1 text-sm text-foreground/60">
            Browse the marketplace to hire your first freelancer.
          </p>
        </div>
        <AzureButton asChild size="md">
          <Link href="/client/browse">
            <Search className="size-4" />
            Browse marketplace
          </Link>
        </AzureButton>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-10 text-center space-y-4">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
        <Briefcase className="size-7" />
      </span>
      <div>
        <h3 className="text-base font-semibold">No contracts yet</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Publish a gig to start receiving contracts from clients.
        </p>
      </div>
      <AzureButton asChild size="md">
        <Link href="/freelancer/gigs/new">
          <Plus className="size-4" />
          Create a gig
        </Link>
      </AzureButton>
    </GlassCard>
  );
}
