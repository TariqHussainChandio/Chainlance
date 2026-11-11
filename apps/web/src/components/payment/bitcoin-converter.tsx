"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FiatCurrency } from "@/lib/schemas/payment-schema";

/**
 * Hardcoded BTC exchange rates (fiat per 1 BTC).
 * Rates as of 2026-10-14 — static, not auto-updated.
 */
const BTC_RATES: Record<FiatCurrency, number> = {
  USD: 67500,
  EUR: 62100,
  GBP: 53325,
  CAD: 93150,
  AUD: 104625,
};

const FIAT_SYMBOLS: Record<FiatCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
};

const FIAT_LABELS: Record<FiatCurrency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
};

const FIAT_CURRENCIES: FiatCurrency[] = ["USD", "EUR", "GBP", "CAD", "AUD"];

type Direction = "fiat-to-btc" | "btc-to-fiat";

export function BitcoinConverter() {
  const [direction, setDirection] = useState<Direction>("fiat-to-btc");
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>("USD");
  const [inputValue, setInputValue] = useState("100");

  const rate = BTC_RATES[fiatCurrency];
  const parsed = parseFloat(inputValue);
  const valid = !Number.isNaN(parsed) && parsed > 0;

  let result = "";
  let resultLabel = "";

  if (valid) {
    if (direction === "fiat-to-btc") {
      const btc = parsed / rate;
      result = btc < 0.001
        ? btc.toFixed(8)
        : btc.toFixed(6);
      resultLabel = "BTC";
    } else {
      const fiat = parsed * rate;
      result = fiat.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      resultLabel = fiatCurrency;
    }
  }

  function swap() {
    setDirection((d) => d === "fiat-to-btc" ? "btc-to-fiat" : "fiat-to-btc");
    setInputValue("");
  }

  const isFromFiat = direction === "fiat-to-btc";

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">Bitcoin Converter</h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            Rates as of Oct 14, 2026 &mdash; static
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-500">
          ₿ BTC
        </span>
      </div>

      <div className="space-y-3">
        {/* From */}
        <div>
          <Label className="text-xs text-foreground/60 uppercase font-semibold">
            {isFromFiat ? "You send" : "You send (BTC)"}
          </Label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              {isFromFiat && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
                  {FIAT_SYMBOLS[fiatCurrency]}
                </span>
              )}
              {!isFromFiat && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-orange-400">
                  ₿
                </span>
              )}
              <Input
                type="number"
                min="0"
                step="any"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isFromFiat ? "0.00" : "0.00000000"}
                className={isFromFiat ? "pl-7 font-semibold" : "pl-7 font-mono font-semibold"}
              />
            </div>

            {isFromFiat ? (
              <Select
                value={fiatCurrency}
                onValueChange={(v) => setFiatCurrency(v as FiatCurrency)}
              >
                <SelectTrigger className="w-[110px] shrink-0 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIAT_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c} — {FIAT_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex w-[110px] shrink-0 items-center justify-center rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-xs font-bold text-orange-400">
                BTC
              </div>
            )}
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={swap}
            className="gap-1.5 text-xs"
          >
            <ArrowUpDown className="size-3.5" />
            Swap direction
          </Button>
        </div>

        {/* To */}
        <div>
          <Label className="text-xs text-foreground/60 uppercase font-semibold">
            {isFromFiat ? "You receive (BTC)" : "You receive"}
          </Label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              {!isFromFiat && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
                  {FIAT_SYMBOLS[fiatCurrency]}
                </span>
              )}
              {isFromFiat && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-orange-400">
                  ₿
                </span>
              )}
              <div className="flex h-9 items-center rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-7 pr-3 font-semibold text-sm text-foreground/90">
                {valid ? result : <span className="text-foreground/30">—</span>}
              </div>
            </div>

            {!isFromFiat ? (
              <Select
                value={fiatCurrency}
                onValueChange={(v) => setFiatCurrency(v as FiatCurrency)}
              >
                <SelectTrigger className="w-[110px] shrink-0 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIAT_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c} — {FIAT_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex w-[110px] shrink-0 items-center justify-center rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-xs font-bold text-orange-400">
                BTC
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate line */}
      <div className="flex items-center justify-between rounded-lg bg-orange-500/8 px-3 py-2 text-xs">
        <span className="text-foreground/60">1 BTC</span>
        <span className="font-bold text-orange-400">
          {FIAT_SYMBOLS[fiatCurrency]}
          {rate.toLocaleString("en-US")} {fiatCurrency}
        </span>
      </div>

      {valid && result && (
        <p className="text-xs text-foreground/50">
          {isFromFiat
            ? `${FIAT_SYMBOLS[fiatCurrency]}${parseFloat(inputValue).toLocaleString()} ${fiatCurrency} = ${result} BTC`
            : `${parseFloat(inputValue)} BTC = ${FIAT_SYMBOLS[fiatCurrency]}${result} ${fiatCurrency}`}
        </p>
      )}
    </GlassCard>
  );
}
