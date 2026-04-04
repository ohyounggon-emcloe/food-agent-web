"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
  FileText,
  ClipboardCheck,
  UserCircle,
  Lightbulb,
  Store,
  CheckSquare,
  BarChart3,
  FolderOpen,
  Heart,
  Receipt,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface NavSection {
  title: string;
  agencyOnly?: boolean;
  storeOnly?: boolean;
  items: { href: string; label: string; icon: LucideIcon; pro?: boolean; businessOnly?: boolean }[];
}

const navSections: NavSection[] = [
  {
    title: "🤖 AI-FX 정보서비스",
    items: [
      { href: "/user/dashboard", label: "AI 식품안전 모니터링", icon: LayoutDashboard },
      { href: "/user/insights", label: "AI 식품 인사이트", icon: Lightbulb },
      { href: "/user/news", label: "뉴스 피드", icon: Rss },
      { href: "/user/reports", label: "식품안전리포트", icon: FileText },
      { href: "/user/search", label: "AI 통합 정보검색", icon: Search },
      { href: "/user/crackdown", label: "식품단속정보", icon: ShieldAlert },
      { href: "/user/inspection", label: "위생자율점검지", icon: ClipboardCheck },
    ],
  },
  {
    title: "📦 부가서비스 관리",
    agencyOnly: true,
    items: [
      { href: "/user/agency/dashboard", label: "대리점 현황", icon: Store, businessOnly: true },
      { href: "/user/agency/clients", label: "고객사 관리", icon: UserCircle, businessOnly: true },
      { href: "/user/agency/services", label: "서비스 관리", icon: ClipboardCheck, businessOnly: true },
      { href: "/user/agency/calendar", label: "행사 달력", icon: LayoutDashboard, businessOnly: true },
      { href: "/user/agency/staff", label: "인력 관리", icon: Heart, businessOnly: true },
      { href: "/user/agency/items", label: "품목/기물 관리", icon: Receipt, businessOnly: true },
      { href: "/user/agency/vendors", label: "공급사 관리", icon: ShieldCheck, businessOnly: true },
      { href: "/user/agency/reports", label: "정산 리포트", icon: FileText, businessOnly: true },
    ],
  },
  {
    title: "🏠 우리가게 위생관리",
    storeOnly: true,
    items: [
      { href: "/user/store/dashboard", label: "가게 현황", icon: Store, businessOnly: true },
      { href: "/user/store/check", label: "일일 점검", icon: CheckSquare, businessOnly: true },
      { href: "/user/store/history", label: "점검 현황", icon: BarChart3, businessOnly: true },
      { href: "/user/store/documents", label: "서류함", icon: FolderOpen, businessOnly: true },
      { href: "/user/store/health-certs", label: "직원 보건증", icon: Heart, businessOnly: true },
      { href: "/user/store/receipts", label: "식재료 증빙", icon: Receipt, businessOnly: true },
      { href: "/user/store/shield", label: "점검 대응", icon: ShieldCheck, businessOnly: true },
    ],
  },
];

// MobileMenu용 (동적으로 계산)

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading, user, profile } = useAuth();
  const userType = (profile as unknown as Record<string, unknown>)?.user_type as string || "personal";
  const isAdmin = ["admin", "super_admin"].includes(role);
  const isAgency = userType === "agency";

  // agency 유형이 /user/dashboard에 접근하면 /user/agency/dashboard로 리다이렉트
  useEffect(() => {
    if (!loading && user && isAgency && pathname === "/user/dashboard") {
      router.replace("/user/agency/dashboard");
    }
  }, [loading, user, isAgency, pathname, router]);

  // 로딩 중이면 빈 화면 (깜빡임 방지)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    );
  }

  // 로딩 완료 후 user가 없으면 로그인으로
  // (미들웨어가 쿠키 기반으로 리다이렉트하므로, 여기서는 쿠키 건드리지 않음)
  if (!user) {
    return null;
  }

  // 메뉴 권한 체크
  const [allowedMenus, setAllowedMenus] = useState<Set<string> | null>(null);

  const fetchMenuPermissions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/permissions/check?user_id=${user.id}`);
      const data = await res.json();
      if (data.has_custom && data.permissions?.length > 0) {
        const granted = new Set<string>(
          data.permissions
            .filter((p: { granted: boolean }) => p.granted)
            .map((p: { menu_href: string }) => p.menu_href)
        );
        setAllowedMenus(granted);
      }
    } catch {
      // 권한 조회 실패 시 기본 로직 사용
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMenuPermissions();
  }, [fetchMenuPermissions]);

  // agency 유형: 부가서비스 섹션만 표시
  const baseSections = navSections.filter((section) => {
    if (isAdmin) return true;
    if (isAgency) {
      return !!section.agencyOnly;
    }
    if (section.agencyOnly) return false;
    if (section.storeOnly) return userType === "business";
    return true;
  });

  // 개별 권한이 설정되어 있으면 메뉴 항목 필터링
  const visibleSections = allowedMenus
    ? baseSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => allowedMenus.has(item.href)),
        }))
        .filter((section) => section.items.length > 0)
    : baseSections;

  return (
    <div className="flex h-screen">
      {/* 모바일 헤더 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 lg:hidden">
        <MobileMenu navItems={visibleSections.flatMap((s) => s.items)} role={role}>
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
        <Link href={isAgency ? "/user/agency/dashboard" : "/user/dashboard"} className="text-lg font-bold">
          <span className="text-white">AI</span>
          <span className="text-emerald-400">-FX</span>
        </Link>
        <NotificationBell />
      </div>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800 bg-slate-900 flex-col">
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleSections.map((section, sIdx) => {
            return (
            <div key={section.title}>
              {sIdx > 0 && <div className="border-t border-slate-800 my-3" />}
              <p className="text-xs text-slate-400 font-bold tracking-wide px-3 mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
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
            </div>
            );
          })}

          <div className="border-t border-slate-800 my-3" />
          <Link
            href="/user/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/user/profile"
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <UserCircle className="w-4 h-4" />
            <span>{"내 정보"}</span>
          </Link>

          {["admin", "super_admin"].includes(role) && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-emerald-400 hover:bg-slate-800"
            >
              <span>{"⚙️"}</span>
              <span>{"관리자 페이지"}</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">{children}</div>
        <FloatingChat />
      </main>
    </div>
  );
}
