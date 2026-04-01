"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { NotificationBell } from "@/components/notification-bell";
import { FloatingChat } from "@/components/floating-chat";
import {
  LayoutDashboard,
  Rss,
  ShieldAlert,
  BrainCircuit,
  Search,
  FileText,
  ClipboardCheck,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon; pro?: boolean }[] = [
  { href: "/user/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/user/news", label: "뉴스 피드", icon: Rss },
  { href: "/user/search", label: "AI 통합 정보검색", icon: Search },
  { href: "/user/crackdown", label: "단속정보", icon: ShieldAlert },
  { href: "/user/inspection", label: "위생자율점검지", icon: ClipboardCheck },
  { href: "/user/reports", label: "식품안전리포트", icon: FileText },
  { href: "/user/analysis", label: "상세 분석", icon: BrainCircuit },
  { href: "/user/profile", label: "내 정보", icon: UserCircle },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen">
        {/* 사이드바 스켈레톤 */}
        <aside className="hidden md:flex w-56 flex-col bg-slate-900 p-4">
          <div className="h-8 w-24 bg-slate-700 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        </aside>
        {/* 메인 스켈레톤 */}
        <main className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* 모바일 헤더 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 md:hidden">
        <MobileMenu navItems={navItems} role={role}>
          {["admin", "super_admin"].includes(role) && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-400 hover:bg-slate-800 mb-2"
            >
              <span>{"⚙️"}</span>
              <span>{"관리자 페이지"}</span>
            </Link>
          )}
          <UserMenu />
        </MobileMenu>
        <h1 className="text-lg font-bold">
          <span className="text-white">AI</span>
          <span className="text-emerald-400">-FX</span>
        </h1>
        <NotificationBell />
      </div>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-900 flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="text-white">AI</span>
              <span className="text-emerald-400">-FX</span>
            </h1>
            <NotificationBell />
          </div>
          <p className="text-xs text-slate-300 tracking-[0.15em] mt-1">{"Food Intelligence Platform"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const locked = item.pro && !["premium", "admin", "super_admin"].includes(role);
            return (
              <Link
                key={item.href}
                href={locked ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-400"
                    : locked
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
                onClick={(e) => locked && e.preventDefault()}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.pro && locked && (
                  <span className="text-xs bg-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded ml-auto">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}

          {["admin", "super_admin"].includes(role) && (
            <>
              <div className="border-t border-slate-800 my-3" />
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-emerald-400 hover:bg-slate-800"
              >
                <span>{"⚙️"}</span>
                <span>{"관리자 페이지"}</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        <FloatingChat />
      </main>
    </div>
  );
}
