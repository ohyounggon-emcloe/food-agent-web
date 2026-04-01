"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  pro?: boolean;
}

interface MobileMenuProps {
  navItems: NavItem[];
  role?: string;
  brandTitle?: string;
  brandSub?: string;
  children?: React.ReactNode;
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
      aria-label="메뉴 열기"
    >
      <Menu className="w-6 h-6 text-white" />
    </button>
  );
}

export function MobileMenu({
  navItems,
  role = "regular",
  brandTitle = "AI-FX",
  brandSub = "Food Intelligence Platform",
  children,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="메뉴 열기"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 슬라이드 메뉴 */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-slate-900 z-[101] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-white">AI</span>
              <span className="text-emerald-400">-FX</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest">
              {brandSub}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const locked =
              item.pro &&
              !["premium", "admin", "super_admin"].includes(role);

            return (
              <Link
                key={item.href}
                href={locked ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  locked && "opacity-40 cursor-not-allowed"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 (로그아웃 등) */}
        {children && (
          <div className="p-4 border-t border-slate-800">{children}</div>
        )}
      </aside>
    </>
  );
}
