"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentSnapshot } from "firebase/firestore";
import {
  Briefcase,
  ChevronDown,
  Code,
  Compass,
  Cpu,
  Filter,
  Globe,
  Info,
  Layers,
  Palette,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GigCard } from "@/components/gig-card";
import { searchGigs } from "@/lib/firebase/gigs";
import type { Gig, SerializedGig } from "@/lib/firebase/schema";
import type { RankedGig } from "@/lib/ai/recommend";
import { CATEGORIES } from "@/lib/schemas/gig-schema";
import { cn } from "@/lib/utils";

type Sort = "newest" | "priceAsc" | "priceDesc" | "ratingDesc";

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest",
  priceAsc: "Price: low to high",
  priceDesc: "Price: high to low",
  ratingDesc: "Top rated",
};

const CATEGORY_CAROUSEL = [
  { label: "All Services", value: "", icon: Compass },
  { label: "Web Development", value: "Web Development", icon: Globe },
  { label: "Mobile Apps", value: "Mobile Apps", icon: Code },
  { label: "UI/UX Design", value: "UI/UX Design", icon: Palette },
  { label: "Smart Contracts & Web3", value: "Smart Contracts & Web3", icon: Layers },
  { label: "AI & Machine Learning", value: "AI & Machine Learning", icon: Cpu },
  { label: "Graphics & Design", value: "Graphics & Design", icon: Sparkles },
  { label: "Writing & Translation", value: "Writing & Translation", icon: Briefcase },
];

const COMMON_SKILLS = [
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Python",
  "Solidity",
  "Smart Contracts",
  "Web3",
  "Tailwind",
  "Figma",
  "UI Design",
  "JavaScript",
  "MongoDB",
  "PostgreSQL",
  "AI/ML",
];

const BUDGET_MIN = 0;
const BUDGET_MAX = 10000;
const BUDGET_STEP = 50;
const PAGE_SIZE = 24;
const ALL_CATEGORIES_VALUE = "__all__";

function priceLabel(n: number): string {
  return `$${n.toLocaleString()}`;
}

interface ParsedFilters {
  query: string;
  category: string;
  skills: string[];
  minBudget: number;
  maxBudget: number;
  sort: Sort;
  aiRanked: boolean;
}

function parseFilters(sp: URLSearchParams): ParsedFilters {
  const sortRaw = sp.get("sort") as Sort | null;
  return {
    query: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    skills:
      sp
        .get("skills")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    minBudget: Number(sp.get("minBudget") ?? BUDGET_MIN),
    maxBudget: Number(sp.get("maxBudget") ?? BUDGET_MAX),
    sort:
      sortRaw && ["newest", "priceAsc", "priceDesc", "ratingDesc"].includes(
        sortRaw
      )
        ? sortRaw
        : "newest",
    aiRanked: sp.get("ai") !== "0",
  };
}

function hasAnyFilter(f: ParsedFilters): boolean {
  return (
    f.query !== "" ||
    f.category !== "" ||
    f.skills.length > 0 ||
    f.minBudget > BUDGET_MIN ||
    f.maxBudget < BUDGET_MAX ||
    f.sort !== "newest"
  );
}

function matchesLocalFilters(
  gig: { title: string; skills: string[]; pricingBasic: number },
  f: ParsedFilters
): boolean {
  if (f.query) {
    const needle = f.query.toLowerCase().trim();
    if (needle && !gig.title.toLowerCase().includes(needle)) return false;
  }
  if (f.skills.length > 0) {
    const have = new Set(gig.skills.map((s) => s.toLowerCase()));
    const any = f.skills.some((s) => have.has(s.toLowerCase()));
    if (!any) return false;
  }
  if (f.minBudget > BUDGET_MIN && gig.pricingBasic < f.minBudget) return false;
  if (f.maxBudget < BUDGET_MAX && gig.pricingBasic > f.maxBudget) return false;
  return true;
}

function CardSkeleton() {
  return (
    <GlassCard className="overflow-hidden p-0">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
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
  );
}

