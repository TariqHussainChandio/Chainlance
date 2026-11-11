"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bitcoin,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { SerializedUser } from "@/lib/firebase/schema";

// Standard Bitcoin constants
const SATOSHIS_PER_BTC = 100_000_000;
const DEFAULT_BTC_USD_RATE = 67500;

interface FeeOption {
  label: string;
  satPerVbyte: number;
  estBtc: number;
}

const NETWORK_FEES: Record<"economy" | "standard" | "priority", FeeOption> = {
  economy: { label: "Economy", satPerVbyte: 12, estBtc: 0.000024 },
  standard: { label: "Standard", satPerVbyte: 25, estBtc: 0.000050 },
  priority: { label: "Priority", satPerVbyte: 55, estBtc: 0.000110 },
};

interface BitcoinSidebarCalculatorProps {
  user?: SerializedUser;
  className?: string;
}

export function BitcoinSidebarCalculator({
  user,
  className,
}: BitcoinSidebarCalculatorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [usdAmount, setUsdAmount] = React.useState<string>("250");
  const [btcRate, setBtcRate] = React.useState<number>(DEFAULT_BTC_USD_RATE);
  const [selectedFee, setSelectedFee] = React.useState<"economy" | "standard" | "priority">("standard");
  const [copiedBtc, setCopiedBtc] = React.useState(false);
  const [copiedSats, setCopiedSats] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch or refresh current exchange rate
  const refreshRate = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/payment/crypto-convert?from=USD&to=BTC&amount=1000", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.rate && typeof data.rate === "number") {
          setBtcRate(data.rate);
        }
      }
    } catch {
      // Fallback silently to mock rate
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshRate();
  }, [refreshRate]);

  const numUsd = parseFloat(usdAmount) || 0;
  const btcValue = numUsd > 0 && btcRate > 0 ? numUsd / btcRate : 0;
  const satoshis = Math.round(btcValue * SATOSHIS_PER_BTC);
  const networkFeeBtc = NETWORK_FEES[selectedFee].estBtc;
  const networkFeeUsd = networkFeeBtc * btcRate;
  const totalBtc = btcValue > 0 ? btcValue + networkFeeBtc : 0;

  function copyBtc() {
    if (totalBtc <= 0) return;
    navigator.clipboard.writeText(totalBtc.toFixed(8));
    setCopiedBtc(true);
    toast.success(`Copied ${totalBtc.toFixed(8)} BTC to clipboard!`);
    setTimeout(() => setCopiedBtc(false), 2000);
  }

  function copySats() {
    if (satoshis <= 0) return;
    navigator.clipboard.writeText(satoshis.toString());
    setCopiedSats(true);
    toast.success(`Copied ${satoshis.toLocaleString()} sats to clipboard!`);
    setTimeout(() => setCopiedSats(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/80 backdrop-blur-md transition-all duration-200 overflow-hidden text-xs shadow-sm",
        className
      )}
    >
      {/* Header / Toggle bar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-emerald-500/10 transition-colors group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_2px_10px_rgba(245,158,11,0.35)] shrink-0 group-hover:scale-105 transition-transform">
            <Bitcoin className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold text-foreground flex items-center gap-1.5 truncate">
              <span>BTC Calculator</span>
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[10px] text-foreground/60 truncate font-mono">
              1 BTC ≈ ${btcRate.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-foreground/50 group-hover:text-foreground">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {/* Expanded Calculator Panel */}
      {isOpen && (
        <div className="p-3.5 pt-0 space-y-3.5 border-t border-[var(--glass-border)]/60">
          {/* USD Input and Presets */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/60">
              <span>USD Amount ($)</span>
              <button
                type="button"
                onClick={refreshRate}
                className="hover:text-emerald-500 inline-flex items-center gap-1 text-[9px] lowercase font-normal transition-colors"
                title="Refresh exchange rate"
              >
                <RefreshCw className={cn("size-2.5", isRefreshing && "animate-spin")} />
                sync rate
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/50 font-bold text-xs">
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                placeholder="250"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-background/60 pl-7 pr-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-mono"
              />
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1 pt-1">
              {[50, 150, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUsdAmount(String(preset))}
                  className={cn(
                    "flex-1 py-1 rounded-md text-[10px] font-bold border transition-colors",
                    numUsd === preset
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "border-[var(--glass-border)] hover:bg-emerald-500/10 text-foreground/70"
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Calculated Result */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Coins className="size-3" />
                Bitcoin Payment
              </span>
              <button
                type="button"
                onClick={copyBtc}
                title="Copy Bitcoin Amount"
                className="p-1 rounded hover:bg-amber-500/20 text-foreground/70 hover:text-foreground transition-colors"
              >
                {copiedBtc ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>

            <div className="font-mono text-base font-extrabold text-foreground tracking-tight">
              {btcValue > 0 ? btcValue.toFixed(8) : "0.00000000"}{" "}
              <span className="text-amber-500 text-xs">BTC</span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono border-t border-amber-500/20 pt-1.5 text-foreground/70">
              <span>{satoshis.toLocaleString()} sats</span>
              <button
                type="button"
                onClick={copySats}
                className="text-[9px] hover:text-amber-500 transition-colors flex items-center gap-0.5"
              >
                {copiedSats ? "copied!" : "copy sats"}
              </button>
            </div>
          </div>

          {/* Bitcoin Network Fee Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-foreground/60">
              <span className="flex items-center gap-1">
                <Zap className="size-3 text-amber-500" />
                Miner Network Fee
              </span>
              <span className="font-mono text-[9px] text-foreground/60">
                +${networkFeeUsd.toFixed(2)} USD
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(["economy", "standard", "priority"] as const).map((tier) => {
                const opt = NETWORK_FEES[tier];
                const isSel = selectedFee === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedFee(tier)}
                    className={cn(
                      "flex flex-col items-center py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-all",
                      isSel
                        ? "border-amber-500/60 bg-amber-500/20 text-foreground font-bold shadow-xs"
                        : "border-[var(--glass-border)] text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[9px] font-mono opacity-70">
                      {opt.satPerVbyte} sat/vB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total Summary */}
          <div className="rounded-xl border border-[var(--glass-border)] bg-background/50 p-2 space-y-1 font-mono text-[10px]">
            <div className="flex justify-between text-foreground/60">
              <span>Platform Escrow Fee</span>
              <span className="text-emerald-500 font-bold">0.00% (Free)</span>
            </div>
            <div className="flex justify-between text-foreground/60">
              <span>Est. Network Fee</span>
              <span>{networkFeeBtc.toFixed(6)} BTC</span>
            </div>
            <div className="flex justify-between font-bold text-foreground border-t border-[var(--glass-border)] pt-1 text-xs">
              <span>Total Payable</span>
              <span className="text-amber-500">{totalBtc.toFixed(8)} BTC</span>
            </div>
          </div>

          {/* Action Button: Copy Exact BTC */}
          <button
            type="button"
            onClick={copyBtc}
            disabled={totalBtc <= 0}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold text-xs shadow-[0_2px_12px_rgba(245,158,11,0.3)] hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
          >
            {copiedBtc ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copiedBtc ? "Copied to Clipboard" : "Copy BTC Amount"}</span>
          </button>

          {/* Admin Authority Banner & Shortcut */}
          {user?.role === "admin" && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-extrabold text-[10px] uppercase tracking-wide">
                <ShieldAlert className="size-3 shrink-0" />
                <span>Admin Authority</span>
              </div>
              <p className="text-[10px] text-foreground/75 leading-tight">
                You have platform authority to review, hold, or authorize payments to go forward.
              </p>
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline pt-0.5"
              >
                Go to Payment Authorization Queue ↗
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
