"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Star,
  MessageCircle,
  Users,
  BarChart2,
  Settings,
  LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", Icon: LayoutDashboard },
  { href: "/products", label: "自社製品", Icon: Package },
  { href: "/preferred-products", label: "希望する商品", Icon: Star },
  { href: "/messages", label: "メッセージ", Icon: MessageCircle },
  { href: "/team", label: "チーム管理", Icon: Users },
  { href: "/reports", label: "レポート", Icon: BarChart2 },
  { href: "/settings", label: "設定", Icon: Settings },
];

export default function SidebarNav({
  isManager,
  userName,
  tenantName,
  roleLabel,
}: {
  isManager: boolean;
  userName: string;
  tenantName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => item.href !== "/team" || isManager
  );

  return (
    <>
      <div className="px-4 py-5 border-b border-slate-800">
        <span className="text-white font-bold text-lg tracking-tight">営業ナビ</span>
        <p className="text-slate-400 text-xs mt-0.5">売れる兆しが届く営業へ</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-900/60 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon
                size={17}
                className={active ? "text-indigo-400" : "text-slate-500"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{userName}</p>
            <p className="text-slate-500 text-[11px] truncate">{tenantName} · {roleLabel}</p>
          </div>
        </div>
      </div>
    </>
  );
}
