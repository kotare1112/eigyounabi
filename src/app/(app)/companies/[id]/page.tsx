import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventCategoryLabel } from "@/lib/tags";
import { ACTION_TYPE_LABEL } from "@/lib/actionResults";
import ProposalEditor from "@/components/ProposalEditor";
import ActionForm from "@/components/ActionForm";
import CompanyNeedsForm from "@/components/CompanyNeedsForm";

const STATUS_LABEL: Record<string, string> = {
  NEW: "未接触",
  CONTACTED: "接触済み",
  IN_PROGRESS: "商談中",
  WON: "受注",
  LOST: "失注",
  EXCLUDED: "対象外",
};

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return null;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      events: { orderBy: { occurredAt: "desc" } },
      needTags: { include: { tag: true } },
    },
  });
  if (!company) notFound();

  const leadScores = await prisma.leadScore.findMany({
    where: { tenantId: session.tenantId, companyId: company.id },
    include: { product: true, proposal: true },
    orderBy: { score: "desc" },
  });

  const actions = await prisma.action.findMany({
    where: { tenantId: session.tenantId, companyId: company.id },
    include: { user: true },
    orderBy: { actedAt: "desc" },
    take: 20,
  });

  const leadOptions = leadScores.map((l) => ({ id: l.id, productName: l.product.name }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-navy">{company.name}</h1>
        <p className="text-sm text-gray-500">
          {company.industry}
          {company.employeeCount ? ` ・ 従業員${company.employeeCount}名` : ""}
          {company.prefecture ? ` ・ ${company.prefecture}` : ""}
          {company.capitalManYen ? ` ・ 資本金${company.capitalManYen}万円` : ""}
        </p>
      </div>

      <section>
        <h2 className="font-bold text-navy mb-3">欲しい商品・ニーズ</h2>
        <p className="text-sm text-gray-500 mb-3">
          この企業が欲しがっている商品・解決したい課題を登録すると、自社製品とのマッチ度に反映されます。
        </p>
        <div className="card">
          <CompanyNeedsForm
            companyId={company.id}
            initialTagCodes={company.needTags.map((nt) => nt.tag.code)}
          />
        </div>
      </section>

      <section>
        <h2 className="font-bold text-navy mb-3">営業先としての優先度・提案内容</h2>
        <div className="space-y-4">
          {leadScores.length === 0 && (
            <div className="card text-sm text-gray-500">まだスコアが計算されていません。</div>
          )}
          {leadScores.map((lead) => (
            <div key={lead.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-navy">{lead.product.name}</span>
                  <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600 ml-2">
                    {STATUS_LABEL[lead.status]}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-teal">{Math.round(lead.score)}</div>
                  <div className="text-[10px] text-gray-400">
                    新鮮度{lead.freshnessScore} / 一致度{lead.matchScore} / 属性{lead.profileScore} / 履歴
                    {lead.historyScore}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{lead.reason}</p>
              {lead.proposal && (
                <ProposalEditor
                  leadId={lead.id}
                  initial={{
                    openingLine: lead.proposal.openingLine,
                    proposalSummary: lead.proposal.proposalSummary,
                    emailDraft: lead.proposal.emailDraft,
                    editedByUser: lead.proposal.editedByUser,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-navy mb-3">検知した変化イベント（タイムライン）</h2>
        <div className="card">
          {company.events.length === 0 && (
            <p className="text-sm text-gray-500">まだ変化は検知されていません。</p>
          )}
          <ul className="space-y-3">
            {company.events.map((ev) => (
              <li key={ev.id} className="border-l-2 border-teal pl-3">
                <p className="text-xs text-gray-400">
                  {ev.occurredAt.toLocaleDateString("ja-JP")} ・ {getEventCategoryLabel(ev.category)} ・{" "}
                  {ev.sourceName}
                </p>
                <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                <p className="text-sm text-gray-600">{ev.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-navy mb-3">アクションを記録</h2>
        <div className="card">
          {leadOptions.length > 0 ? (
            <ActionForm companyId={company.id} leadOptions={leadOptions} />
          ) : (
            <p className="text-sm text-gray-500">対象商品がありません。</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-navy mb-3">アクション履歴</h2>
        <div className="card">
          {actions.length === 0 && <p className="text-sm text-gray-500">まだ記録はありません。</p>}
          <ul className="space-y-2">
            {actions.map((a) => (
              <li key={a.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <span className="text-xs text-gray-400">
                  {a.actedAt.toLocaleString("ja-JP")} ・ {a.user.name}
                </span>
                <span className="ml-2 font-semibold">{ACTION_TYPE_LABEL[a.actionType]}</span>
                {a.result && <span className="ml-2 text-teal">{a.result}</span>}
                {a.note && <p className="text-gray-600">{a.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
