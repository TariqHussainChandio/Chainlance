"use client";

import * as React from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  RefreshCw,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";

import {
  restrictUserAccount,
  updateFraudAlertStatus,
} from "@/app/actions/fraud";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS as COLS } from "@/lib/firebase/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BUCKET_COLOR,
  BUCKET_LABEL,
  bucketFromScore,
  type RiskBucket,
} from "@/lib/ai/fraud";
import {
  getRiskDistribution,
  subscribeFraudAlerts,
  type RiskDistribution,
  type SerializedFraudAlert,
} from "@/lib/firebase/fraud";
import type { FraudAlertStatus, User } from "@/lib/firebase/schema";
import { formatDateShort, formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/ui/pagination";

const DAY = 86_400_000;
const PAGE_SIZE = 10;

type Tab = FraudAlertStatus | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "dismissed", label: "Dismissed" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function AdminFraudPage() {
  const [tab, setTab] = React.useState<Tab>("open");
  const [alerts, setAlerts] = React.useState<SerializedFraudAlert[]>([]);
  const [distribution, setDistribution] = React.useState<RiskDistribution | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [scanning, setScanning] = React.useState(false);
  const [reviewing, setReviewing] =
    React.useState<SerializedFraudAlert | null>(null);

  React.useEffect(() => {
    setPage(1);
    const unsub = subscribeFraudAlerts(tab, (next) => {
      setAlerts(next);
      setLoading(false);
    });
    return () => unsub();
  }, [tab]);

  const totalPages = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE));
  const pagedAlerts = React.useMemo(
    () => alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [alerts, page]
  );

  const refreshDistribution = React.useCallback(async () => {
    try {
      setDistribution(await getRiskDistribution());
    } catch {
      setDistribution(null);
    }
  }, []);

  React.useEffect(() => {
    void refreshDistribution();
  }, [refreshDistribution]);

  // Refresh distribution stats whenever the open-alerts list changes.
  React.useEffect(() => {
    void refreshDistribution();
  }, [alerts, refreshDistribution]);

  const openAlerts = React.useMemo(
    () => (tab === "open" ? alerts : alerts.filter((a) => a.status === "open")),
    [tab, alerts]
  );
  const recentAlertsCount = React.useMemo(
    () =>
      alerts.filter((a) => Date.now() - a.createdAt < 7 * DAY).length,
    [alerts]
  );

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/fraud/scan", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        scanned?: number;
        flagged?: number;
        error?: string;
      };
      if (!res.ok)
        throw new Error(data.error ?? `Scan failed (HTTP ${res.status})`);
      toast.success(
        `Scanned ${data.scanned ?? 0} users · flagged ${data.flagged ?? 0}.`
      );
      void refreshDistribution();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed.";
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Fraud alerts
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Behavioural risk scoring + heuristic patterns. Updates live as the
            engine flags users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (alerts.length === 0) {
                toast.error("No fraud alerts to export.");
                return;
              }
              const headers = ["Alert ID", "User Name", "User ID", "Risk Score", "Detected Pattern", "Status", "Date"];
              const rows = alerts.map((a) => [
                a.id,
                a.userName,
                a.userId,
                a.riskScore,
                a.detectedPattern,
                a.status,
                new Date(a.createdAt).toISOString(),
              ]);
              const csv = buildCsvString(headers, rows);
              downloadCsv(`chainwork-fraud-alerts-${tab}-${Date.now()}.csv`, csv);
              toast.success("Fraud alerts exported to CSV.");
            }}
            disabled={loading || alerts.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void runScan()}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Scan now
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Open alerts"
          value={openAlerts.length}
          danger={openAlerts.length > 0}
        />
        <StatTile
          label="Avg risk score"
          value={
            distribution
              ? Math.round(distribution.averageScore)
              : "—"
          }
        />
        <StatTile
          label="Flagged this week"
          value={recentAlertsCount}
        />
        <StatTile
          // Placeholder until we track dismissed/confirmed history over time.
          label="False positive rate"
          value="3.2%"
          subtle="Placeholder · needs ≥ 30 resolved alerts"
        />
      </div>

      {distribution ? (
        <RiskDistributionCard distribution={distribution} />
      ) : (
        <Skeleton className="h-40" />
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="max-w-full overflow-x-auto touch-scroll">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-72" />
      ) : alerts.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-foreground/60">
          {tab === "open"
            ? "No open alerts. Clean slate."
            : `No ${tab} alerts.`}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Risk score</TableHead>
                  <TableHead>Detected pattern</TableHead>
                  <TableHead>Detected at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedAlerts.map((alert) => {
                  const patterns = alert.detectedPattern.split(" · ");
                  const visible = patterns.slice(0, 2).join(" · ");
                  const extra = Math.max(patterns.length - 2, 0);
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                              {initials(alert.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {alert.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RiskBar score={alert.riskScore} />
                      </TableCell>
                      <TableCell className="max-w-[320px] text-xs text-foreground/70">
                        <span className="line-clamp-2">
                          {visible}
                          {extra > 0 ? ` · +${extra} more` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/60">
                        {formatRelativeTime(alert.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={alert.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewing(alert)}
                          >
                            View
                          </Button>
                          {alert.status === "open" ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  void handleQuickStatus(
                                    alert.id,
                                    "dismissed",
                                    "Dismissed."
                                  )
                                }
                              >
                                Dismiss
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  void handleQuickStatus(
                                    alert.id,
                                    "confirmed",
                                    "Confirmed. User score set to 100."
                                  )
                                }
                              >
                                Confirm
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCard>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={alerts.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {reviewing ? (
        <ReviewSlideOver
          alert={reviewing}
          onClose={() => setReviewing(null)}
        />
      ) : null}
    </div>
  );
}

async function handleQuickStatus(
  alertId: string,
  status: FraudAlertStatus,
  successMsg: string
) {
  try {
    await updateFraudAlertStatus({ alertId, status });
    toast.success(successMsg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not update alert.";
    toast.error(msg);
  }
}

// ───── stat tiles ─────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: number | string;
  danger?: boolean;
  subtle?: string;
}

function StatTile({ label, value, danger = false, subtle }: StatTileProps) {
  return (
    <GlassCard
      className={cn(
        "p-5",
        danger && "border-destructive/40 bg-destructive/[0.04]"
      )}
    >
      <div className="text-xs uppercase tracking-wider text-foreground/60">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold">
        {typeof value === "number" ? (
          <GradientText>{value.toLocaleString()}</GradientText>
        ) : (
          <GradientText>{value}</GradientText>
        )}
      </div>
      {subtle ? (
        <div className="mt-1 text-[11px] text-foreground/40">{subtle}</div>
      ) : null}
    </GlassCard>
  );
}

// ───── distribution chart ─────────────────────────────────────────────────────

function RiskDistributionCard({ distribution }: { distribution: RiskDistribution }) {
  const items: Array<{ bucket: RiskBucket; count: number }> = [
    { bucket: "low", count: distribution.low },
    { bucket: "medLow", count: distribution.medLow },
    { bucket: "medHigh", count: distribution.medHigh },
    { bucket: "high", count: distribution.high },
  ];
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Risk distribution</h2>
        <span className="text-xs text-foreground/50">
          {distribution.total} users
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {items.map(({ bucket, count }) => (
          <div key={bucket} className="grid grid-cols-[200px_1fr_40px] items-center gap-3">
            <span className="text-xs text-foreground/70">
              {BUCKET_LABEL[bucket]}
            </span>
            <svg
              role="img"
              aria-label={`${BUCKET_LABEL[bucket]}: ${count} users`}
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              className="h-2.5 w-full"
            >
              <rect
                x={0}
                y={0}
                width={100}
                height={8}
                rx={4}
                ry={4}
                fill="rgba(120,120,120,0.12)"
              />
              <rect
                x={0}
                y={0}
                width={(count / max) * 100}
                height={8}
                rx={4}
                ry={4}
                fill={BUCKET_COLOR[bucket]}
              />
            </svg>
            <span className="text-right text-xs font-mono text-foreground/80">
              {count}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function RiskBar({ score }: { score: number }) {
  const bucket = bucketFromScore(score);
  const color = BUCKET_COLOR[bucket];
  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        className="h-1.5 w-24"
        role="img"
        aria-label={`Risk score ${score}`}
      >
        <rect
          x={0}
          y={0}
          width={100}
          height={6}
          rx={3}
          ry={3}
          fill="rgba(120,120,120,0.12)"
        />
        <rect
          x={0}
          y={0}
          width={Math.min(100, score)}
          height={6}
          rx={3}
          ry={3}
          fill={color}
        />
      </svg>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: `${color}26`,
          color,
          borderWidth: 1,
          borderColor: `${color}66`,
        }}
      >
        {score}
      </span>
    </div>
  );
}

// ───── status chip ────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<FraudAlertStatus, string> = {
  open: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  reviewed:
    "bg-[color:var(--azure-500)]/15 text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] border-[color:var(--azure-500)]/30",
  confirmed: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  dismissed:
    "bg-foreground/10 text-foreground/60 border-foreground/20",
};

function StatusChip({ status }: { status: FraudAlertStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize backdrop-blur-xl",
        STATUS_CHIP[status]
      )}
    >
      {status}
    </span>
  );
}

// ───── slide-over (Dialog substitute for shadcn Sheet) ───────────────────────

interface ReviewSlideOverProps {
  alert: SerializedFraudAlert;
  onClose: () => void;
}

function ReviewSlideOver({ alert, onClose }: ReviewSlideOverProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadProfileAndTimeline(alert.userId)
      .then(({ user: u, events: e }) => {
        if (cancelled) return;
        setUser(u);
        setEvents(e);
      })
      .catch(() => {
        /* swallow; loading flips off below */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [alert.userId]);

  async function dismiss() {
    setActing("dismiss");
    try {
      await updateFraudAlertStatus({ alertId: alert.id, status: "dismissed" });
      toast.success("Alert dismissed.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not dismiss.";
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  async function restrict() {
    setActing("restrict");
    try {
      await restrictUserAccount(alert.userId);
      await updateFraudAlertStatus({ alertId: alert.id, status: "confirmed" });
      toast.success("Account restricted.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not restrict.";
      toast.error(msg);
    } finally {
      setActing(null);
    }
  }

  const patterns = alert.detectedPattern.split(" · ").filter(Boolean);

  return (
    <Dialog open onOpenChange={(o) => (!acting && !o ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            Risk review · {alert.userName}
          </DialogTitle>
          <DialogDescription>
            Triggered {formatRelativeTime(alert.createdAt)} based on behavioural
            signals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
          <div className="space-y-3">
            <GlassCard className="p-4 space-y-2 text-sm">
              {loading || !user ? (
                <Skeleton className="h-24" />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-foreground/60">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-foreground/50">Role:</span>{" "}
                      <span className="capitalize">{user.role}</span>
                    </div>
                    <div>
                      <span className="text-foreground/50">KYC:</span>{" "}
                      <span className="capitalize">{user.kycStatus}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-foreground/50">Member since:</span>{" "}
                      {formatDateShort(
                        (
                          user.createdAt as unknown as { _seconds?: number }
                        )._seconds
                          ? (user.createdAt as unknown as { _seconds: number })
                              ._seconds * 1000
                          : 0
                      )}
                    </div>
                  </div>
                </>
              )}
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold">Detected patterns</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {patterns.length === 0 ? (
                  <span className="text-xs text-foreground/60">
                    No patterns recorded.
                  </span>
                ) : (
                  patterns.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
                    >
                      <XCircle className="size-3" />
                      {p}
                    </span>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold">Activity timeline</h3>
              {loading ? (
                <Skeleton className="mt-2 h-32" />
              ) : events.length === 0 ? (
                <p className="mt-2 text-xs text-foreground/60">
                  No recent activity captured.
                </p>
              ) : (
                <ul className="mt-2 space-y-2 text-xs">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-[color:var(--azure-500)]" />
                      <div>
                        <div className="font-medium">{e.label}</div>
                        <div className="text-foreground/50">
                          {formatRelativeTime(e.timestamp)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          <div className="flex flex-col items-center justify-start gap-3">
            <ScoreGauge score={alert.riskScore} />
            <div className="text-center text-[11px] uppercase tracking-wider text-foreground/50">
              Risk score
            </div>
            <div className="mt-4 flex w-full flex-col gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => void restrict()}
                disabled={!!acting}
              >
                {acting === "restrict" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldOff className="size-4" />
                )}
                Restrict account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void dismiss()}
                disabled={!!acting}
              >
                {acting === "dismiss" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                Dismiss alert
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const bucket = bucketFromScore(score);
  const color = BUCKET_COLOR[bucket];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * circumference;
  return (
    <svg
      role="img"
      aria-label={`Risk score gauge ${score} of 100`}
      width={120}
      height={120}
      viewBox="0 0 100 100"
    >
      <circle
        cx={50}
        cy={50}
        r={radius}
        fill="none"
        stroke="rgba(120,120,120,0.15)"
        strokeWidth={10}
      />
      <circle
        cx={50}
        cy={50}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text
        x={50}
        y={56}
        textAnchor="middle"
        className="font-semibold"
        fontSize={22}
        fill="currentColor"
      >
        {score}
      </text>
    </svg>
  );
}

// ───── server-data loader for the slide-over ─────────────────────────────────

interface TimelineEvent {
  label: string;
  timestamp: number;
}

async function loadProfileAndTimeline(
  userId: string
): Promise<{ user: User | null; events: TimelineEvent[] }> {
  const userSnap = await getDoc(doc(db, COLS.users, userId));
  const user = userSnap.exists() ? (userSnap.data() as User) : null;

  const [gigsSnap, contractsF, contractsC, reviewsR, reviewsG] = await Promise.all([
    getDocs(
      query(
        collection(db, COLS.gigs),
        where("freelancerId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(20)
      )
    ).catch(() => null),
    getDocs(
      query(
        collection(db, COLS.contracts),
        where("freelancerId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(20)
      )
    ).catch(() => null),
    getDocs(
      query(
        collection(db, COLS.contracts),
        where("clientId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(20)
      )
    ).catch(() => null),
    getDocs(
      query(
        collection(db, COLS.reviews),
        where("revieweeId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(20)
      )
    ).catch(() => null),
    getDocs(
      query(
        collection(db, COLS.reviews),
        where("reviewerId", "==", userId),
        orderBy("createdAt", "desc"),
        fsLimit(20)
      )
    ).catch(() => null),
  ]);

  const events: TimelineEvent[] = [];
  const toMs = (raw: unknown): number => {
    if (!raw || typeof raw !== "object") return 0;
    const r = raw as { _seconds?: number; seconds?: number };
    return ((r._seconds ?? r.seconds ?? 0) as number) * 1000;
  };

  gigsSnap?.docs.forEach((d) => {
    const data = d.data();
    events.push({
      label: `Gig created · ${data.title ?? "untitled"}`,
      timestamp: toMs(data.createdAt),
    });
  });
  contractsF?.docs.forEach((d) => {
    const data = d.data();
    events.push({
      label: `Contract as freelancer · ${data.title ?? "—"}`,
      timestamp: toMs(data.createdAt),
    });
  });
  contractsC?.docs.forEach((d) => {
    const data = d.data();
    events.push({
      label: `Contract as client · ${data.title ?? "—"}`,
      timestamp: toMs(data.createdAt),
    });
  });
  reviewsR?.docs.forEach((d) => {
    const data = d.data();
    events.push({
      label: `Review received from ${data.reviewerName ?? "—"}`,
      timestamp: toMs(data.createdAt),
    });
  });
  reviewsG?.docs.forEach((d) => {
    const data = d.data();
    events.push({
      label: `Review given to ${data.revieweeName ?? "—"}`,
      timestamp: toMs(data.createdAt),
    });
  });

  events.sort((a, b) => b.timestamp - a.timestamp);
  return { user, events: events.slice(0, 20) };
}
