import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MessageThread from "@/components/MessageThread";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { companyId?: string; leadScoreId?: string };
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const recentMessages = await prisma.message.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  const threadCompanies = new Map<string, (typeof recentMessages)[number]["company"]>();
  for (const m of recentMessages) {
    if (!threadCompanies.has(m.companyId)) {
      threadCompanies.set(m.companyId, m.company);
    }
  }

  let selectedCompanyId: string | null =
    searchParams.companyId ?? [...threadCompanies.keys()][0] ?? null;

  if (selectedCompanyId && !threadCompanies.has(selectedCompanyId)) {
    const company = await prisma.company.findUnique({ where: { id: selectedCompanyId } });
    if (company) {
      threadCompanies.set(company.id, company);
    } else {
      selectedCompanyId = null;
    }
  }

  const selectedCompany = selectedCompanyId ? threadCompanies.get(selectedCompanyId) ?? null : null;

  const messages = selectedCompanyId
    ? await prisma.message.findMany({
        where: { tenantId: session.tenantId, companyId: selectedCompanyId },
        include: { senderUser: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">メッセージ</h1>
        <p className="text-sm text-slate-500 mt-1">企業とDM感覚で商談のやり取りができます。</p>
      </div>

      <div className="flex gap-4 h-[70vh]">
        <div className="w-64 shrink-0 card overflow-y-auto p-2">
          {threadCompanies.size === 0 ? (
            <p className="text-sm text-slate-500 p-3">
              まだ会話がありません。ダッシュボードから「この企業に提案する」を押して始めましょう。
            </p>
          ) : (
            <ul className="space-y-1">
              {[...threadCompanies.values()].map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/messages?companyId=${c.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      c.id === selectedCompanyId
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 card p-0 flex flex-col overflow-hidden">
          {selectedCompany ? (
            <MessageThread
              key={selectedCompany.id}
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
              leadScoreId={searchParams.leadScoreId ?? null}
              initialMessages={messages.map((m) => ({
                id: m.id,
                sender: m.sender as "SALES" | "COMPANY",
                body: m.body,
                createdAt: m.createdAt.toISOString(),
                senderUserName: m.senderUser?.name ?? null,
              }))}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              左の一覧から企業を選択してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
