import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  NEW: "未接触",
  CONTACTED: "接触済み",
  IN_PROGRESS: "商談中",
  WON: "受注",
  LOST: "失注",
  EXCLUDED: "対象外",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [leadStatusGroups, actions, users] = await Promise.all([
    prisma.leadScore.groupBy({
      by: ["status"],
      where: { tenantId: user.tenantId },
      _count: { _all: true },
    }),
    prisma.action.findMany({
      where: { tenantId: user.tenantId },
      include: { user: true },
    }),
    prisma.user.findMany({ where: { tenantId: user.tenantId } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of leadStatusGroups) statusCounts[g.status] = g._count._all;
  const totalLeads = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const won = statusCounts.WON ?? 0;
  const lost = statusCounts.LOST ?? 0;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  const byUser = users.map((u) => {
    const userActions = actions.filter((a) => a.userId === u.id);
    return {
      name: u.name,
      calls: userActions.filter((a) => a.actionType === "CALL").length,
      meetings: userActions.filter((a) => a.actionType === "MEETING").length,
      won: userActions.filter((a) => a.result === "受注").length,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-navy">レポート・実績</h1>
        <p className="text-sm text-gray-500">架電結果・商談化率などのKPIを可視化します。</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="総アクション数" value={actions.length.toString()} />
        <StatCard label="対象リード数" value={totalLeads.toString()} />
        <StatCard label="受注率（受注/(受注+失注)）" value={winRate != null ? `${winRate}%` : "-"} />
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">リードステータス分布</h2>
        <div className="space-y-2">
          {Object.entries(STATUS_LABEL).map(([key, label]) => {
            const count = statusCounts[key] ?? 0;
            const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-gray-500">{label}</span>
                <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                  <div className="bg-teal h-3" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">担当者別実績</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">担当者</th>
              <th className="py-2">架電数</th>
              <th className="py-2">商談数</th>
              <th className="py-2">受注数</th>
            </tr>
          </thead>
          <tbody>
            {byUser.map((u) => (
              <tr key={u.name} className="border-b last:border-0">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.calls}</td>
                <td className="py-2">{u.meetings}</td>
                <td className="py-2">{u.won}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
