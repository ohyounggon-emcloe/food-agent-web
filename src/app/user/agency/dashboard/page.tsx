"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Users, TrendingUp, Package, Calendar, UserCheck } from "lucide-react";

interface DashboardData {
  agencyName: string;
  counts: { pending: string; confirmed: string; completed_month: string; total: string };
  clientCount: string;
  monthRevenue: string;
  upcomingEvents: { title: string; requested_date: string; status: string; client_name: string; service_type: string }[];
  recentCompleted: { title: string; service_type: string; cost: number; quantity: number; completed_at: string; client_name: string }[];
  availableStaff: { name: string; status: string; job_type: string; region: string }[];
  inventory: { item_name: string; total_quantity: number; category: string; in_use: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "요청",
  confirmed: "확정",
  completed: "완료",
};

const TYPE_LABEL: Record<string, string> = {
  "기물대여": "기물",
  "행사": "행사",
  "인력": "인력",
  "현물": "현물",
};

export default function AgencyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/agency/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-12 text-gray-400">로딩 중...</div>;

  const c = data.counts;
  const revenue = Number(data.monthRevenue || 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {data.agencyName || "대리점"} 대시보드
        </h2>
        <p className="text-gray-500 text-sm mt-1">부가서비스 운영 현황 한눈에 보기</p>
      </div>

      {/* 핵심 KPI 6개 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-amber-600 font-medium">승인 대기</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{c.pending}<span className="text-sm font-normal">건</span></p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">진행 중</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{c.confirmed}<span className="text-sm font-normal">건</span></p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">이번달 완료</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{c.completed_month}<span className="text-sm font-normal">건</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">고객사</p>
            </div>
            <p className="text-2xl font-bold">{data.clientCount}<span className="text-sm font-normal">개</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-500 font-medium">가용 인력</p>
            </div>
            <p className="text-2xl font-bold">{data.availableStaff.length}<span className="text-sm font-normal">명</span></p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-600 font-medium">이번달 매출</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{revenue.toLocaleString()}<span className="text-xs font-normal">원</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 예정 일정 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>예정 일정</span>
              <Link href="/user/agency/calendar" className="text-xs text-blue-500 hover:underline font-normal">달력 보기 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">예정된 일정이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <Badge className={`text-[10px] shrink-0 ${STATUS_COLOR[e.status] || ""}`}>{STATUS_LABEL[e.status] || e.status}</Badge>
                    <span className="text-gray-400 text-xs shrink-0">{e.requested_date}</span>
                    <span className="font-medium truncate flex-1">{e.client_name}</span>
                    <span className="text-gray-400 text-xs shrink-0">{TYPE_LABEL[e.service_type] || e.service_type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 완료 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>최근 완료 서비스</span>
              <Link href="/user/agency/reports" className="text-xs text-blue-500 hover:underline font-normal">정산 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentCompleted.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">완료된 서비스가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {data.recentCompleted.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABEL[r.service_type] || r.service_type}</Badge>
                    <span className="font-medium truncate flex-1">{r.client_name}</span>
                    <span className="text-gray-500 text-xs">{(r.cost * r.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 가용 인력 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>가용 인력</span>
              <Link href="/user/agency/staff" className="text-xs text-blue-500 hover:underline font-normal">관리 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.availableStaff.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">등록된 인력이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {data.availableStaff.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.job_type}</Badge>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-400 text-xs ml-auto">{s.region}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기물 재고 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>기물/품목 재고</span>
              <Link href="/user/agency/items" className="text-xs text-blue-500 hover:underline font-normal">관리 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {data.inventory.filter(i => i.category === "기물대여").slice(0, 9).map((item, i) => {
                const inUse = Number(item.in_use || 0);
                const available = item.total_quantity - inUse;
                return (
                  <div key={i} className={`p-2 rounded border text-center ${available <= 0 ? "border-red-200 bg-red-50" : "border-gray-100"}`}>
                    <p className="text-xs font-medium truncate">{item.item_name}</p>
                    <p className="text-lg font-bold">{available}<span className="text-xs text-gray-400">/{item.total_quantity}</span></p>
                  </div>
                );
              })}
            </div>
            {data.inventory.filter(i => i.category === "기물대여").length > 9 && (
              <p className="text-xs text-center text-gray-400 mt-2">
                +{data.inventory.filter(i => i.category === "기물대여").length - 9}개 더
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
