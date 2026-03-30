"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  Activity,
  Globe,
  ScanSearch,
  Users,
  ScrollText,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/monitoring", label: "모니터링", icon: Activity },
  { href: "/admin/sites", label: "사이트 관리", icon: Globe },
  { href: "/admin/keywords", label: "키워드 관리", icon: ScanSearch },
  { href: "/admin/users", label: "사용자 관리", icon: Users },
  { href: "/admin/logs", label: "시스템 로그", icon: ScrollText },
  { href: "/admin/settings", label: "설정", icon: SlidersHorizontal },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, loading, user, signOut } = useAuth();

  // 로딩 중
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">{"로딩 중..."}</p>
      </div>
    );
  }

  // 미로그인 → 미들웨어가 이미 리다이렉트하므로 여기는 안전장치
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  // 권한 없음
  if (!["admin", "super_admin"].includes(role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              {"접근 권한 없음"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {"관리자 권한이 필요합니다."}
            </p>
            <p className="text-sm text-gray-400">
              {"관리자에게 권한을 요청하세요."}
            </p>
            <Button variant="outline" onClick={signOut}>
              {"로그아웃"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-white">AI</span>
            <span className="text-emerald-400">-FX</span>
          </h1>
          <p className="text-xs text-slate-300 tracking-[0.15em] mt-1">{"Food Intelligence Platform"}</p>
          <p className="text-xs text-amber-400 font-medium mt-0.5">{"Admin System"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/user/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
          >
            <span>←</span>
            <span>사용자 페이지</span>
          </Link>
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
