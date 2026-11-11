import { z } from "zod";

export const CRYPTO_CURRENCIES = ["ETH", "BTC", "USDC", "USDT"] as const;
export const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export type CryptoCurrency = (typeof CRYPTO_CURRENCIES)[number];
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

export const FIAT_LABELS: Record<FiatCurrency, string> = { USD: "US Dollar", EUR: "Euro", GBP: "British Pound", CAD: "Canadian Dollar", AUD: "Australian Dollar" };
export const CRYPTO_LABELS: Record<CryptoCurrency, string> = { ETH: "Ethereum", BTC: "Bitcoin", USDC: "USD Coin", USDT: "Tether" };

export const blockchainPaymentSchema = z.object({
  method: z.literal("blockchain"),
  walletAddress: z.string().min(26, "Enter a valid wallet address").max(100, "Wallet address too long"),
  currency: z.enum(CRYPTO_CURRENCIES),
  amountUsd: z.number().positive("Amount must be positive"),
  contractId: z.string().min(1),
  milestoneId: z.string().optional(),
});
export type BlockchainPaymentInput = z.infer<typeof blockchainPaymentSchema>;

export const fiatPaymentSchema = z.object({
  method: z.literal("fiat"),
  currency: z.enum(FIAT_CURRENCIES),
  amountUsd: z.number().positive("Amount must be positive"),
  stripePaymentMethodId: z.string().min(1, "Payment method required"),
  contractId: z.string().min(1),
  milestoneId: z.string().optional(),
});
export type FiatPaymentInput = z.infer<typeof fiatPaymentSchema>;

export const paymentIntentSchema = z.discriminatedUnion("method", [blockchainPaymentSchema, fiatPaymentSchema]);
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;

export const cryptoConversionSchema = z.object({
  fromCurrency: z.enum(FIAT_CURRENCIES),
  toCurrency: z.enum(CRYPTO_CURRENCIES),
  amount: z.number().positive("Amount must be positive").max(1_000_000, "Amount too large"),
});
export type CryptoConversionInput = z.infer<typeof cryptoConversionSchema>;

export interface CryptoConversionResult {
  fromCurrency: FiatCurrency;
  toCurrency: CryptoCurrency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  rateTimestamp: string;
}
