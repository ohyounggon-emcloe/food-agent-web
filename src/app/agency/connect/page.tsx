"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardCheck, Clock, CheckCircle, Users } from "lucide-react";

interface Client { id: number; client_name: string; }
interface Item { id: number; item_name: string; category: string; total_quantity: number; in_use: string; }
interface Staff { id: number; name: string; job_type: string; }
interface DashboardData {
  counts: { pending: string; confirmed: string; completed_month: string };
  clientCount: string;
}

export default function AgencyConnectHome() {
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_id: "", service_type: "기물대여", title: "",
    requested_date: new Date().toISOString().split("T")[0],
    service_item_id: "", assigned_staff_id: "",
    quantity: "1", cost: "0", remarks: "",
  });

  useEffect(() => {
    fetch("/api/agency/clients").then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/agency/items").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/agency/staff").then(r => r.json()).then(d => setStaffList(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/agency/dashboard").then(r => r.json()).then(setDash).catch(() => {});
  }, []);

  const filteredItems = items.filter(i => i.category === form.service_type);

  const handleSubmit = async () => {
    if (!form.title || !form.requested_date) {
      toast.error("제목과 날짜를 입력하세요");
      return;
    }
    setSubmitting(true);

    // 중복/재고 체크
    const checkRes = await fetch("/api/agency/calendar/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requested_date: form.requested_date,
        service_item_id: form.service_item_id || null,
        assigned_staff_id: form.assigned_staff_id || null,
        quantity: Number(form.quantity) || 1,
      }),
    });
    const checkData = await checkRes.json();
    if (checkData.hasConflict) {
      toast.error(checkData.conflicts.join("\n"));
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/agency/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        client_id: form.client_id || null,
        service_item_id: form.service_item_id || null,
        assigned_staff_id: form.assigned_staff_id || null,
        quantity: Number(form.quantity),
        cost: Number(form.cost),
      }),
    });

    if (res.ok) {
      toast.success("서비스 요청 등록 완료");
      setForm({ ...form, title: "", remarks: "", quantity: "1", cost: "0", service_item_id: "", assigned_staff_id: "" });
      // 대시보드 갱신
      fetch("/api/agency/dashboard").then(r => r.json()).then(setDash).catch(() => {});
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "등록 실패");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* KPI */}
      {dash && (
        <div className="grid grid-cols-4 gap-2">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <p className="text-lg font-bold text-amber-700">{dash.counts.pending}</p>
              <p className="text-[10px] text-amber-600">대기</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <ClipboardCheck className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold text-blue-700">{dash.counts.confirmed}</p>
              <p className="text-[10px] text-blue-600">진행</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-4 h-4 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-green-700">{dash.counts.completed_month}</p>
              <p className="text-[10px] text-green-600">완료</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="w-4 h-4 mx-auto text-gray-500 mb-1" />
              <p className="text-lg font-bold">{dash.clientCount}</p>
              <p className="text-[10px] text-gray-500">고객사</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Order Form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-sm text-gray-800">빠른 서비스 등록</h3>

          <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v || ""})}>
            <SelectTrigger className="h-10"><SelectValue placeholder="고객사 선택" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>)}</SelectContent>
          </Select>

          <div className="grid grid-cols-4 gap-1">
            {["기물대여", "행사", "인력", "현물"].map(t => (
              <button key={t} type="button" onClick={() => setForm({...form, service_type: t, service_item_id: "", assigned_staff_id: ""})}
                className={`py-2 text-xs rounded-lg border transition-colors ${form.service_type === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200"}`}>
                {t === "기물대여" ? "기물" : t}
              </button>
            ))}
          </div>

          <Input placeholder="서비스 제목 *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />

          <Input type="date" value={form.requested_date} onChange={e => setForm({...form, requested_date: e.target.value})} />

          {filteredItems.length > 0 && (
            <Select value={form.service_item_id} onValueChange={v => setForm({...form, service_item_id: v || ""})}>
              <SelectTrigger className="h-10"><SelectValue placeholder="품목 선택" /></SelectTrigger>
              <SelectContent>
                {filteredItems.map(i => {
                  const avail = i.total_quantity - Number(i.in_use || 0);
                  return (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.item_name} {avail <= 0 ? "(재고 없음)" : `(잔여 ${avail})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {form.service_type === "인력" && staffList.length > 0 && (
            <Select value={form.assigned_staff_id} onValueChange={v => setForm({...form, assigned_staff_id: v || ""})}>
              <SelectTrigger className="h-10"><SelectValue placeholder="인력 배정" /></SelectTrigger>
              <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.job_type})</SelectItem>)}</SelectContent>
            </Select>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="수량" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <Input type="number" placeholder="비용 (원)" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
          </div>

          <Input placeholder="메모 (선택)" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />

          <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700">
            {submitting ? "등록 중..." : "서비스 요청 등록"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
