export type EventCategory =
  | "EQUIPMENT_INVESTMENT"
  | "HIRING_EXPANSION"
  | "FUNDING_PERFORMANCE"
  | "ORG_CHANGE"
  | "OTHER_EVENT";

export const EVENT_CATEGORIES: EventCategory[] = [
  "EQUIPMENT_INVESTMENT",
  "HIRING_EXPANSION",
  "FUNDING_PERFORMANCE",
  "ORG_CHANGE",
  "OTHER_EVENT",
];

export type TagDef = { code: string; label: string };

// STEP1で商品に紐づける「解決できる課題」タグの一覧。
export const ISSUE_TAGS: TagDef[] = [
  { code: "LABOR_SHORTAGE", label: "人手不足" },
  { code: "AGING_EQUIPMENT", label: "設備老朽化" },
  { code: "CAPACITY_SHORTAGE", label: "生産能力不足" },
  { code: "RECRUITMENT_COST", label: "採用コスト増" },
  { code: "IT_MODERNIZATION", label: "IT・システム刷新" },
  { code: "LOGISTICS_EFFICIENCY", label: "物流効率化" },
  { code: "CAPITAL_INVESTMENT_NEEDS", label: "設備投資ニーズ" },
  { code: "ORG_EXPANSION", label: "組織拡大対応" },
  { code: "CASH_FLOW_GROWTH", label: "資金効率化" },
];

// STEP2で検知したイベント種別が、どの課題タグに関連しうるかのマッピング。
// STEP3のマッチ度スコア算出（商品タグとの重なり）に使用する。
export const EVENT_CATEGORY_TAGS: Record<EventCategory, string[]> = {
  EQUIPMENT_INVESTMENT: [
    "AGING_EQUIPMENT",
    "CAPACITY_SHORTAGE",
    "CAPITAL_INVESTMENT_NEEDS",
    "IT_MODERNIZATION",
  ],
  HIRING_EXPANSION: ["LABOR_SHORTAGE", "RECRUITMENT_COST", "ORG_EXPANSION"],
  FUNDING_PERFORMANCE: ["CAPITAL_INVESTMENT_NEEDS", "CASH_FLOW_GROWTH", "ORG_EXPANSION"],
  ORG_CHANGE: ["ORG_EXPANSION", "IT_MODERNIZATION"],
  OTHER_EVENT: [],
};

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  EQUIPMENT_INVESTMENT: "設備投資",
  HIRING_EXPANSION: "採用拡大",
  FUNDING_PERFORMANCE: "資金調達・業績",
  ORG_CHANGE: "組織変化",
  OTHER_EVENT: "その他イベント",
};

// Prisma(SQLite)側では category を String で保持しているため、
// DBから取得した任意の文字列を安全に扱うためのヘルパー。
export function getEventCategoryTags(category: string): string[] {
  return EVENT_CATEGORY_TAGS[category as EventCategory] ?? [];
}

export function getEventCategoryLabel(category: string): string {
  return EVENT_CATEGORY_LABEL[category as EventCategory] ?? category;
}
