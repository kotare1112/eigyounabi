import { prisma } from "./db";
import { scoreCompanyForProduct, type HistorySignal } from "./scoring";
import { generateProposalDraft } from "./proposal";

async function getHistorySignal(tenantId: string, companyId: string): Promise<HistorySignal> {
  const actions = await prisma.action.findMany({
    where: { tenantId, companyId },
    orderBy: { actedAt: "desc" },
    take: 20,
  });
  if (actions.length === 0) return "NONE";
  if (actions.some((a) => a.result === "受注")) return "WON";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLost = actions.find(
    (a) => a.result === "失注・NG" && a.actedAt >= thirtyDaysAgo
  );
  if (recentLost) return "RECENT_LOST";

  return "IN_CONTACT";
}

export async function recalcLeadsForTenant(tenantId: string): Promise<{ updated: number }> {
  const products = await prisma.product.findMany({
    where: { tenantId },
    include: { tags: { include: { tag: true } } },
  });
  const companies = await prisma.company.findMany({
    include: { events: true, needTags: { include: { tag: true } } },
  });

  let updated = 0;

  for (const product of products) {
    const productTagCodes = product.tags.map((pt) => pt.tag.code);

    for (const company of companies) {
      const historySignal = await getHistorySignal(tenantId, company.id);
      const companyNeedTagCodes = company.needTags.map((nt) => nt.tag.code);
      const breakdown = scoreCompanyForProduct(
        company,
        company.events,
        product,
        productTagCodes,
        historySignal,
        companyNeedTagCodes
      );

      const leadScore = await prisma.leadScore.upsert({
        where: {
          tenantId_companyId_productId: {
            tenantId,
            companyId: company.id,
            productId: product.id,
          },
        },
        create: {
          tenantId,
          companyId: company.id,
          productId: product.id,
          score: breakdown.score,
          freshnessScore: breakdown.freshnessScore,
          matchScore: breakdown.matchScore,
          profileScore: breakdown.profileScore,
          historyScore: breakdown.historyScore,
          reason: breakdown.reason,
        },
        update: {
          score: breakdown.score,
          freshnessScore: breakdown.freshnessScore,
          matchScore: breakdown.matchScore,
          profileScore: breakdown.profileScore,
          historyScore: breakdown.historyScore,
          reason: breakdown.reason,
          calculatedAt: new Date(),
        },
      });
      updated += 1;

      const existingProposal = await prisma.proposal.findUnique({
        where: { leadScoreId: leadScore.id },
      });
      if (existingProposal?.editedByUser) {
        continue; // 営業担当者が編集済みの提案文は自動生成で上書きしない
      }

      const draft = generateProposalDraft(company, product, breakdown.bestEvent, breakdown.reason);
      await prisma.proposal.upsert({
        where: { leadScoreId: leadScore.id },
        create: { leadScoreId: leadScore.id, ...draft },
        update: { ...draft, generatedAt: new Date() },
      });
    }
  }

  return { updated };
}

export async function recalcLeadsForAllTenants(): Promise<{ updated: number }> {
  const tenants = await prisma.tenant.findMany();
  let total = 0;
  for (const tenant of tenants) {
    const { updated } = await recalcLeadsForTenant(tenant.id);
    total += updated;
  }
  return { updated: total };
}
