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
import { AgencyProvider, useAgencyContext } from "@/providers/agency-context";
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
  DollarSign,
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
      { href: "/user/agency/calendar", label: "행사 달력", icon: LayoutDashboard, businessOnly: true },
      { href: "/user/agency/services", label: "서비스 관리", icon: ClipboardCheck, businessOnly: true },
      { href: "/user/agency/revenue", label: "고객사 매출관리", icon: DollarSign, businessOnly: true },
      { href: "/user/agency/reports", label: "정산 리포트", icon: FileText, businessOnly: true },
      { href: "/user/agency/clients", label: "고객사 관리", icon: UserCircle, businessOnly: true },
      { href: "/user/agency/staff", label: "인력 관리", icon: Heart, businessOnly: true },
      { href: "/user/agency/items", label: "품목/기물 관리", icon: Receipt, businessOnly: true },
      { href: "/user/agency/vendors", label: "공급사 관리", icon: ShieldCheck, businessOnly: true },
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

  // 메뉴 권한 체크 (hooks는 early return 전에 선언)
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
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login?logout=true";
    }
    return null;
  }

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

  // 개별 권한이 설정되어 있으면 메뉴 항목 필터링 (admin은 모든 메뉴 표시)
  const visibleSections = allowedMenus && !isAdmin
    ? baseSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => allowedMenus.has(item.href)),
        }))
        .filter((section) => section.items.length > 0)
    : baseSections;

  return (
    <AgencyProvider>
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
            const showSelector = isAdmin && (section.agencyOnly || section.storeOnly);
            return (
            <div key={section.title}>
              {sIdx > 0 && <div className="border-t border-slate-800 my-3" />}
              <p className="text-xs text-slate-400 font-bold tracking-wide px-3 mb-2">
                {section.title}
              </p>
              {showSelector && section.agencyOnly && <AdminAgencySelector />}
              {showSelector && section.storeOnly && <AdminStoreSelector />}
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
    </AgencyProvider>
  );
}

function AdminSearchSelector({ items, selectedId, onSelect, placeholder, icon }: {
  items: { id: number; name: string; sub?: string }[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder: string;
  icon: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sub || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedName = items.find((i) => i.id === selectedId)?.name || placeholder;

  return (
    <>
      <div className="mb-3 px-3 flex items-center gap-1.5">
        <div className="flex-1 bg-slate-800 text-slate-200 text-xs rounded-md border border-slate-700 px-2 py-1.5 truncate">
          <span className="text-slate-500 mr-1">{icon}</span>
          {selectedName}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors"
        >
          검색
        </button>
      </div>

      {/* 검색 모달 */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setSearch(""); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-2xl w-80 max-h-[60vh] flex flex-col overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${placeholder} 검색...`}
                autoFocus
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 placeholder:text-gray-400"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">검색 결과가 없습니다</p>
              ) : (
                filtered.map((i) => (
                  <button key={i.id}
                    onClick={() => {
                      const changed = i.id !== selectedId;
                      onSelect(i.id);
                      setOpen(false);
                      setSearch("");
                      if (changed) setTimeout(() => window.location.reload(), 100);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                      i.id === selectedId ? "bg-emerald-50" : ""
                    )}
                  >
                    <span className={cn("block text-sm", i.id === selectedId ? "text-emerald-700 font-semibold" : "text-gray-800")}>
                      {i.name}
                    </span>
                    {i.sub && <span className="block text-xs text-gray-400 mt-0.5">{i.sub}</span>}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setOpen(false); setSearch(""); }}
              className="p-3 text-center text-sm text-gray-500 border-t hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AdminAgencySelector() {
  const { agencies, selectedAgencyId, setSelectedAgencyId } = useAgencyContext();
  if (agencies.length === 0) return null;

  const items = agencies.map((a) => ({ id: a.id, name: a.agency_name, sub: a.representative || "" }));
  return (
    <AdminSearchSelector items={items} selectedId={selectedAgencyId} onSelect={setSelectedAgencyId} placeholder="대리점 선택" icon="📦" />
  );
}

function AdminStoreSelector() {
  const { stores, selectedStoreId, setSelectedStoreId } = useAgencyContext();
  if (stores.length === 0) return null;

  const items = stores.map((s) => ({ id: s.id, name: s.store_name, sub: s.store_type || "" }));
  return (
    <AdminSearchSelector items={items} selectedId={selectedStoreId} onSelect={setSelectedStoreId} placeholder="가게 선택" icon="🏠" />
  );
}
