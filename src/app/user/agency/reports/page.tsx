"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReportRow { group_name: string; service_type: string; count: string; total_cost: string; }

export default function AgencyReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [groupBy, setGroupBy] = useState("client");
  const today = new Date();
  const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [startDate, setStartDate] = useState(monthAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const fetchReport = async () => {
    const res = await fetch(`/api/agency/reports?start=${startDate}&end=${endDate}&group=${groupBy}`);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  };

  const totalCost = rows.reduce((s, r) => s + Number(r.total_cost || 0), 0);
  const totalCount = rows.reduce((s, r) => s + Number(r.count || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">정산 리포트</h2>
        <p className="text-gray-500 text-sm mt-1">기간별 서비스 이용 내역 및 비용 정산</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">시작일</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">종료일</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value)}
          className="h-9 w-32 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="client">고객사별</option>
          <option value="vendor">공급사별</option>
        </select>
        <Button onClick={fetchReport}>조회</Button>
      </div>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{groupBy === "client" ? "고객사별" : "공급사별"} 정산 ({startDate} ~ {endDate})</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2">{groupBy === "client" ? "고객사" : "공급사"}</th>
                  <th className="text-left py-2">서비스 유형</th>
                  <th className="text-right py-2">건수</th>
                  <th className="text-right py-2">비용</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r.group_name || "미지정"}</td>
                    <td className="py-2 text-gray-600">{r.service_type}</td>
                    <td className="py-2 text-right">{r.count}건</td>
                    <td className="py-2 text-right">{Number(r.total_cost || 0).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="py-2" colSpan={2}>합계</td>
                  <td className="py-2 text-right">{totalCount}건</td>
                  <td className="py-2 text-right">{totalCost.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
