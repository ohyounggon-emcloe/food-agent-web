"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface ServiceRequest {
  id: number; title: string; service_type: string; requested_date: string;
  status: string; client_name: string; item_name: string; staff_name: string;
  cost: number; remarks: string;
}
interface Client { id: number; client_name: string; }
interface Item { id: number; item_name: string; category: string; }
interface Staff { id: number; name: string; job_type: string; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  requested: { label: "요청", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "확정", color: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-500" },
};

export default function AgencyServices() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", service_type: "기물대여", title: "", requested_date: new Date().toISOString().split("T")[0],
    service_item_id: "", assigned_staff_id: "", quantity: "1", cost: "0", remarks: "",
  });

  const fetchAll = () => {
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/agency/services${params}`).then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : []));
    fetch("/api/agency/clients").then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
    fetch("/api/agency/items").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
    fetch("/api/agency/staff").then(r => r.json()).then(d => setStaffList(Array.isArray(d) ? d : []));
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleSubmit = async () => {
    if (!form.title || !form.requested_date) { toast.error("제목과 날짜를 입력하세요"); return; }

    // 중복 체크
    const checkRes = await fetch("/api/agency/calendar/check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requested_date: form.requested_date, service_item_id: form.service_item_id || null, assigned_staff_id: form.assigned_staff_id || null }),
    });
    const checkData = await checkRes.json();
    if (checkData.hasConflict) {
      toast.error(`중복 경고: ${checkData.conflicts.join(", ")}`);
      return;
    }

    const res = await fetch("/api/agency/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, client_id: form.client_id || null, service_item_id: form.service_item_id || null, assigned_staff_id: form.assigned_staff_id || null, quantity: Number(form.quantity), cost: Number(form.cost) }),
    });
    if (res.ok) { toast.success("서비스 요청 등록 완료"); setDialogOpen(false); fetchAll(); }
  };

  const updateStatus = async (id: number, status: string) => {
    const body: Record<string, unknown> = { status };
    if (status === "completed") body.completed_at = new Date().toISOString();
    await fetch(`/api/agency/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast.success(`상태 변경: ${STATUS_LABEL[status]?.label || status}`);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">서비스 관리</h2>
          <p className="text-gray-500 text-sm mt-1">부가서비스 요청 {services.length}건</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="requested">요청</SelectItem>
              <SelectItem value="confirmed">확정</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />서비스 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>서비스 요청 대리 등록</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.client_id} onValueChange={v => setForm(p => ({...p, client_id: v || ""}))}>
                  <SelectTrigger><SelectValue placeholder="고객사 선택" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.service_type} onValueChange={v => setForm(p => ({...p, service_type: v || ""}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="기물대여">기물 대여</SelectItem>
                    <SelectItem value="행사">행사 지원</SelectItem>
                    <SelectItem value="인력">인력 지원</SelectItem>
                    <SelectItem value="현물">현물/배달</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="서비스 제목 *" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
                <Input type="date" value={form.requested_date} onChange={e => setForm(p => ({...p, requested_date: e.target.value}))} />
                <Select value={form.service_item_id} onValueChange={v => setForm(p => ({...p, service_item_id: v || ""}))}>
                  <SelectTrigger><SelectValue placeholder="품목 선택 (선택)" /></SelectTrigger>
                  <SelectContent>{items.filter(i => i.category === form.service_type).map(i => <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>)}</SelectContent>
                </Select>
                {form.service_type === "인력" && (
                  <Select value={form.assigned_staff_id} onValueChange={v => setForm(p => ({...p, assigned_staff_id: v || ""}))}>
                    <SelectTrigger><SelectValue placeholder="인력 배정 (선택)" /></SelectTrigger>
                    <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.job_type})</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="수량" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} />
                  <Input type="number" placeholder="비용 (원)" value={form.cost} onChange={e => setForm(p => ({...p, cost: e.target.value}))} />
                </div>
                <Input placeholder="비고" value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} />
                <Button onClick={handleSubmit} className="w-full">등록</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {services.map(s => {
          const st = STATUS_LABEL[s.status] || { label: s.status, color: "" };
          return (
            <Card key={s.id}>
              <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge className={`text-[10px] shrink-0 ${st.color}`}>{st.label}</Badge>
                  <span className="text-xs text-gray-400 shrink-0">{s.requested_date}</span>
                  <span className="text-sm font-medium truncate">{s.client_name || "미지정"}</span>
                  <span className="text-xs text-gray-500 truncate">{s.title}</span>
                  {s.item_name && <Badge variant="outline" className="text-[10px]">{s.item_name}</Badge>}
                  {s.staff_name && <Badge variant="outline" className="text-[10px]">{s.staff_name}</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.status === "requested" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "confirmed")}>확정</Button>}
                  {s.status === "confirmed" && <Button size="sm" variant="outline" className="text-xs h-7 text-green-600" onClick={() => updateStatus(s.id, "completed")}>완료</Button>}
                  {s.status !== "completed" && s.status !== "cancelled" && <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400" onClick={() => updateStatus(s.id, "cancelled")}>취소</Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {services.length === 0 && <p className="text-center text-gray-400 py-8">등록된 서비스 요청이 없습니다</p>}
      </div>
    </div>
  );
}
