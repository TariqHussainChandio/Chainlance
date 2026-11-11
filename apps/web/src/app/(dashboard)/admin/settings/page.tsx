"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Cog,
  Cpu,
  Loader2,
  Settings2,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { clearDismissedFraudAlerts } from "@/app/actions/admin-maintenance";
import { runFraudCheckOnAllUsers } from "@/app/actions/fraud";
import { PLATFORM_FEE_PERCENTAGE } from "@/lib/payment/platform-fees";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isSuperAdmin, getAdminRoleLabel } from "@/lib/admin-permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";

export default function AdminSettingsPage() {
  const { user: me } = useCurrentUser();
  const isSuper = isSuperAdmin(me);

  const [scanBusy, setScanBusy] = React.useState(false);
  const [clearBusy, setClearBusy] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

  async function rescanAll() {
    setScanBusy(true);
    try {
      const { scanned, flagged } = await runFraudCheckOnAllUsers();
      toast.success(
        `Scanned ${scanned} users · flagged ${flagged} (score ≥ threshold).`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed.";
      toast.error(msg);
    } finally {
      setScanBusy(false);
    }
  }

  async function doClearDismissed() {
    setConfirmClear(false);
    setClearBusy(true);
    try {
      const { deleted } = await clearDismissedFraudAlerts();
      toast.success(`Cleared ${deleted} dismissed alert${deleted === 1 ? "" : "s"}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Clear failed.";
      toast.error(msg);
    } finally {
      setClearBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Settings2 className="size-7 text-[color:var(--azure-500)]" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Platform configuration, admin role management, and system maintenance.
        </p>
      </div>

      {/* Admin Role & Privileges Overview Card */}
      <GlassCard className="space-y-4 p-5 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="size-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-semibold">Admin Security & Roles</h2>
              <p className="text-xs text-foreground/60">Current logged in admin: <span className="font-bold text-emerald-600 dark:text-emerald-400">{me?.name || "Admin"}</span> ({getAdminRoleLabel(me)})</p>
            </div>
          </div>

          {isSuper ? (
            <Link href="/admin/users">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                <UserPlus className="size-3.5" />
                Manage & Add Admins
              </Button>
            </Link>
          ) : (
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/30">
              Support Admin Mode
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[var(--glass-border)] bg-background/60 p-3">
            <span className="font-bold text-amber-600 dark:text-amber-400">👑 Super Admin Privileges:</span>
            <ul className="mt-1 list-disc pl-4 text-foreground/70 space-y-0.5">
              <li>Create & provision new Super / Support Admins</li>
              <li>Promote/demote existing users</li>
              <li>Run global system scans & maintenance</li>
              <li>Full access to all 9 admin modules</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-background/60 p-3">
            <span className="font-bold text-sky-600 dark:text-sky-400">🛡️ Support Admin Privileges:</span>
            <ul className="mt-1 list-disc pl-4 text-foreground/70 space-y-0.5">
              <li>Manage & resolve contract disputes</li>
              <li>Review KYC document submissions</li>
              <li>Inspect payment & escrow transaction logs</li>
              <li>Support users & run individual fraud checks</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/60">
          <Cog className="size-4" />
          Platform configuration
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <ConfigRow label="Platform fee" value={`${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% combined (${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% = 5% client + 10% freelancer)`} />
          <ConfigRow
            label="Demo mode"
            value={
              <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Active
              </span>
            }
          />
          <ConfigRow
            label="Escrow backend"
            value="Mock (Firestore-backed)"
          />
          <ConfigRow label="AI engine" value="Rule-based + TF-IDF" />
          <ConfigRow label="Auto-flag threshold" value="65" />
        </dl>
        <p className="border-t border-[var(--glass-border)] pt-3 text-xs text-foreground/60">
          Configuration changes require code deployment. Future
          enhancement: runtime config via Firestore.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/60">
          <Cpu className="size-4" />
          Admin actions
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void rescanAll()}
            disabled={scanBusy}
          >
            {scanBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            Rescan all users for fraud
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
            onClick={() => setConfirmClear(true)}
            disabled={clearBusy}
          >
            {clearBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Clear all dismissed fraud alerts
          </Button>
        </div>
        <p className="text-xs text-foreground/60">
          Rescan walks up to the first 100 users and recomputes their
          fraud score. Use after weight changes or seeding new test data.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/60">
          About
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <ConfigRow label="Version" value="ChainWork v1.0 — MVP" />
          <ConfigRow
            label="Built with"
            value="Next.js 16, Firebase, Cloudinary, TypeScript"
          />
        </dl>
        <div className="border-t border-[var(--glass-border)] pt-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
            <AlertTriangle className="size-3.5" />
            Known limitations
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/70">
            <li>Escrow is mocked (production: Solidity on Sepolia).</li>
            <li>
              Fraud detection uses rule-based scoring (production: ensemble
              ML).
            </li>
            <li>
              AI ranking via TF-IDF (production: matrix factorization).
            </li>
            <li>
              Real-time messaging via Firestore listeners (production:
              dedicated WebSocket service).
            </li>
          </ul>
        </div>
      </GlassCard>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogTitle>Clear all dismissed alerts?</DialogTitle>
          <DialogDescription>
            This permanently deletes every fraudAlerts doc with status
            &ldquo;dismissed&rdquo;. Confirmed and reviewed alerts are
            untouched.
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => void doClearDismissed()}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] py-1.5 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-foreground/60">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
