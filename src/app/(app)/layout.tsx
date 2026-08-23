import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import SidebarNav from "@/components/SidebarNav";
import { LogOut } from "lucide-react";

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

  return (
    <div className="flex min-h-screen">
      {/* ダークサイドバー */}
      <aside className="w-56 bg-sidebar flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarNav
          isManager={isManager}
          userName={user.name}
          tenantName={user.tenant.name}
          roleLabel={ROLE_LABEL[user.role]}
        />
        <div className="px-3 pb-4">
          <LogoutButton />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
