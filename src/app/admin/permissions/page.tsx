"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Lightbulb, Rss, FileText, Search,
  ShieldAlert, ClipboardCheck, Store, CheckSquare, BarChart3,
  FolderOpen, Heart, Receipt, ShieldCheck, UserCircle,
  Plus, Trash2, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: string;
}

interface Permission {
  id: number;
  target_type: string;
  target_value: string;
  menu_href: string;
  granted: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  user_type?: string;
}

// 전체 메뉴 리스트
const allMenus: MenuItem[] = [
  { section: "AI-FX 정보서비스", href: "/user/dashboard", label: "AI 식품안전 모니터링", icon: LayoutDashboard },
  { section: "AI-FX 정보서비스", href: "/user/insights", label: "AI 식품 인사이트", icon: Lightbulb },
  { section: "AI-FX 정보서비스", href: "/user/news", label: "뉴스 피드", icon: Rss },
  { section: "AI-FX 정보서비스", href: "/user/reports", label: "식품안전리포트", icon: FileText },
  { section: "AI-FX 정보서비스", href: "/user/search", label: "AI 통합 정보검색", icon: Search },
  { section: "AI-FX 정보서비스", href: "/user/crackdown", label: "식품단속정보", icon: ShieldAlert },
  { section: "AI-FX 정보서비스", href: "/user/inspection", label: "위생자율점검지", icon: ClipboardCheck },
  { section: "부가서비스 관리", href: "/user/agency/dashboard", label: "대리점 현황", icon: Store },
  { section: "부가서비스 관리", href: "/user/agency/clients", label: "고객사 관리", icon: UserCircle },
  { section: "부가서비스 관리", href: "/user/agency/services", label: "서비스 관리", icon: ClipboardCheck },
  { section: "부가서비스 관리", href: "/user/agency/calendar", label: "행사 달력", icon: LayoutDashboard },
  { section: "부가서비스 관리", href: "/user/agency/staff", label: "인력 관리", icon: Heart },
  { section: "부가서비스 관리", href: "/user/agency/items", label: "품목/기물 관리", icon: Receipt },
  { section: "부가서비스 관리", href: "/user/agency/vendors", label: "공급사 관리", icon: ShieldCheck },
  { section: "부가서비스 관리", href: "/user/agency/reports", label: "정산 리포트", icon: FileText },
  { section: "우리가게 위생관리", href: "/user/store/dashboard", label: "가게 현황", icon: Store },
  { section: "우리가게 위생관리", href: "/user/store/check", label: "일일 점검", icon: CheckSquare },
  { section: "우리가게 위생관리", href: "/user/store/history", label: "점검 현황", icon: BarChart3 },
  { section: "우리가게 위생관리", href: "/user/store/documents", label: "서류함", icon: FolderOpen },
  { section: "우리가게 위생관리", href: "/user/store/health-certs", label: "직원 보건증", icon: Heart },
  { section: "우리가게 위생관리", href: "/user/store/receipts", label: "식재료 증빙", icon: Receipt },
  { section: "우리가게 위생관리", href: "/user/store/shield", label: "점검 대응", icon: ShieldCheck },
];

const sections = [...new Set(allMenus.map((m) => m.section))];

const targetTypeOptions = [
  { value: "user_type", label: "회원 유형별" },
  { value: "user", label: "개별 회원" },
];

const userTypeValues = [
  { value: "personal", label: "개인" },
  { value: "business", label: "사업자" },
  { value: "agency", label: "대리점" },
];

