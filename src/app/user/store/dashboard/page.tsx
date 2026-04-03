"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StoreDashboard() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStore(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 p-8">로딩 중...</div>;

  if (!store) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">우리가게 위생관리</h2>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-amber-700 mb-2">매장이 등록되지 않았습니다</p>
            <p className="text-sm text-amber-600 mb-4">매장을 등록하거나 매장 코드로 가입하세요.</p>
            <div className="flex justify-center gap-3">
              <a href="/user/store/setup" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
                매장 등록하기
              </a>
              <a href="/user/store/join" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                매장 코드로 가입
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{store.store_name as string}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {store.store_type as string} · {store.address as string || "주소 미등록"}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          매장코드: {store.store_code as string}
        </Badge>
      </div>

      {/* 리스크 게이지 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-gray-500">위생 점수</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">--</p>
            <p className="text-[10px] text-gray-400">점검 데이터 필요</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-gray-500">이번 달 점검</p>
            <p className="text-3xl font-bold mt-1">0</p>
            <p className="text-[10px] text-gray-400">건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-gray-500">만료 임박 서류</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">0</p>
            <p className="text-[10px] text-gray-400">건</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">빠른 실행</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <a href="/user/store/check" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium">일일 점검하기</p>
                <p className="text-xs text-gray-400">사진 기반 체크리스트</p>
              </div>
            </a>
            <a href="/user/store/documents" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📁</span>
              <div>
                <p className="text-sm font-medium">서류함</p>
                <p className="text-xs text-gray-400">보건증, 사업자증 관리</p>
              </div>
            </a>
            <a href="/user/store/health-certs" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-2xl">💳</span>
              <div>
                <p className="text-sm font-medium">직원 보건증</p>
                <p className="text-xs text-gray-400">만료일 관리</p>
              </div>
            </a>
            <a href="/user/store/shield" className="flex items-center gap-3 p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-sm font-medium text-red-600">점검 대응</p>
                <p className="text-xs text-gray-400">원스톱 리포트</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
