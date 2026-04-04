"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  counts: { pending: string; confirmed: string; completed_month: string; total: string };
  upcomingEvents: { title: string; requested_date: string; status: string; client_name: string; service_type: string }[];
  availableStaff: { name: string; status: string; job_type: string; region: string }[];
  inventory: { item_name: string; total_quantity: number; category: string; in_use: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">대리점 현황</h2>
        <p className="text-gray-500 text-sm mt-1">부가서비스 요청 및 자원 현황</p>
      </div>

      {/* 수치 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-amber-600 font-medium">승인 대기</p>
            <p className="text-2xl font-bold text-amber-700">{c.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-blue-600 font-medium">진행 중</p>
            <p className="text-2xl font-bold text-blue-700">{c.confirmed}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-green-600 font-medium">이번 달 완료</p>
            <p className="text-2xl font-bold text-green-700">{c.completed_month}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 font-medium">전체 요청</p>
            <p className="text-2xl font-bold">{c.total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 예정 일정 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>예정 일정</span>
              <Link href="/user/agency/calendar" className="text-xs text-blue-500 hover:underline font-normal">달력 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-400">예정된 일정이 없습니다</p>
            ) : data.upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge className={`text-[10px] ${STATUS_COLOR[e.status] || ""}`}>{e.status}</Badge>
                <span className="text-gray-500 text-xs">{e.requested_date}</span>
                <span className="font-medium truncate">{e.client_name}</span>
                <span className="text-gray-400 text-xs">{e.service_type}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 가용 인력 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>가용 인력</span>
              <Link href="/user/agency/staff" className="text-xs text-blue-500 hover:underline font-normal">관리 →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.availableStaff.length === 0 ? (
              <p className="text-xs text-gray-400">등록된 인력이 없습니다</p>
            ) : data.availableStaff.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-[10px]">{s.job_type}</Badge>
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-400 text-xs">{s.region}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 기물 재고 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>기물/품목 재고</span>
            <Link href="/user/agency/items" className="text-xs text-blue-500 hover:underline font-normal">관리 →</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.inventory.map((item, i) => {
              const inUse = Number(item.in_use || 0);
              const available = item.total_quantity - inUse;
              return (
                <div key={i} className={`p-2 rounded border text-center ${available <= 0 ? "border-red-200 bg-red-50" : "border-gray-100"}`}>
                  <p className="text-xs font-medium truncate">{item.item_name}</p>
                  <p className="text-lg font-bold">{available}<span className="text-xs text-gray-400">/{item.total_quantity}</span></p>
                  <p className="text-[10px] text-gray-400">{item.category}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
