"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Plus } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GigCard } from "@/components/gig-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getFreelancerGigs } from "@/lib/firebase/gigs";
import type { Gig, GigStatus } from "@/lib/firebase/schema";

import { Pagination } from "@/components/ui/pagination";

type Filter = "all" | "draft" | "published" | "unpublished";

const PAGE_SIZE = 9;

const filterLabels: Record<Filter, string> = {
  all: "All",
  draft: "Drafts",
  published: "Published",
  unpublished: "Unpublished",
};

function filterGigs(gigs: Gig[], filter: Filter): Gig[] {
  if (filter === "all") return gigs;
  return gigs.filter((g) => g.status === (filter as GigStatus));
}

function GigGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <GlassCard key={i} className="overflow-hidden p-0">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const isAll = filter === "all";
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
        <Briefcase className="size-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {isAll ? "No gigs yet" : `No ${filterLabels[filter].toLowerCase()}`}
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          {isAll
            ? "Create your first gig to start receiving proposals."
            : "Switch tabs to see your other gigs."}
        </p>
      </div>
      {isAll ? (
        <AzureButton asChild size="md">
          <Link href="/freelancer/gigs/new">
            <Plus className="size-4" />
            Create new gig
          </Link>
        </AzureButton>
      ) : null}
    </GlassCard>
  );
}

export default function FreelancerGigsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getFreelancerGigs(user.uid);
      setGigs(result);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [userLoading, user, refresh]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const counts = useMemo(() => {
    return {
      all: gigs.length,
      draft: gigs.filter((g) => g.status === "draft").length,
      published: gigs.filter((g) => g.status === "published").length,
      unpublished: gigs.filter((g) => g.status === "unpublished").length,
    } satisfies Record<Filter, number>;
  }, [gigs]);

  const filtered = useMemo(
    () => filterGigs(gigs, filter),
    [gigs, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedGigs = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My gigs</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {loading || userLoading
              ? "Loading your gigs…"
              : gigs.length === 1
                ? "1 gig"
                : `${gigs.length} gigs`}
          </p>
        </div>
        <AzureButton asChild size="md" className="w-full sm:w-auto">
          <Link href="/freelancer/gigs/new">
            <Plus className="size-4" />
            Create new gig
          </Link>
        </AzureButton>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className="space-y-6"
      >
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar flex-nowrap shrink-0 p-1 max-w-full">
          {(Object.keys(filterLabels) as Filter[]).map((key) => (
            <TabsTrigger key={key} value={key} className="gap-2 shrink-0">
              <span>{filterLabels[key]}</span>
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                {counts[key]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(filterLabels) as Filter[]).map((key) => (
          <TabsContent key={key} value={key}>
            {loading || userLoading ? (
              <GigGridSkeleton />
            ) : filterGigs(gigs, key).length === 0 ? (
              <EmptyState filter={key} />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pagedGigs.map((gig) => (
                    <GigCard
                      key={gig.id}
                      gig={gig}
                      variant="manage"
                      currentUserId={user?.uid}
                      onChanged={refresh}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
