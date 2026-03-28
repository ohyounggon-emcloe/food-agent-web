"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">
            Food Safety Agent
          </h1>
          <p className="text-xs text-gray-500 mt-1">관리자 시스템</p>
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

        <div className="p-4 border-t text-xs text-gray-400">
          v0.1.0 Prototype
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
