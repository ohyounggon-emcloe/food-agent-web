"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface Client { id: number; client_name: string; client_type: string; }
interface Revenue { id: number; client_id: number; year_month: string; amount: number; notes: string; }

function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}

export default function AgencyRevenue() {
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { codes: clientTypes } = useCodes("client_type");

  const months = getRecentMonths(12);
  const currentMonth = months[0];

  const [allRevenue, setAllRevenue] = useState<Revenue[]>([]);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("client_type", typeFilter);
    // 전체 매출 조회 (고객사 리스트 평균 표시용)
    const res = await fetch(`/api/agency/revenue?${params}`);
    const data = await res.json();
    setClients(data.clients || []);
    setAllRevenue(data.revenue || []);
    // 선택된 고객사 매출만 필터
    if (selectedClient) {
      setRevenue((data.revenue || []).filter((r: Revenue) => r.client_id === selectedClient.id));
    } else {
      setRevenue(data.revenue || []);
    }
  }, [typeFilter, selectedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 선택된 고객사의 월별 매출 맵
  const revenueMap = new Map<string, Revenue>();
  if (selectedClient) {
    revenue
      .filter(r => r.client_id === selectedClient.id)
      .forEach(r => revenueMap.set(r.year_month, r));
  }

  // 12개월 평균
  const avg12 = selectedClient
    ? Math.round(months.reduce((sum, m) => sum + (revenueMap.get(m)?.amount || 0), 0) / 12)
    : 0;

  // 고객사별 12개월 평균 계산
  const clientAvgMap = new Map<number, number>();
  for (const c of clients) {
    const total = months.reduce((sum, m) => {
      const r = allRevenue.find(rv => rv.client_id === c.id && rv.year_month === m);
      return sum + (r?.amount || 0);
    }, 0);
    clientAvgMap.set(c.id, Math.round(total / 12 / 10000));
  }

  const saveRevenue = async (yearMonth: string) => {
    if (!selectedClient) return;
    const amountManwon = Number(editValues[yearMonth] || 0);
    await fetch("/api/agency/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient.id, year_month: yearMonth, amount: amountManwon * 10000 }),
    });
    toast.success(`${formatMonth(yearMonth)} 매출 저장`);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">고객사 매출 등록</h2>
        <p className="text-gray-500 text-sm mt-1">고객사별 월간 매출을 등록하고 관리합니다</p>
      </div>

      {/* 조회조건 */}
      <div className="flex gap-2">
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setSelectedClient(null); }}
          className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">전체 업종</option>
          {clientTypes.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
        </select>
      </div>

      {/* 좌우 분할 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 좌측: 고객사 리스트 */}
        <div className="bg-white rounded-xl border">
          <div className="p-3 border-b">
            <p className="text-sm font-bold text-slate-700">고객사 ({clients.length})</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClient(c);
                  setEditValues({});
                }}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                  selectedClient?.id === c.id ? "bg-emerald-50 border-l-2 border-emerald-500" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.client_name}</p>
                    {c.client_type && <p className="text-[10px] text-slate-400">{c.client_type}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-600">{(clientAvgMap.get(c.id) || 0).toLocaleString()}만원</p>
                    <p className="text-[9px] text-slate-400">월평균</p>
                  </div>
                </div>
              </button>
            ))}
            {clients.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-400">거래중인 고객사가 없습니다</div>
            )}
          </div>
        </div>

        {/* 우측: 매출 등록 */}
        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className="bg-white rounded-xl border p-12 text-center text-sm text-slate-400">
              좌측에서 고객사를 선택하세요
            </div>
          ) : (
            <div className="space-y-4">
              {/* 12개월 평균 */}
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">12개월 평균 매출</p>
                    <p className="text-xs text-slate-400">{selectedClient.client_name}</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{Math.round(avg12 / 10000).toLocaleString()}만원</p>
                </CardContent>
              </Card>

              {/* 이번달 매출 등록 */}
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="py-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">{formatMonth(currentMonth)} 매출 등록</p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder="매출액"
                        value={editValues[currentMonth] ?? String(Math.round((revenueMap.get(currentMonth)?.amount || 0) / 10000) || "")}
                        onChange={e => { const v = e.target.value.replace(/-/g, ""); setEditValues(p => ({ ...p, [currentMonth]: v })); }}
                        className="flex-1"
                      />
                      <span className="text-sm text-slate-500 shrink-0">만원</span>
                    </div>
                    <Button onClick={() => saveRevenue(currentMonth)} size="sm">
                      <Save className="w-4 h-4 mr-1" />저장
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 최근 12개월 월별 매출 */}
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm font-bold text-slate-700 mb-3">최근 12개월 매출</p>
                  <div className="space-y-2">
                    {months.filter(m => m !== currentMonth).map(m => {
                      const rev = revenueMap.get(m);
                      return (
                        <div key={m} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
                          <span className="text-xs text-slate-500 w-24">{formatMonth(m)}</span>
                          <Input
                            type="number"
                            min="0"
                            value={editValues[m] ?? String(Math.round((rev?.amount || 0) / 10000) || "")}
                            onChange={e => { const v = e.target.value.replace(/-/g, ""); setEditValues(p => ({ ...p, [m]: v })); }}
                            placeholder="0"
                            className="flex-1 h-8 text-sm"
                          />
                          <span className="text-xs text-slate-400 w-20 text-right">
                            {Math.round((rev?.amount || 0) / 10000).toLocaleString()}만원
                          </span>
                          <button onClick={() => saveRevenue(m)} className="p-1 rounded hover:bg-emerald-100">
                            <Save className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
