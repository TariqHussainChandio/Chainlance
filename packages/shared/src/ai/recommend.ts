import type { SerializedContract, SerializedGig, SerializedUser } from "../schema";
import { buildIdf, cosineSimilarity, tfidfVector, tokenize } from "./text-utils";

export interface RankedGig {
  gig: SerializedGig;
  score: number;
  explanations: string[];
}

export interface RankOptions {
  limit?: number;
  minScore?: number;
}

interface RankContext {
  pastContracts?: SerializedContract[];
}

const DEFAULT_LIMIT = 24;

function buildUserQuery(user: SerializedUser, ctx: RankContext): string {
  const parts: string[] = [];
  if (user.bio) parts.push(user.bio);
  if (user.skills && user.skills.length > 0) parts.push(user.skills.join(" "));
  if (user.role === "client" && ctx.pastContracts && ctx.pastContracts.length > 0) {
    parts.push(ctx.pastContracts.map((c) => c.title).join(" "));
  }
  return parts.join(" ");
}

function gigCorpusText(gig: SerializedGig): string {
  return [gig.title, gig.description, gig.category, gig.skills.join(" ")].join(" ");
}

function daysSince(ms: number): number {
  if (!ms) return Number.POSITIVE_INFINITY;
  return (Date.now() - ms) / 86_400_000;
}

function skillOverlapRatio(userSkills: string[] | undefined, gigSkills: string[]): number {
  if (!userSkills || userSkills.length === 0) return 0;
  const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const overlap = gigSkills.filter((s) => userSet.has(s.toLowerCase())).length;
  return overlap / Math.max(userSkills.length, 1);
}

function rankColdStart(gigs: SerializedGig[], limit: number): RankedGig[] {
  const ranked = gigs.map((gig) => {
    const rating = (gig.freelancerRating ?? 0) / 5;
    const recency = Math.exp(-daysSince(gig.createdAt) / 30);
    const score = Math.max(0.05, rating * recency);
    return { gig, score, explanations: ["Popular right now"] };
  });
  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}

function userHasAnySignal(user: SerializedUser, ctx: RankContext): boolean {
  const bio = user.bio?.trim() ?? "";
  const skills = user.skills ?? [];
  if (bio.length > 0) return true;
  if (skills.length > 0) return true;
  if (user.role === "client") return (ctx.pastContracts?.length ?? 0) > 0;
  return false;
}

export function rankGigsForUser(
  user: SerializedUser,
  gigs: SerializedGig[],
  opts: RankOptions = {},
  ctx: RankContext = {}
): RankedGig[] {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const minScore = opts.minScore ?? 0;

  if (gigs.length === 0) return [];
  if (!userHasAnySignal(user, ctx)) return rankColdStart(gigs, limit);

  const userQuery = buildUserQuery(user, ctx);
  const gigTokens = gigs.map((g) => tokenize(gigCorpusText(g)));
  const idf = buildIdf(gigTokens);
  const userVec = tfidfVector(tokenize(userQuery), idf);

  const ranked: RankedGig[] = gigs.map((gig, i) => {
    const gigVec = tfidfVector(gigTokens[i]!, idf);
    const sSem = cosineSimilarity(userVec, gigVec);
    const ratingScore = (gig.freelancerRating ?? 0) / 5;
    const recencyScore = Math.exp(-daysSince(gig.createdAt) / 30);
    const skillOverlap = skillOverlapRatio(user.skills, gig.skills);

    const score = 0.45 * sSem + 0.25 * skillOverlap + 0.2 * ratingScore + 0.1 * recencyScore;

    const explanations: string[] = [];
    if (skillOverlap > 0.5) explanations.push("Matches your skills");
    if (ratingScore > 0.85) explanations.push("Highly rated");
    if (recencyScore > 0.7) explanations.push("Recently posted");
    if (sSem > 0.4) explanations.push("Matches your interests");

    return { gig, score, explanations: explanations.slice(0, 3) };
  });

  return ranked.filter((r) => r.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit);
}
