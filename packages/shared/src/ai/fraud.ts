import type {
  SerializedContract,
  SerializedGig,
  SerializedReview,
  SerializedUser,
} from "../schema";

export interface FraudSignal {
  name: string;
  weight: number;
  value: number;
  detected: boolean;
  description?: string;
}

export interface FraudScore {
  userId: string;
  totalScore: number;
  signals: FraudSignal[];
  detectedPatterns: string[];
}

export interface FraudContext {
  gigs: SerializedGig[];
  contractsAsFreelancer: SerializedContract[];
  contractsAsClient: SerializedContract[];
  reviewsReceived: SerializedReview[];
  reviewsGiven: SerializedReview[];
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

function daysSince(ms: number): number {
  if (!ms) return Number.POSITIVE_INFINITY;
  return (Date.now() - ms) / DAY;
}

function evalAccountAge(user: SerializedUser): { value: number; pattern: string | null } {
  if (!user.createdAt) return { value: 0, pattern: null };
  const hours = (Date.now() - user.createdAt) / HOUR;
  if (hours < 24) return { value: 1.0, pattern: "Account created less than 24 hours ago" };
  if (hours < 72) return { value: 0.5, pattern: "Account created less than 3 days ago" };
  if (hours < 168) return { value: 0.2, pattern: "Account created less than a week ago" };
  return { value: 0, pattern: null };
}

function evalRapidGigCreation(gigs: SerializedGig[]): { value: number; pattern: string | null } {
  const recent = gigs.filter((g) => Date.now() - g.createdAt < DAY);
  let rapidScore = 0;
  let pattern: string | null = null;
  if (recent.length >= 5) { rapidScore = 1.0; pattern = `Created ${recent.length} gigs in 24 hours`; }
  else if (recent.length >= 3) { rapidScore = 0.85; pattern = `Created ${recent.length} gigs in 24 hours`; }
  if (gigs.length >= 2) {
    const avgLen = gigs.reduce((acc, g) => acc + (g.description?.length ?? 0), 0) / gigs.length;
    if (avgLen < 80) {
      rapidScore = Math.min(1.0, rapidScore + 0.15);
      pattern = pattern ? `${pattern} with very short descriptions` : "Very short gig descriptions across multiple gigs";
    }
  }
  return { value: rapidScore, pattern };
}

function evalCompletionRate(user: SerializedUser, contracts: SerializedContract[]): { value: number; pattern: string | null } {
  if (user.role !== "freelancer") return { value: 0, pattern: null };
  if (contracts.length < 3) return { value: 0, pattern: null };
  const completed = contracts.filter((c) => c.status === "completed").length;
  const rate = completed / contracts.length;
  if (rate < 0.5) return { value: 0.8, pattern: `Low completion rate (${completed} of ${contracts.length} contracts)` };
  if (rate < 0.7) return { value: 0.4, pattern: `Below-average completion rate (${completed} of ${contracts.length})` };
  return { value: 0, pattern: null };
}

function evalReviewPattern(ctx: FraudContext): { value: number; pattern: string | null } {
  const recentReceived = ctx.reviewsReceived.filter((r) => Date.now() - r.createdAt < DAY);
  if (recentReceived.length >= 5) return { value: 0.9, pattern: `${recentReceived.length} reviews received in 24 hours (possible review bombing)` };
  if (ctx.reviewsGiven.length >= 3 && ctx.reviewsGiven.every((r) => r.rating === 5)) {
    return { value: 0.5, pattern: `All ${ctx.reviewsGiven.length} reviews given are 5-star (possible sock puppet)` };
  }
  return { value: 0, pattern: null };
}

function evalDisputeRate(ctx: FraudContext): { value: number; pattern: string | null } {
  const all = [...ctx.contractsAsFreelancer, ...ctx.contractsAsClient];
  if (all.length === 0) return { value: 0, pattern: null };
  const bad = all.filter((c) => c.status === "disputed" || c.status === "cancelled").length;
  const ratio = bad / all.length;
  if (ratio > 0.5) return { value: 0.9, pattern: `Very high dispute rate (${bad} of ${all.length} contracts)` };
  if (ratio > 0.3) return { value: 0.6, pattern: `High dispute rate (${bad} of ${all.length} contracts)` };
  if (ratio > 0.15) return { value: 0.3, pattern: `Elevated dispute rate (${bad} of ${all.length} contracts)` };
  return { value: 0, pattern: null };
}

function evalEmptyProfile(user: SerializedUser): { value: number; pattern: string | null } {
  const hasBio = !!(user.bio && user.bio.trim().length > 0);
  const hasSkills = user.role === "freelancer" ? (user.skills?.length ?? 0) > 0 : true;
  const hasAvatar = !!user.profileImage;
  const missing = [hasBio, hasSkills, hasAvatar].filter((x) => !x).length;
  if (missing === 3) return { value: 1.0, pattern: "Completely empty profile (no bio, skills, or photo)" };
  if (missing === 2) return { value: 0.5, pattern: "Mostly empty profile (missing 2 of bio/skills/photo)" };
  if (missing === 1) return { value: 0.1, pattern: "Incomplete profile (missing 1 of bio/skills/photo)" };
  return { value: 0, pattern: null };
}

function evalRoundPricing(gigs: SerializedGig[]): { value: number; pattern: string | null } {
  const recent = gigs.filter((g) => Date.now() - g.createdAt < 7 * DAY);
  if (recent.length < 2) return { value: 0, pattern: null };
  const roundCount = recent.filter((g) => g.pricingBasic % 100 === 0).length;
  if (roundCount / recent.length > 0.8) return { value: 0.85, pattern: "Most recent gigs use round-number pricing (e.g. $100, $500)" };
  return { value: 0, pattern: null };
}

function evalUnusualHours(gigs: SerializedGig[], contractsF: SerializedContract[], contractsC: SerializedContract[]): { value: number; pattern: string | null } {
  const stamps: number[] = [
    ...gigs.map((g) => g.createdAt),
    ...contractsF.map((c) => c.createdAt),
    ...contractsC.map((c) => c.createdAt),
  ].filter((t) => t > 0);
  if (stamps.length < 5) return { value: 0, pattern: null };
  let maxIn = 0;
  for (const t of stamps) {
    const count = stamps.filter((u) => u >= t && u - t < 2 * HOUR).length;
    if (count > maxIn) maxIn = count;
  }
  if (maxIn / stamps.length >= 0.9) return { value: 0.5, pattern: `${maxIn} of ${stamps.length} actions occurred in a single 2-hour window` };
  return { value: 0, pattern: null };
}

const WEIGHTS = {
  ACCOUNT_AGE_RISK: 0.15,
  RAPID_GIG_CREATION: 0.3,
  LOW_COMPLETION_RATE: 0.1,
  SUSPICIOUS_REVIEW_PATTERN: 0.05,
  DISPUTE_RATE: 0.1,
  EMPTY_PROFILE: 0.2,
  ROUND_NUMBER_PRICING: 0.1,
  UNUSUAL_HOURS: 0,
} as const;

const DETECTED_THRESHOLD = 0.3;

export function computeFraudScore(user: SerializedUser, context: FraudContext): FraudScore {
  const evaluations: Array<{ name: keyof typeof WEIGHTS; result: { value: number; pattern: string | null } }> = [
    { name: "ACCOUNT_AGE_RISK", result: evalAccountAge(user) },
    { name: "RAPID_GIG_CREATION", result: evalRapidGigCreation(context.gigs) },
    { name: "LOW_COMPLETION_RATE", result: evalCompletionRate(user, context.contractsAsFreelancer) },
    { name: "SUSPICIOUS_REVIEW_PATTERN", result: evalReviewPattern(context) },
    { name: "DISPUTE_RATE", result: evalDisputeRate(context) },
    { name: "EMPTY_PROFILE", result: evalEmptyProfile(user) },
    { name: "ROUND_NUMBER_PRICING", result: evalRoundPricing(context.gigs) },
    { name: "UNUSUAL_HOURS", result: evalUnusualHours(context.gigs, context.contractsAsFreelancer, context.contractsAsClient) },
  ];

  const signals: FraudSignal[] = evaluations.map(({ name, result }) => ({
    name,
    weight: WEIGHTS[name],
    value: result.value,
    detected: result.value > DETECTED_THRESHOLD,
    description: result.pattern ?? undefined,
  }));

  const weightedSum = signals.reduce((acc, s) => acc + s.value * s.weight, 0);
  const totalScore = Math.round(weightedSum * 100);
  const detectedPatterns = signals
    .filter((s) => s.value > DETECTED_THRESHOLD && s.description)
    .map((s) => s.description!) as string[];

  return { userId: user.uid, totalScore, signals, detectedPatterns };
}

export type RiskBucket = "low" | "medLow" | "medHigh" | "high";

export function bucketFromScore(score: number): RiskBucket {
  if (score < 20) return "low";
  if (score < 50) return "medLow";
  if (score < 70) return "medHigh";
  return "high";
}

export const BUCKET_LABEL: Record<RiskBucket, string> = {
  low: "Low (0–19)",
  medLow: "Medium-low (20–49)",
  medHigh: "Medium-high (50–69)",
  high: "High (70–100)",
};

export const BUCKET_COLOR: Record<RiskBucket, string> = {
  low: "#10b981",
  medLow: "#eab308",
  medHigh: "#f97316",
  high: "#ef4444",
};
