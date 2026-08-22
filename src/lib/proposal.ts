import type { Company, Event, Product } from "@prisma/client";
import { getEventCategoryLabel } from "./tags";

export type ProposalDraft = {
  openingLine: string;
  proposalSummary: string;
  emailDraft: string;
};

/**
 * STEP4「次の行動を提案」のドラフト生成。
 * 現状はテンプレートベースの生成器。将来的に生成AI(LLM) API に
 * 置き換えられるよう、引数と戻り値の形はそのまま流用できる設計にしている。
 */
export function generateProposalDraft(
  company: Company,
  product: Product,
  event: Event | null,
  reason: string
): ProposalDraft {
  if (!event) {
    return {
      openingLine: `${company.name}様、いつもお世話になっております。${product.name}のご案内でご連絡いたしました。`,
      proposalSummary: `${company.name}様に向けて${product.name}をご紹介する一般的な提案です。直近の変化イベントは検知されていないため、業種・規模の観点から提案しています。`,
      emailDraft: buildEmail(company, product, "貴社の事業展開に役立つ可能性があると考え", ""),
    };
  }

  const categoryLabel = getEventCategoryLabel(event.category);
  const trigger = `${categoryLabel}（${event.title}）`;

  const openingLine = `${company.name}様、いつもお世話になっております。先日の${trigger}のニュースを拝見し、${product.name}がお力になれる場面があるのではと思いご連絡いたしました。`;

  const proposalSummary = [
    `【きっかけ】${trigger}`,
    `【提案の要点】${reason}`,
    `【想定される次のアクション】まずは15分程度のお電話で、現在の状況と課題感を伺えればと思います。`,
  ].join("\n");

  const emailDraft = buildEmail(company, product, `${trigger}のニュースを拝見し`, trigger);

  return { openingLine, proposalSummary, emailDraft };
}

function buildEmail(company: Company, product: Product, hook: string, _trigger: string): string {
  return [
    `${company.name} ご担当者様`,
    "",
    "お世話になっております。",
    `${hook}、ご連絡させていただきました。`,
    "",
    `弊社の「${product.name}」は、${product.targetProfile}のようなお客様に多くご利用いただいており、`,
    "貴社の状況に合わせたご提案が可能です。",
    "",
    "もしご興味をお持ちいただけましたら、15分程度お時間をいただき、",
    "現在の課題感やタイミングについて伺えますと幸いです。",
    "",
    "ご検討のほど、よろしくお願いいたします。",
  ].join("\n");
}
