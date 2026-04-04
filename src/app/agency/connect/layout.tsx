"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ClipboardList, Calendar, MoreHorizontal } from "lucide-react";

const tabs = [
  { href: "/agency/connect", label: "홈", icon: Home },
  { href: "/agency/connect/services", label: "서비스", icon: ClipboardList },
  { href: "/agency/connect/calendar", label: "달력", icon: Calendar },
  { href: "/agency/connect/more", label: "더보기", icon: MoreHorizontal },
];

export default function AgencyConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user_type === "agency" || ["admin", "super_admin"].includes(data?.role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      })
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-800">접근 권한 없음</h2>
          <p className="text-sm text-gray-500">
            식자재 대리점 계정만 이용할 수 있습니다.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg"
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto p-4">{children}</div>
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href ||
              (tab.href !== "/agency/connect" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  isActive
                    ? "text-emerald-600 font-semibold"
                    : "text-gray-400"
                )}
              >
                <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
