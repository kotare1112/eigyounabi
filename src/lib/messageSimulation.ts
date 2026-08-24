import type { Company, Product } from "@prisma/client";

const INTERESTED_TEMPLATES = [
  (c: Company) => `ご連絡ありがとうございます。${c.name}としても関心があります。詳しい資料をいただけますか？`,
  (_c: Company) => "興味があります。一度オンラインでお話を伺ってもよろしいでしょうか。",
  (c: Company) => `ちょうど${c.name}内でも検討していたテーマです。来週あたりお時間いただけますか？`,
];

const NEUTRAL_TEMPLATES = [
  (_c: Company) => "情報ありがとうございます。社内で共有し、検討させていただきます。",
  (_c: Company) => "少し詳しく教えてください。導入実績などはありますか？",
  (_c: Company) => "ご提案の件、担当部署に確認してから改めてご連絡します。",
];

const HESITANT_TEMPLATES = [
  (_p: Product | null) => "ありがとうございます。ただ、今は他社製品の検討を進めておりまして…",
  (_p: Product | null) => "予算的に今期は難しそうです。来期改めてご相談できればと思います。",
  (p: Product | null) =>
    p ? `${p.name}については魅力を感じますが、価格面で少し検討が必要です。` : "検討はしたいのですが、優先度が今は高くありません。",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSimulatedReply(company: Company, product: Product | null): string {
  const bucket = Math.random();
  if (bucket < 0.4) return pickRandom(INTERESTED_TEMPLATES)(company);
  if (bucket < 0.75) return pickRandom(NEUTRAL_TEMPLATES)(company);
  return pickRandom(HESITANT_TEMPLATES)(product);
}
