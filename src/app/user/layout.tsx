"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { UserMenu } from "@/components/user-menu";

const navItems = [
  { href: "/user/dashboard", label: "대시보드", icon: "📊" },
  { href: "/user/news", label: "뉴스 피드", icon: "📰" },
  { href: "/user/analysis", label: "상세 분석", icon: "📈", pro: true },
  { href: "/user/profile", label: "내 정보", icon: "👤" },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">{"로딩 중..."}</p>
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
          <p className="text-xs text-gray-500 mt-1">{"식품 안전 정보"}</p>
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
                    ? "bg-gray-900 text-white"
                    : locked
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-200"
                )}
                onClick={(e) => locked && e.preventDefault()}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.pro && locked && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-auto">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}

          {["admin", "super_admin"].includes(role) && (
            <>
              <div className="border-t my-3" />
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <span>{"⚙️"}</span>
                <span>{"관리자 페이지"}</span>
              </Link>
            </>
          )}
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
