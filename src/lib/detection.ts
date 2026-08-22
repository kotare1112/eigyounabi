import type { Company } from "@prisma/client";
import type { EventCategory } from "./tags";
import { prisma } from "./db";

export type DetectedEventInput = {
  category: EventCategory;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl?: string;
  occurredAt: Date;
};

export interface DetectionSource {
  name: string;
  fetchEvents(company: Company): Promise<DetectedEventInput[]>;
}

/**
 * 仕様書 STEP2「企業の変化を検知」の実装。
 *
 * 本番運用では、ここに以下のような実データソースへの接続を実装する想定:
 *   - ニュース・プレスリリース配信APIコネクタ（設備投資・資金調達・組織変化）
 *   - 求人媒体API／採用ページクローラー（採用拡大）
 *   - IR情報・決算短信の取得（資金調達・業績）
 *
 * 現時点では外部APIの契約・認証情報が無いため、各データソースを
 * `DetectionSource` インターフェースで抽象化し、疑似データを返す
 * シミュレーション実装（SimulatedXxxSource）を用意している。
 * 実APIが用意できたら、同インターフェースを満たす実装に差し替えるだけで
 * 検知パイプライン全体（重複除去・タグ付け・スコアリング）はそのまま動作する。
 */

const EQUIPMENT_TEMPLATES = [
  (c: Company) => ({
    title: `${c.prefecture ?? ""}に新工場を建設`,
    summary: `${c.name}は生産能力増強のため新工場の建設を発表した。`,
  }),
  (c: Company) => ({
    title: "基幹製造設備をリニューアル",
    summary: `${c.name}は老朽化した製造設備の入れ替えを進めていることが判明した。`,
  }),
];

const HIRING_TEMPLATES = [
  (c: Company) => ({
    title: "エンジニア・現場スタッフを大量採用",
    summary: `${c.name}の採用ページで求人数が急増しており、拠点拡大に伴う人員確保が進んでいる。`,
  }),
  (c: Company) => ({
    title: "新拠点の立ち上げに伴う採用強化",
    summary: `${c.name}が新拠点向けの求人を複数出稿していることを検知した。`,
  }),
];

const FUNDING_TEMPLATES = [
  (c: Company) => ({
    title: "資金調達を実施",
    summary: `${c.name}が事業拡大のための資金調達を発表した。`,
  }),
  (c: Company) => ({
    title: "増収増益を発表",
    summary: `${c.name}の直近決算は増収増益となり、投資余力が高まっている。`,
  }),
];

const ORG_TEMPLATES = [
  (c: Company) => ({
    title: "新規事業部を設立",
    summary: `${c.name}が新規事業部を設立し、体制強化を図っている。`,
  }),
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRecentDate(maxDaysAgo: number): Date {
  const days = Math.floor(Math.random() * maxDaysAgo);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

class SimulatedNewsAndIrSource implements DetectionSource {
  name = "simulated-news-ir";

  async fetchEvents(company: Company): Promise<DetectedEventInput[]> {
    const events: DetectedEventInput[] = [];
    if (Math.random() < 0.35) {
      const t = pickRandom(EQUIPMENT_TEMPLATES)(company);
      events.push({
        category: "EQUIPMENT_INVESTMENT",
        ...t,
        sourceName: "プレスリリース配信サービス（シミュレーション）",
        occurredAt: randomRecentDate(60),
      });
    }
    if (Math.random() < 0.25) {
      const t = pickRandom(FUNDING_TEMPLATES)(company);
      events.push({
        category: "FUNDING_PERFORMANCE",
        ...t,
        sourceName: "IR情報・決算短信（シミュレーション）",
        occurredAt: randomRecentDate(90),
      });
    }
    if (Math.random() < 0.15) {
      const t = pickRandom(ORG_TEMPLATES)(company);
      events.push({
        category: "ORG_CHANGE",
        ...t,
        sourceName: "企業サイト・ニュースリリース（シミュレーション）",
        occurredAt: randomRecentDate(90),
      });
    }
    return events;
  }
}

class SimulatedJobBoardSource implements DetectionSource {
  name = "simulated-job-board";

  async fetchEvents(company: Company): Promise<DetectedEventInput[]> {
    if (Math.random() < 0.3) {
      const t = pickRandom(HIRING_TEMPLATES)(company);
      return [
        {
          category: "HIRING_EXPANSION",
          ...t,
          sourceName: "求人媒体API（シミュレーション）",
          occurredAt: randomRecentDate(45),
        },
      ];
    }
    return [];
  }
}

export const DETECTION_SOURCES: DetectionSource[] = [
  new SimulatedNewsAndIrSource(),
  new SimulatedJobBoardSource(),
];

export async function runDetectionBatch(): Promise<{ created: number; skippedDuplicates: number }> {
  const companies = await prisma.company.findMany();
  let created = 0;
  let skippedDuplicates = 0;

  for (const company of companies) {
    for (const source of DETECTION_SOURCES) {
      const candidates = await source.fetchEvents(company);
      for (const candidate of candidates) {
        const existing = await prisma.event.findFirst({
          where: { companyId: company.id, title: candidate.title },
        });
        if (existing) {
          skippedDuplicates += 1;
          continue;
        }
        await prisma.event.create({
          data: {
            companyId: company.id,
            category: candidate.category,
            title: candidate.title,
            summary: candidate.summary,
            sourceName: candidate.sourceName,
            sourceUrl: candidate.sourceUrl,
            occurredAt: candidate.occurredAt,
          },
        });
        created += 1;
      }
    }
  }

  return { created, skippedDuplicates };
}
