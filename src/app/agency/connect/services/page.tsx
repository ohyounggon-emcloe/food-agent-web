"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ServiceRequest {
  id: number; title: string; service_type: string; requested_date: string;
  status: string; client_name: string; item_name: string; staff_name: string;
  cost: number; quantity: number; remarks: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: "요청", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "확정", color: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-500" },
};

const TYPE_LABEL: Record<string, string> = {
  "기물대여": "기물", "행사": "행사", "인력": "인력", "현물": "현물",
};

export default function ConnectServices() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchServices = () => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/agency/services${params}`)
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => { fetchServices(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/agency/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`상태가 '${STATUS[status]?.label || status}'로 변경되었습니다`);
      fetchServices();
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-800">서비스 관리</h2>

      {/* 필터 */}
      <div className="flex gap-1">
        {[
          { value: "all", label: "전체" },
          { value: "requested", label: "요청" },
          { value: "confirmed", label: "확정" },
          { value: "completed", label: "완료" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filter === f.value ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {services.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">서비스 요청이 없습니다</p>
      ) : (
        services.map(s => (
          <Card key={s.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.client_name || "미지정"} | {s.requested_date}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[s.service_type] || s.service_type}</Badge>
                  <Badge className={`text-[10px] ${STATUS[s.status]?.color || ""}`}>
                    {STATUS[s.status]?.label || s.status}
                  </Badge>
                </div>
              </div>

              {(s.item_name || s.staff_name || s.remarks) && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  {s.item_name && <p>품목: {s.item_name}</p>}
                  {s.staff_name && <p>인력: {s.staff_name}</p>}
                  {s.remarks && <p className="text-gray-400">{s.remarks}</p>}
                </div>
              )}

              {s.cost > 0 && (
                <p className="text-xs text-gray-600">비용: {(s.cost * (s.quantity || 1)).toLocaleString()}원</p>
              )}

              {/* 상태 변경 */}
              <div className="flex gap-2 pt-1">
                {s.status === "requested" && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                      onClick={() => updateStatus(s.id, "confirmed")}>확정</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-red-500"
                      onClick={() => updateStatus(s.id, "cancelled")}>취소</Button>
                  </>
                )}
                {s.status === "confirmed" && (
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                    onClick={() => updateStatus(s.id, "completed")}>완료 처리</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
