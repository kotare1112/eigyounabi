import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InviteUserForm from "@/components/InviteUserForm";

const ROLE_LABEL: Record<string, string> = {
  SALES: "営業担当者",
  MANAGER: "マネージャー",
  ADMIN: "管理者",
};

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "MANAGER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const members = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-navy">チーム管理</h1>
        <p className="text-sm text-gray-500">メンバーの追加、担当割り振りの管理を行います。</p>
      </div>

      <div className="card max-w-xl">
        <h2 className="font-bold text-navy mb-3">メンバーを追加</h2>
        <InviteUserForm />
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-3">メンバー一覧</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">氏名</th>
              <th className="py-2">メールアドレス</th>
              <th className="py-2">権限</th>
              <th className="py-2">登録日</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">{m.name}</td>
                <td className="py-2">{m.email}</td>
                <td className="py-2">{ROLE_LABEL[m.role]}</td>
                <td className="py-2">{m.createdAt.toLocaleDateString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
