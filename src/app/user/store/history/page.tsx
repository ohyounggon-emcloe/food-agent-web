"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface HygieneCheck {
  id: number;
  check_date: string;
  check_type: string;
  total_items: number;
  passed_items: number;
  score: number;
  status: string;
  checker_name: string | null;
  checked_by: string;
  items: Record<string, unknown>[];
  created_at: string;
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  submitted: { label: "검토 대기", color: "bg-amber-100 text-amber-700" },
  approved: { label: "승인", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
};

export default function StoreHistoryPage() {
  const [checks, setChecks] = useState<HygieneCheck[]>([]);
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState("staff");

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStore(data[0]);
          setMyRole((data[0].my_role as string) || "staff");
        }
      })
      .catch(() => {});
  }, []);

  const fetchChecks = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hygiene-checks?storeId=${store.id}&days=30`);
      const data = await res.json();
      setChecks(Array.isArray(data) ? data : []);
    } catch {
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const handleApprove = async (checkId: number, status: "approved" | "rejected") => {
    await fetch("/api/hygiene-checks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: checkId, status }),
    });
    fetchChecks();
  };

  // 통계
  const totalChecks = checks.length;
  const avgScore = totalChecks > 0
    ? Math.round(checks.reduce((s, c) => s + (c.score || 0), 0) / totalChecks)
    : 0;
  const pendingCount = checks.filter((c) => c.status === "submitted").length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">점검 현황/통계</h2>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-2">
          <CardContent className="text-center pb-0 pt-0">
            <p className="text-xs text-gray-500">이번 달 점검</p>
            <p className="text-2xl font-bold">{totalChecks}<span className="text-sm text-gray-400">건</span></p>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="text-center pb-0 pt-0">
            <p className="text-xs text-gray-500">평균 점수</p>
            <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
              {avgScore}<span className="text-sm text-gray-400">점</span>
            </p>
          </CardContent>
        </Card>
        <Card className={`py-2 ${pendingCount > 0 ? "border-amber-200" : ""}`}>
          <CardContent className="text-center pb-0 pt-0">
            <p className="text-xs text-gray-500">검토 대기</p>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : ""}`}>
              {pendingCount}<span className="text-sm text-gray-400">건</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 점검 이력 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : checks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>점검 기록이 없습니다.</p>
          <a href="/user/store/check" className="text-teal-600 hover:underline text-sm mt-2 block">일일 점검하기 →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check) => {
            const st = STATUS_STYLE[check.status] || STATUS_STYLE.submitted;
            const isExpanded = expandedId === check.id;

            return (
              <Card key={check.id}>
                <CardContent className="py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : check.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        check.score >= 80 ? "bg-green-100" : check.score >= 60 ? "bg-amber-100" : "bg-red-100"
                      }`}>
                        <span className={`text-sm font-bold ${
                          check.score >= 80 ? "text-green-700" : check.score >= 60 ? "text-amber-700" : "text-red-700"
                        }`}>{Math.round(check.score)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {check.check_date} · {check.check_type === "opening" ? "출근" : "마감"} 점검
                        </p>
                        <p className="text-xs text-gray-400">
                          {check.checker_name || "직원"} · {check.passed_items}/{check.total_items} 적합
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {Array.isArray(check.items) && check.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {(item as Record<string, unknown>).result === "O" ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (item as Record<string, unknown>).result === "X" ? (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="text-gray-600">{(item as Record<string, unknown>).content as string}</span>
                          {(item as Record<string, unknown>).photo_url && (
                            <span className="text-blue-500">📷</span>
                          )}
                        </div>
                      ))}

                      {/* 사장: 승인/반려 */}
                      {myRole === "owner" && check.status === "submitted" && (
                        <div className="flex gap-2 mt-3 pt-2 border-t">
                          <Button size="sm" onClick={() => handleApprove(check.id, "approved")} className="flex-1 bg-green-600 hover:bg-green-700">
                            승인
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(check.id, "rejected")} className="flex-1 text-red-600 border-red-300 hover:bg-red-50">
                            반려
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
