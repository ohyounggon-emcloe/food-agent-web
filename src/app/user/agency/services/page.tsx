"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface ServiceRequest {
  id: number; title: string; service_type: string; requested_date: string;
  status: string; client_name: string; client_id: number; item_name: string;
  service_item_id: number; staff_name: string; assigned_staff_id: number;
  cost: number; remarks: string; quantity: number;
}
interface Client { id: number; client_name: string; }
interface Item { id: number; item_name: string; category: string; }
interface Staff { id: number; name: string; job_type: string; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  requested: { label: "요청", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "확정", color: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-500" },
  expired: { label: "미진행", color: "bg-red-100 text-red-600" },
};

const EMPTY_FORM = {
  client_id: "", service_type: "", title: "", requested_date: "",
  service_item_id: "", assigned_staff_id: "", quantity: "1", cost: "0", remarks: "",
};

function formatDateTime(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AgencyServices() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceRequest | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { codes: serviceCategories } = useCodes("service_category");
  const { codes: serviceStatuses } = useCodes("service_status");

  const fetchAll = () => {
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/agency/services${params}`).then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : []));
    fetch("/api/agency/clients").then(r => r.json()).then(d => {
      const data = d.data || d;
      setClients(Array.isArray(data) ? data : []);
    });
    fetch("/api/agency/items").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []));
    fetch("/api/agency/staff").then(r => r.json()).then(d => setStaffList(Array.isArray(d) ? d : []));
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleSubmit = async () => {
    if (!form.title || !form.requested_date) { toast.error("제목과 날짜를 입력하세요"); return; }

    if (editService) {
      await fetch(`/api/agency/services/${editService.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, client_id: form.client_id || null, service_item_id: form.service_item_id || null,
          assigned_staff_id: form.assigned_staff_id || null, quantity: Number(form.quantity), cost: Number(form.cost),
        }),
      });
      toast.success("서비스 수정 완료");
    } else {
      const checkRes = await fetch("/api/agency/calendar/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_date: form.requested_date, service_item_id: form.service_item_id || null, assigned_staff_id: form.assigned_staff_id || null }),
      });
      const checkData = await checkRes.json();
      if (checkData.hasConflict) { toast.error(`중복 경고: ${checkData.conflicts.join(", ")}`); return; }

      await fetch("/api/agency/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, client_id: form.client_id || null, service_item_id: form.service_item_id || null,
          assigned_staff_id: form.assigned_staff_id || null, quantity: Number(form.quantity), cost: Number(form.cost),
        }),
      });
      toast.success("서비스 등록 완료");
    }
    closeDialog(); fetchAll();
  };

  const handleDelete = async (s: ServiceRequest) => {
    if (!confirm(`"${s.title}" 서비스를 삭제하시겠습니까?`)) return;
    await fetch(`/api/agency/services/${s.id}`, { method: "DELETE" });
    toast.success("삭제 완료"); fetchAll();
  };

  const openEdit = (s: ServiceRequest) => {
    setEditService(s);
    setForm({
      client_id: s.client_id ? String(s.client_id) : "",
      service_type: s.service_type || "",
      title: s.title,
      requested_date: s.requested_date ? s.requested_date.slice(0, 16) : "",
      service_item_id: s.service_item_id ? String(s.service_item_id) : "",
      assigned_staff_id: s.assigned_staff_id ? String(s.assigned_staff_id) : "",
      quantity: String(s.quantity || 1),
      cost: String(s.cost || 0),
      remarks: s.remarks || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditService(null); setForm(EMPTY_FORM); };

  const updateStatus = async (id: number, status: string) => {
    const body: Record<string, unknown> = { status };
    if (status === "completed") body.completed_at = new Date().toISOString();
    await fetch(`/api/agency/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast.success(`상태 변경: ${STATUS_LABEL[status]?.label || status}`);
    fetchAll();
  };

  // native select용 헬퍼
  const clientLabel = (id: string) => clients.find(c => String(c.id) === id)?.client_name || "";
  const itemLabel = (id: string) => items.find(i => String(i.id) === id)?.item_name || "";
  const staffLabel = (id: string) => staffList.find(s => String(s.id) === id)?.name || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">서비스 관리</h2>
          <p className="text-gray-500 text-sm mt-1">부가서비스 요청 {services.length}건</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">전체</option>
            {serviceStatuses.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
          </select>
          <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else { setEditService(null); setForm(EMPTY_FORM); setDialogOpen(true); } }}>
            <DialogTrigger>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />서비스 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editService ? "서비스 수정" : "서비스 요청 등록"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">고객사</label>
                  <select value={form.client_id} onChange={e => setForm(p => ({...p, client_id: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">고객사 선택</option>
                    {clients.map(c => <option key={c.id} value={String(c.id)}>{c.client_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">서비스 유형</label>
                  <select value={form.service_type} onChange={e => setForm(p => ({...p, service_type: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">서비스 유형 선택</option>
                    {serviceCategories.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">서비스 제목 *</label>
                  <Input placeholder="서비스 제목" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">행사 일자</label>
                  <Input type="datetime-local" value={form.requested_date} onChange={e => setForm(p => ({...p, requested_date: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">품목 (선택)</label>
                  <select value={form.service_item_id} onChange={e => setForm(p => ({...p, service_item_id: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">품목 선택</option>
                    {items.filter(i => !form.service_type || i.category === form.service_type).map(i => <option key={i.id} value={String(i.id)}>{i.item_name}</option>)}
                  </select>
                </div>
                {(form.service_type === "인력" || form.assigned_staff_id) && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">인력 배정 (선택)</label>
                    <select value={form.assigned_staff_id} onChange={e => setForm(p => ({...p, assigned_staff_id: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                      <option value="">인력 선택</option>
                      {staffList.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.job_type})</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">수량</label>
                    <Input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">비용 (원)</label>
                    <Input type="number" value={form.cost} onChange={e => setForm(p => ({...p, cost: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">비고</label>
                  <Input placeholder="비고" value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} />
                </div>
                <Button onClick={handleSubmit} className="w-full">{editService ? "수정" : "등록"}</Button>
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
                  <span className="text-xs text-gray-400 shrink-0">{formatDateTime(s.requested_date)}</span>
                  <span className="text-sm font-medium truncate">{s.client_name || "미지정"}</span>
                  <span className="text-xs text-gray-500 truncate">{s.title}</span>
                  {s.item_name && <Badge variant="outline" className="text-[10px]">{s.item_name}</Badge>}
                  {s.staff_name && <Badge variant="outline" className="text-[10px]">{s.staff_name}</Badge>}
                  {s.cost > 0 && <span className="text-xs text-emerald-600">{s.cost.toLocaleString()}원</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.status === "requested" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(s.id, "confirmed")}>확정</Button>}
                  {s.status === "confirmed" && <Button size="sm" variant="outline" className="text-xs h-7 text-green-600" onClick={() => updateStatus(s.id, "completed")}>완료</Button>}
                  {s.status === "requested" && <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400" onClick={() => updateStatus(s.id, "cancelled")}>취소</Button>}
                  {!["cancelled", "expired"].includes(s.status) && (
                    <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
                  )}
                  {!["completed", "cancelled", "expired"].includes(s.status) && (
                    <button onClick={() => handleDelete(s)} className="p-1 rounded hover:bg-slate-100"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  )}
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
