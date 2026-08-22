import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import RunDetectionButton from "@/components/RunDetectionButton";
import AssignSelect from "@/components/AssignSelect";
import ExcludeLeadButton from "@/components/ExcludeLeadButton";

const STATUS_LABEL: Record<string, string> = {
  NEW: "未接触",
  CONTACTED: "接触済み",
  IN_PROGRESS: "商談中",
  WON: "受注",
  LOST: "失注",
  EXCLUDED: "対象外",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const productCount = await prisma.product.count({ where: { tenantId: user.tenantId } });
  if (productCount === 0) {
    redirect("/onboarding");
  }

  const isManager = user.role === "MANAGER" || user.role === "ADMIN";

  const leads = await prisma.leadScore.findMany({
    where: {
      tenantId: user.tenantId,
      status: { notIn: ["WON", "LOST", "EXCLUDED"] },
    },
    include: { company: true, product: true, proposal: true, assignedUser: true },
    orderBy: { score: "desc" },
    take: 30,
  });

  const teamMembers = isManager
    ? await prisma.user.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: "asc" } })
    : [];

  const top5 = leads.slice(0, 5);
  const rest = leads.slice(5);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-navy">ダッシュボード</h1>
          <p className="text-sm text-gray-500">
            {user.name} さん、本日おすすめの営業先です。
          </p>
        </div>
        {isManager && <RunDetectionButton />}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-gray-500 mb-3">
          明日電話すべき{top5.length}社
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {top5.map((lead, i) => (
            <LeadCard
              key={lead.id}
              rank={i + 1}
              lead={lead}
              isManager={isManager}
              teamMembers={teamMembers}
            />
          ))}
        </div>
        {top5.length === 0 && (
          <div className="card text-sm text-gray-500">
            現在おすすめできる営業先がありません。マネージャーに変化検知の実行を依頼してください。
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-gray-500 mb-3">その他の営業先候補</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((lead, i) => (
              <LeadCard
                key={lead.id}
                rank={i + 6}
                lead={lead}
                isManager={isManager}
                teamMembers={teamMembers}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  rank,
  lead,
  isManager,
  teamMembers,
  compact,
}: {
  rank: number;
  lead: any;
  isManager: boolean;
  teamMembers: { id: string; name: string }[];
  compact?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-navy rounded-full w-5 h-5 flex items-center justify-center">
              {rank}
            </span>
            <Link href={`/companies/${lead.company.id}`} className="font-bold text-navy hover:underline">
              {lead.company.name}
            </Link>
            <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
              {STATUS_LABEL[lead.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {lead.company.industry}
            {lead.company.employeeCount ? ` ・ 従業員${lead.company.employeeCount}名` : ""}
            {lead.company.prefecture ? ` ・ ${lead.company.prefecture}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-teal">{Math.round(lead.score)}</div>
          <div className="text-[10px] text-gray-400">優先度スコア</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mt-3">{lead.reason}</p>
      <p className="text-xs text-gray-500 mt-1">対象商品: {lead.product.name}</p>

      {!compact && lead.proposal && (
        <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
          <p className="font-semibold text-gray-600 text-xs mb-1">最初の一言</p>
          <p className="text-gray-800">{lead.proposal.openingLine}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <Link href={`/companies/${lead.company.id}`} className="text-sm text-navy underline">
          詳細・提案内容を見る
        </Link>
        <div className="flex items-center gap-2">
          {isManager && (
            <AssignSelect leadId={lead.id} currentUserId={lead.assignedUserId} members={teamMembers} />
          )}
          <ExcludeLeadButton leadId={lead.id} />
        </div>
      </div>
    </div>
  );
}
