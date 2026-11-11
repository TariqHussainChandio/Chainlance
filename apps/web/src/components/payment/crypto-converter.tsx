"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";

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
import {
  CRYPTO_CURRENCIES,
  FIAT_CURRENCIES,
  FIAT_LABELS,
  CRYPTO_LABELS,
  type CryptoCurrency,
  type FiatCurrency,
  type CryptoConversionResult,
} from "@/lib/schemas/payment-schema";
import { cn } from "@/lib/utils";

export function CryptoConverter() {
  const [fromCurrency, setFromCurrency] = useState<FiatCurrency>("USD");
  const [toCurrency, setToCurrency] = useState<CryptoCurrency>("ETH");
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<CryptoConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchConversion = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: fromCurrency,
        to: toCurrency,
        amount: String(parsed),
      });
      const res = await fetch(`/api/payment/crypto-convert?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Conversion failed");
        setResult(null);
        return;
      }
      const data = (await res.json()) as CryptoConversionResult;
      setResult(data);
    } catch {
      setError("Unable to fetch conversion rate. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchConversion(), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchConversion]);

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Crypto Converter</h3>
        {loading && (
          <RefreshCw className="size-4 animate-spin text-[color:var(--azure-400)]" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        {/* From (fiat) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-foreground/60">
            You pay
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 flex-1 text-sm font-semibold"
              placeholder="Amount"
            />
            <Select
              value={fromCurrency}
              onValueChange={(v) => setFromCurrency(v as FiatCurrency)}
            >
              <SelectTrigger className="w-[90px] text-xs font-bold shrink-0">
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
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-end justify-center pb-2">
          <ArrowRight className="size-5 text-foreground/40" />
        </div>

        {/* To (crypto) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-foreground/60">
            You receive
          </Label>
          <div className="flex gap-2">
            <div
              className={cn(
                "min-w-0 flex-1 rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm font-bold",
                loading && "opacity-60"
              )}
            >
              {result ? result.toAmount.toFixed(8) : "—"}
            </div>
            <Select
              value={toCurrency}
              onValueChange={(v) => setToCurrency(v as CryptoCurrency)}
            >
              <SelectTrigger className="w-[90px] text-xs font-bold shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c} — {CRYPTO_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Rate info */}
      {result && !error && (
        <p className="text-xs text-foreground/60">
          1 {toCurrency} ≈ {result.rate.toLocaleString()} {fromCurrency} &nbsp;·&nbsp;
          Rate as of {new Date(result.rateTimestamp).toLocaleTimeString()}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <p className="text-[11px] text-foreground/40 italic">
        Indicative rates only. Final amounts depend on network conditions at the time of
        transaction.
      </p>
    </GlassCard>
  );
}
