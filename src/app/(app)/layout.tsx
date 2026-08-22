import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  SALES: "営業担当者",
  MANAGER: "マネージャー",
  ADMIN: "管理者",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isManager = user.role === "MANAGER" || user.role === "ADMIN";

  const navItems = [
    { href: "/dashboard", label: "ダッシュボード" },
    { href: "/products", label: "商品管理" },
    ...(isManager ? [{ href: "/team", label: "チーム管理" }] : []),
    { href: "/reports", label: "レポート" },
    { href: "/settings", label: "設定" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-navy">
              営業ナビ
            </Link>
            <nav className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-gray-600 hover:text-navy">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              {user.tenant.name} ・ {user.name}（{ROLE_LABEL[user.role]}）
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
