import type { Company, Event, Product } from "@prisma/client";
import { ISSUE_TAGS, getEventCategoryLabel, getEventCategoryTags } from "./tags";

function tagLabel(code: string): string {
  return ISSUE_TAGS.find((t) => t.code === code)?.label ?? code;
}

// 仕様書 STEP3「営業先を優先順位化」の重み付け。
export const SCORE_WEIGHTS = {
  freshness: 0.3,
  match: 0.4,
  profile: 0.2,
  history: 0.1,
} as const;

const FRESHNESS_DECAY_DAYS = 90;

export type ScoreBreakdown = {
  score: number;
  freshnessScore: number;
  matchScore: number;
  profileScore: number;
  historyScore: number;
  reason: string;
  bestEvent: Event | null;
};

export type HistorySignal = "NONE" | "WON" | "RECENT_LOST" | "IN_CONTACT";

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function computeFreshness(event: Event | null, now: Date): number {
  if (!event) return 0;
  const days = daysBetween(now, event.occurredAt);
  const score = 100 - (days / FRESHNESS_DECAY_DAYS) * 100;
  return Math.max(0, Math.min(100, score));
}

function computeMatch(
  event: Event | null,
  companyNeedTagCodes: string[],
  productTagCodes: string[]
): number {
  if (productTagCodes.length === 0) return 20; // 課題タグ未設定の商品は中立的な低めの一致度
  const impliedTags = event ? getEventCategoryTags(event.category) : [];
  const relevantTags = Array.from(new Set([...impliedTags, ...companyNeedTagCodes]));
  if (relevantTags.length === 0) return 0;
  const overlap = relevantTags.filter((t) => productTagCodes.includes(t)).length;
  if (overlap === 0) return 10;
  return Math.min(100, (overlap / productTagCodes.length) * 100 + overlap * 10);
}

function computeProfile(company: Company, product: Product): number {
  let score = 40; // 情報不足時のベースライン
  const industries = (product.targetIndustries ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (industries.length > 0) {
    score = industries.includes(company.industry) ? 70 : 20;
  }

  if (product.targetEmployeeMin != null || product.targetEmployeeMax != null) {
    const emp = company.employeeCount;
    if (emp == null) {
      score += 0;
    } else {
      const min = product.targetEmployeeMin ?? 0;
      const max = product.targetEmployeeMax ?? Number.MAX_SAFE_INTEGER;
      score += emp >= min && emp <= max ? 30 : -10;
    }
  } else {
    score += 15;
  }

  return Math.max(0, Math.min(100, score));
}

export function computeHistoryScore(signal: HistorySignal): number {
  switch (signal) {
    case "WON":
      return 90;
    case "RECENT_LOST":
      return 15;
    case "IN_CONTACT":
      return 40;
    case "NONE":
    default:
      return 50;
  }
}

function pickBestEvent(events: Event[], productTagCodes: string[]): Event | null {
  if (events.length === 0) return null;
  const ranked = [...events].sort((a, b) => {
    const overlapA = getEventCategoryTags(a.category).filter((t) =>
      productTagCodes.includes(t)
    ).length;
    const overlapB = getEventCategoryTags(b.category).filter((t) =>
      productTagCodes.includes(t)
    ).length;
    if (overlapA !== overlapB) return overlapB - overlapA;
    return b.occurredAt.getTime() - a.occurredAt.getTime();
  });
  return ranked[0];
}

function buildReason(
  company: Company,
  product: Product,
  event: Event | null,
  matchedTagLabels: string[],
  hasCompanyNeeds: boolean
): string {
  if (!event) {
    if (matchedTagLabels.length > 0) {
      return `${company.name}は「${matchedTagLabels.join("」「")}」のニーズを抱えており、${product.name}が解決できる可能性があります。`;
    }
    return `${company.name}に関する変化イベントは未検知のため、参考情報としての提案です。`;
  }
  const categoryLabel = getEventCategoryLabel(event.category);
  const tagPart =
    matchedTagLabels.length > 0
      ? `「${matchedTagLabels.join("」「")}」の課題を解決できる可能性があります。`
      : "貴社商品との直接的な関連は限定的ですが、タイミングとして有望です。";
  const needsNote = hasCompanyNeeds ? "登録済みのニーズ情報も踏まえると、" : "";
  return `${company.name}は${formatDate(event.occurredAt)}に${categoryLabel}（${event.title}）を実施しており、${needsNote}${product.name}が${tagPart}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function scoreCompanyForProduct(
  company: Company,
  events: Event[],
  product: Product,
  productTagCodes: string[],
  historySignal: HistorySignal,
  companyNeedTagCodes: string[] = [],
  now: Date = new Date()
): ScoreBreakdown {
  const bestEvent = pickBestEvent(events, productTagCodes);
  const freshnessScore = computeFreshness(bestEvent, now);
  const matchScore = computeMatch(bestEvent, companyNeedTagCodes, productTagCodes);
  const profileScore = computeProfile(company, product);
  const historyScore = computeHistoryScore(historySignal);

  const score =
    freshnessScore * SCORE_WEIGHTS.freshness +
    matchScore * SCORE_WEIGHTS.match +
    profileScore * SCORE_WEIGHTS.profile +
    historyScore * SCORE_WEIGHTS.history;

  const impliedTags = bestEvent ? getEventCategoryTags(bestEvent.category) : [];
  const relevantTags = Array.from(new Set([...impliedTags, ...companyNeedTagCodes]));
  const matchedTagLabels = relevantTags.filter((t) => productTagCodes.includes(t)).map(tagLabel);

  return {
    score: Math.round(score * 10) / 10,
    freshnessScore: Math.round(freshnessScore),
    matchScore: Math.round(matchScore),
    profileScore: Math.round(profileScore),
    historyScore: Math.round(historyScore),
    reason: buildReason(company, product, bestEvent, matchedTagLabels, companyNeedTagCodes.length > 0),
    bestEvent,
  };
}
