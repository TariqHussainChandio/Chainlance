import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/firebase/server-auth";
import {
  cryptoConversionSchema,
  type CryptoConversionResult,
  type FiatCurrency,
  type CryptoCurrency,
} from "@/lib/schemas/payment-schema";

/**
 * Hardcoded exchange rates (fiat per 1 crypto unit).
 * Rates as of 2026-10-14 — static, not auto-updated.
 */
const MOCK_RATES: Record<CryptoCurrency, Record<FiatCurrency, number>> = {
  BTC:  { USD: 67500,  EUR: 62100,  GBP: 53325, CAD: 93150,  AUD: 104625 },
  ETH:  { USD: 3450,   EUR: 3174,   GBP: 2726,  CAD: 4761,   AUD: 5348   },
  USDC: { USD: 1.00,   EUR: 0.92,   GBP: 0.79,  CAD: 1.38,   AUD: 1.55   },
  USDT: { USD: 1.00,   EUR: 0.92,   GBP: 0.79,  CAD: 1.38,   AUD: 1.55   },
};

/**
 * GET /api/payment/crypto-convert?from=USD&to=ETH&amount=1000
 *
 * Returns how much crypto the user gets for their fiat amount.
 * Requires a valid session.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw = {
    fromCurrency: searchParams.get("from"),
    toCurrency: searchParams.get("to"),
    amount: Number(searchParams.get("amount")),
  };

  const parsed = cryptoConversionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
      { status: 400 }
    );
  }

  const { fromCurrency, toCurrency, amount } = parsed.data;
  const ratePerCrypto = MOCK_RATES[toCurrency][fromCurrency];

  if (!ratePerCrypto) {
    return NextResponse.json(
      { error: "Exchange rate not available for this pair" },
      { status: 422 }
    );
  }

  const toAmount = amount / ratePerCrypto;

  const result: CryptoConversionResult = {
    fromCurrency,
    toCurrency,
    fromAmount: amount,
    toAmount: parseFloat(toAmount.toFixed(8)),
    rate: ratePerCrypto,
    rateTimestamp: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