export default function ClientBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  type Row = {
    gig: Gig | SerializedGig;
    score: number;
    explanations: string[];
  };

  const [searchInput, setSearchInput] = useState(filters.query);
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<[number, number]>([
    filters.minBudget,
    filters.maxBudget,
  ]);
  const fetchSeq = useRef(0);

  useEffect(() => {
    setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setBudgetDraft([filters.minBudget, filters.maxBudget]);
  }, [filters.minBudget, filters.maxBudget]);

  const updateUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (searchInput === filters.query) return;
    const t = setTimeout(() => {
      updateUrl({ q: searchInput || null });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, filters.query, updateUrl]);

  useEffect(() => {
    const seq = ++fetchSeq.current;
    setInitialLoading(true);
    setRows([]);
    setCursor(null);

    if (filters.aiRanked) {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      params.set("limit", String(PAGE_SIZE * 2));

      const fallbackToUnranked = async (notify: boolean) => {
        if (notify) {
          toast.error(
            "AI ranking temporarily unavailable, showing latest gigs"
          );
        }
        try {
          const result = await searchGigs({
            query: filters.query || undefined,
            category: filters.category || undefined,
            skills:
              filters.skills.length > 0 ? filters.skills : undefined,
            minBudget:
              filters.minBudget > BUDGET_MIN ? filters.minBudget : undefined,
            maxBudget:
              filters.maxBudget < BUDGET_MAX ? filters.maxBudget : undefined,
            sort: filters.sort,
            limit: PAGE_SIZE,
          });
          if (fetchSeq.current !== seq) return;
          setRows(
            result.gigs.map((gig) => ({ gig, score: 0, explanations: [] }))
          );
          setCursor(result.nextCursor);
        } catch {
          if (fetchSeq.current !== seq) return;
          setRows([]);
          setCursor(null);
        } finally {
          if (fetchSeq.current === seq) setInitialLoading(false);
        }
      };

      fetch(`/api/recommendations?${params.toString()}`, {
        credentials: "include",
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`status ${res.status}`);
          const data = (await res.json()) as {
            results: RankedGig[];
            fallback?: boolean;
          };
          if (fetchSeq.current !== seq) return;
          const filtered = data.results.filter((r) =>
            matchesLocalFilters(r.gig, filters)
          );
          if (filtered.length === 0) {
            await fallbackToUnranked(false);
            return;
          }
          setRows(filtered.slice(0, PAGE_SIZE));
          setCursor(null);
          setInitialLoading(false);
        })
        .catch(async () => {
          await fallbackToUnranked(true);
        });
      return;
    }

    searchGigs({
      query: filters.query || undefined,
      category: filters.category || undefined,
      skills: filters.skills.length > 0 ? filters.skills : undefined,
      minBudget:
        filters.minBudget > BUDGET_MIN ? filters.minBudget : undefined,
      maxBudget:
        filters.maxBudget < BUDGET_MAX ? filters.maxBudget : undefined,
      sort: filters.sort,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (fetchSeq.current !== seq) return;
        setRows(
          result.gigs.map((gig) => ({ gig, score: 0, explanations: [] }))
        );
        setCursor(result.nextCursor);
      })
      .catch(() => {
        if (fetchSeq.current !== seq) return;
        setRows([]);
        setCursor(null);
      })
      .finally(() => {
        if (fetchSeq.current !== seq) return;
        setInitialLoading(false);
      });
  }, [
    filters.query,
    filters.category,
    filters.skills,
    filters.minBudget,
    filters.maxBudget,
    filters.sort,
    filters.aiRanked,
  ]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await searchGigs({
        query: filters.query || undefined,
        category: filters.category || undefined,
        skills: filters.skills.length > 0 ? filters.skills : undefined,
        minBudget:
          filters.minBudget > BUDGET_MIN ? filters.minBudget : undefined,
        maxBudget:
          filters.maxBudget < BUDGET_MAX ? filters.maxBudget : undefined,
        sort: filters.sort,
        limit: PAGE_SIZE,
        cursor,
      });
      setRows((prev) => [
        ...prev,
        ...result.gigs.map((gig) => ({
          gig,
          score: 0,
          explanations: [] as string[],
        })),
      ]);
      setCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleSkill(skill: string) {
    const next = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    updateUrl({ skills: next.length > 0 ? next.join(",") : null });
  }

  function resetFilters() {
    router.replace("?", { scroll: false });
    setSearchInput("");
  }

  const anyFilter = hasAnyFilter(filters);
  const budgetLabel = `${priceLabel(filters.minBudget)} - ${priceLabel(filters.maxBudget)}`;
  const skillsLabel =
    filters.skills.length > 0
      ? `${filters.skills.length} selected`
      : "Skills";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Explore Freelance Services
            </h1>
            <Sparkles className="size-6 text-emerald-500" />
          </div>
          <p className="mt-1 text-sm text-foreground/70 font-medium">
            Find top-rated talent for Web Development, AI, Design, Web3, and more.
          </p>
        </div>
      </div>

      {/* Fiverr-Style Category Carousel Navigation Bar */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--glass-border)]">
        {CATEGORY_CAROUSEL.map((cat) => {
          const Icon = cat.icon;
          const isSelected =
            (!filters.category && !cat.value) || filters.category === cat.value;
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => updateUrl({ category: cat.value || null })}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 border",
                isSelected
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.3)] scale-105"
                  : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-foreground/75 hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10"
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sticky Filter Strip */}
      <div className="sticky top-16 z-20 -mx-1">
        <GlassCard className="flex flex-wrap items-center gap-3 px-4 py-3 border-emerald-500/30">
          <div className="relative min-w-[16rem] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search services (e.g. Next.js, Logo Design, Smart Contracts)..."
              className="pl-9 h-10 text-xs font-medium"
            />
          </div>

          <Select
            value={filters.category || ALL_CATEGORIES_VALUE}
            onValueChange={(v) =>
              updateUrl({
                category: v === ALL_CATEGORIES_VALUE ? null : v,
              })
            }
          >
            <SelectTrigger className="min-w-[12rem] h-10 text-xs font-bold">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>
                All categories
              </SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-10 text-xs font-bold">
                <Filter className="size-4 text-emerald-500" />
                {budgetLabel}
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  Budget Range ($)
                </div>
                <Slider
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={BUDGET_STEP}
                  value={budgetDraft}
                  onValueChange={(v) =>
                    setBudgetDraft([v[0]!, v[1]!] as [number, number])
                  }
                  onValueCommit={(v) => {
                    const min = v[0]!;
                    const max = v[1]!;
                    updateUrl({
                      minBudget: min > BUDGET_MIN ? String(min) : null,
                      maxBudget: max < BUDGET_MAX ? String(max) : null,
                    });
                  }}
                />
                <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                  <span>{priceLabel(budgetDraft[0])}</span>
                  <span>{priceLabel(budgetDraft[1])}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-10 text-xs font-bold">
                <Filter className="size-4 text-emerald-500" />
                {skillsLabel}
                {filters.skills.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-[10px]"
                  >
                    {filters.skills.length}
                  </Badge>
                )}
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Skills Filter
              </div>
              <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
                {COMMON_SKILLS.map((skill) => {
                  const checked = filters.skills.includes(skill);
                  return (
                    <label
                      key={skill}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-emerald-500/10"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      {skill}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={filters.sort}
            onValueChange={(v) => updateUrl({ sort: v })}
          >
            <SelectTrigger className="min-w-[10rem] h-10 text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as Sort[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {anyFilter ? (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-400"
            >
              <X className="size-3.5" />
              Reset filters
            </button>
          ) : null}
        </GlassCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-foreground/70">
          {initialLoading
            ? "Searching services..."
            : rows.length === 1
              ? "Showing 1 service"
              : `Showing ${rows.length} services`}
        </span>
        <div className="flex items-center gap-2">
          <span
            title="Personalized AI matches based on your profile, skills, and activity."
            className="inline-flex size-6 cursor-help items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/60 hover:text-foreground"
          >
            <Info className="size-3.5" />
          </span>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition-all",
              filters.aiRanked
                ? "border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.3)]"
                : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/70"
            )}
          >
            <Wand2
              className={cn(
                "size-3.5",
                filters.aiRanked
                  ? "text-emerald-400 animate-pulse"
                  : "text-foreground/50"
              )}
            />
            <span>AI-Ranked</span>
            <Switch
              checked={filters.aiRanked}
              onCheckedChange={(v) => updateUrl({ ai: v ? null : "0" })}
              className="data-[state=checked]:bg-emerald-500"
            />
          </label>
        </div>
      </div>

      {initialLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Search className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              No services match your current criteria
            </h2>
            <p className="mt-1 text-xs text-foreground/60 font-medium">
              Try adjusting your budget, selecting another category, or removing skill tags.
            </p>
          </div>
          {anyFilter ? (
            <AzureButton type="button" onClick={resetFilters} size="md">
              Reset All Filters
            </AzureButton>
          ) : null}
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((row) => (
              <GigCard
                key={row.gig.id}
                gig={row.gig}
                variant="marketplace"
                aiMatch={filters.aiRanked ? row.score : undefined}
                aiExplanation={
                  filters.aiRanked ? row.explanations[0] : undefined
                }
              />
            ))}
          </div>
          {cursor ? (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="font-bold text-xs"
              >
                {loadingMore ? "Loading..." : "Load More Services"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
