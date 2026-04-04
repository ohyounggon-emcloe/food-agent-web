"use client";

import Link from "next/link";
import { Users, Package, UserCheck, Truck, FileText, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const menuItems = [
  { href: "/user/agency/clients", label: "고객사 관리", icon: Users, desc: "납품 고객사 정보 관리" },
  { href: "/user/agency/staff", label: "인력 관리", icon: UserCheck, desc: "대체조리사/행사 인력" },
  { href: "/user/agency/items", label: "품목/기물 관리", icon: Package, desc: "기물 대여 및 재고 현황" },
  { href: "/user/agency/vendors", label: "공급사 관리", icon: Truck, desc: "외부 공급업체 관리" },
  { href: "/user/agency/reports", label: "정산 리포트", icon: FileText, desc: "기간별 매출/비용 정산" },
];

export default function ConnectMore() {
  const handleLogout = async () => {
    const supabase = createClient();
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-800">더보기</h2>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <span className="text-gray-300 text-sm">›</span>
          </Link>
        ))}
      </div>

      <button onClick={handleLogout}
        className="flex items-center gap-3 w-full p-4 bg-white rounded-xl border border-red-100 text-red-500 active:bg-red-50 transition-colors mt-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium">로그아웃</span>
      </button>
    </div>
  );
}
