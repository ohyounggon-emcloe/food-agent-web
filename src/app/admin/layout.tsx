"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: "📊" },
  { href: "/admin/sites", label: "사이트 관리", icon: "🌐" },
  { href: "/admin/keywords", label: "키워드 관리", icon: "🔑" },
  { href: "/admin/logs", label: "시스템 로그", icon: "📋" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, loading, signOut } = useAuth();

  // 로딩 중
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">{"로딩 중..."}</p>
      </div>
    );
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
      <aside className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">
            Food Safety Agent
          </h1>
          <p className="text-xs text-gray-500 mt-1">{"관리자 시스템"}</p>
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
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