export default function PermissionsPage() {
  const [targetType, setTargetType] = useState("user_type");
  const [targetValue, setTargetValue] = useState("personal");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // 사용자 목록 로드 (개별 회원 탭)
  useEffect(() => {
    if (targetType === "user") {
      fetch("/api/users")
        .then((r) => r.json())
        .then(setUsers)
        .catch(console.error);
    }
  }, [targetType]);

  // 권한 목록 조회
  const fetchPermissions = useCallback(async () => {
    const tv = targetType === "user" ? (selectedUser?.id || "") : targetValue;
    if (!tv) {
      setPermissions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/permissions?target_type=${targetType}&target_value=${tv}`);
      const data = await res.json();
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetValue, selectedUser]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // 권한 추가
  const addPermission = async (menuHref: string) => {
    const tv = targetType === "user" ? (selectedUser?.id || "") : targetValue;
    if (!tv) return;

    await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_value: tv, menu_href: menuHref, granted: true }),
    });
    fetchPermissions();
  };

  // 권한 삭제
  const removePermission = async (id: number) => {
    await fetch(`/api/permissions/${id}`, { method: "DELETE" });
    fetchPermissions();
  };

  // 현재 권한에 있는 href 집합
  const grantedHrefs = new Set(permissions.map((p) => p.menu_href));

  // 사용자 검색 필터
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.nickname || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  // 타겟 타입 변경
  const handleTargetTypeChange = (type: string) => {
    setTargetType(type);
    setSelectedUser(null);
    setUserSearch("");
    if (type === "user_type") setTargetValue("personal");
    else setTargetValue("");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">메뉴 권한 관리</h1>

      {/* 대상 선택 */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {targetTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTargetTypeChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                targetType === opt.value
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 값 선택 */}
        {targetType === "user_type" && (
          <div className="flex gap-2">
            {userTypeValues.map((v) => (
              <button
                key={v.value}
                onClick={() => setTargetValue(v.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  targetValue === v.value
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-50 text-slate-500 border border-slate-200"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}



        {targetType === "user" && (
          <div className="relative">
            <input
              type="text"
              placeholder="이메일 또는 닉네임 검색..."
              value={selectedUser ? (selectedUser.nickname || selectedUser.email) : userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setSelectedUser(null);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            {showUserDropdown && !selectedUser && userSearch && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.slice(0, 20).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserDropdown(false);
                      setUserSearch("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-50"
                  >
                    <span className="font-medium">{u.nickname || u.email}</span>
                    <span className="text-slate-400 ml-2">{u.email}</span>
                    <span className="text-xs text-slate-400 ml-2">({u.role})</span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400">검색 결과 없음</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 좌우 분할 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 전체 메뉴 리스트 */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-bold text-slate-800">전체 메뉴</h2>
            <p className="text-xs text-slate-400 mt-1">클릭하여 권한을 추가합니다</p>
          </div>
          <div className="p-3 space-y-4 max-h-[600px] overflow-y-auto">
            {sections.map((section) => (
              <div key={section}>
                <p className="text-xs font-bold text-slate-400 px-2 mb-2">{section}</p>
                <div className="space-y-1">
                  {allMenus
                    .filter((m) => m.section === section)
                    .map((menu) => {
                      const isGranted = grantedHrefs.has(menu.href);
                      return (
                        <button
                          key={menu.href}
                          onClick={() => !isGranted && addPermission(menu.href)}
                          disabled={isGranted}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            isGranted
                              ? "bg-emerald-50 text-emerald-600 cursor-default"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <menu.icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-left">{menu.label}</span>
                          {isGranted ? (
                            <span className="text-[10px] font-bold text-emerald-500">추가됨</span>
                          ) : (
                            <Plus className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 현재 권한 */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-bold text-slate-800">
              현재 권한
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({permissions.length}개)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {targetType === "user_type" && `회원 유형: ${userTypeValues.find((v) => v.value === targetValue)?.label}`}
              {targetType === "user" && selectedUser && `${selectedUser.nickname || selectedUser.email}`}
            </p>
          </div>
          <div className="p-3 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-sm text-slate-400">로딩 중...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">별도 설정된 권한이 없습니다</p>
                <p className="text-xs text-slate-300 mt-1">기본 권한이 적용됩니다</p>
              </div>
            ) : (
              <div className="space-y-1">
                {permissions.map((perm) => {
                  const menu = allMenus.find((m) => m.href === perm.menu_href);
                  const Icon = menu?.icon || LayoutDashboard;
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100"
                    >
                      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="flex-1 text-sm text-emerald-800">
                        {menu?.label || perm.menu_href}
                      </span>
                      <button
                        onClick={() => removePermission(perm.id)}
                        className="p-1 rounded hover:bg-red-100 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
