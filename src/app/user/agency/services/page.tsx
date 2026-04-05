"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface ServiceRequest {
  id: number; title: string; service_type: string; requested_date: string;
  status: string; client_name: string; client_id: number; item_name: string;
  service_item_id: number; staff_name: string; assigned_staff_id: number;
  cost: number; remarks: string; quantity: number;
}
interface Client { id: number; client_name: string; }
interface Item { id: number; item_name: string; category: string; unit_cost: number; }
interface Staff { id: number; name: string; job_type: string; unit_cost: number; }

interface SelectedItem { item_id: number; item_name: string; quantity: number; unit_cost: number; }
interface SelectedStaff { staff_id: number; name: string; unit_cost: number; }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  requested: { label: "요청", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "확정", color: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-gray-100 text-gray-500" },
  expired: { label: "미진행", color: "bg-red-100 text-red-600" },
};

// 서비스 유형별 선택 가능 항목
const TYPE_CONFIG: Record<string, { showItems: boolean; showStaff: boolean }> = {
  "기물대여": { showItems: true, showStaff: false },
  "행사": { showItems: true, showStaff: true },
  "인력": { showItems: false, showStaff: true },
  "현물": { showItems: true, showStaff: false },
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
  const { codes: serviceCategories } = useCodes("service_category");
  const { codes: serviceStatuses } = useCodes("service_status");

  // 폼 기본 필드
  const [formClientId, setFormClientId] = useState("");
  const [formServiceType, setFormServiceType] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  // 선택된 품목/인원 리스트
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<SelectedStaff[]>([]);

  const config = TYPE_CONFIG[formServiceType] || { showItems: false, showStaff: false };

  // 총 비용 계산
  const itemsCost = selectedItems.reduce((s, i) => s + i.unit_cost * i.quantity, 0);
  const staffCost = selectedStaff.reduce((s, st) => s + st.unit_cost, 0);
  const totalCost = itemsCost + staffCost;

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

  const resetForm = () => {
    setFormClientId(""); setFormServiceType(""); setFormTitle("");
    setFormDate(""); setFormRemarks("");
    setSelectedItems([]); setSelectedStaff([]); setItemCategory("");
  };

  const handleSubmit = async () => {
    if (!formTitle || !formDate) { toast.error("제목과 날짜를 입력하세요"); return; }

    const payload = {
      client_id: formClientId || null,
      service_type: formServiceType,
      title: formTitle,
      requested_date: formDate,
      remarks: formRemarks,
      cost: totalCost,
      // 첫 번째 품목/인원을 메인으로 저장 (호환성)
      service_item_id: selectedItems[0]?.item_id || null,
      assigned_staff_id: selectedStaff[0]?.staff_id || null,
      quantity: selectedItems[0]?.quantity || 1,
    };

    if (editService) {
      await fetch(`/api/agency/services/${editService.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("서비스 수정 완료");
    } else {
      await fetch("/api/agency/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    setFormClientId(s.client_id ? String(s.client_id) : "");
    setFormServiceType(s.service_type || "");
    setFormTitle(s.title);
    setFormDate(s.requested_date ? s.requested_date.slice(0, 16) : "");
    setFormRemarks(s.remarks || "");

    // 기존 품목/인원 복원
    if (s.service_item_id) {
      const item = items.find(i => i.id === s.service_item_id);
      if (item) setSelectedItems([{ item_id: item.id, item_name: item.item_name, quantity: s.quantity || 1, unit_cost: item.unit_cost || 0 }]);
    } else {
      setSelectedItems([]);
    }
    if (s.assigned_staff_id) {
      const staff = staffList.find(st => st.id === s.assigned_staff_id);
      if (staff) setSelectedStaff([{ staff_id: staff.id, name: staff.name, unit_cost: staff.unit_cost || 0 }]);
    } else {
      setSelectedStaff([]);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditService(null); resetForm(); };

  const updateStatus = async (id: number, status: string) => {
    const body: Record<string, unknown> = { status };
    if (status === "completed") body.completed_at = new Date().toISOString();
    await fetch(`/api/agency/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    toast.success(`상태 변경: ${STATUS_LABEL[status]?.label || status}`);
    fetchAll();
  };

  // 품목 추가
  const addItem = (itemId: string) => {
    if (!itemId) return;
    const item = items.find(i => String(i.id) === itemId);
    if (!item || selectedItems.some(si => si.item_id === item.id)) return;
    setSelectedItems(prev => [...prev, { item_id: item.id, item_name: item.item_name, quantity: 1, unit_cost: item.unit_cost || 0 }]);
  };

  const updateItemQty = (itemId: number, qty: number) => {
    setSelectedItems(prev => prev.map(i => i.item_id === itemId ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(prev => prev.filter(i => i.item_id !== itemId));
  };

  // 인원 추가
  const addStaff = (staffId: string) => {
    if (!staffId) return;
    const staff = staffList.find(s => String(s.id) === staffId);
    if (!staff || selectedStaff.some(ss => ss.staff_id === staff.id)) return;
    setSelectedStaff(prev => [...prev, { staff_id: staff.id, name: staff.name, unit_cost: staff.unit_cost || 0 }]);
  };

  const removeStaff = (staffId: number) => {
    setSelectedStaff(prev => prev.filter(s => s.staff_id !== staffId));
  };

  // 품목 카테고리 선택용
  const [itemCategory, setItemCategory] = useState("");
  const itemCategories = [...new Set(items.map(i => i.category))];
  const filteredItems = itemCategory ? items.filter(i => i.category === itemCategory) : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">서비스 관리</h2>
          <p className="text-gray-500 text-sm mt-1">부가서비스 요청 {services.length}건</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 w-28 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">전체</option>
            {serviceStatuses.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
          </select>
          <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else { resetForm(); setEditService(null); setDialogOpen(true); } }}>
            <DialogTrigger>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />서비스 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editService ? "서비스 수정" : "서비스 요청 등록"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">고객사</label>
                  <select value={formClientId} onChange={e => setFormClientId(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">고객사 선택</option>
                    {clients.map(c => <option key={c.id} value={String(c.id)}>{c.client_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">서비스 유형</label>
                  <select value={formServiceType} onChange={e => { setFormServiceType(e.target.value); setSelectedItems([]); setSelectedStaff([]); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">서비스 유형 선택</option>
                    {serviceCategories.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">서비스 제목 *</label>
                  <Input placeholder="서비스 제목" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">행사 날짜</label>
                    <input type="date" value={formDate.split("T")[0] || ""} onChange={e => { const time = formDate.split("T")[1] || "09:00"; setFormDate(`${e.target.value}T${time}`); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">시간</label>
                    <input type="time" value={formDate.split("T")[1] || ""} onChange={e => { const date = formDate.split("T")[0] || ""; setFormDate(`${date}T${e.target.value}`); }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                  </div>
                </div>

                {/* 품목 선택 (기물대여, 행사, 현물) */}
                {config.showItems && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">품목 선택</label>
                    <div className="flex gap-2">
                      <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="w-1/3 h-9 rounded-lg border border-input bg-background px-3 text-sm">
                        <option value="">카테고리</option>
                        {itemCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select onChange={e => { addItem(e.target.value); e.target.value = ""; }} className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm" defaultValue="">
                        <option value="">품목 추가...</option>
                        {filteredItems.filter(i => !selectedItems.some(si => si.item_id === i.id)).map(i => (
                          <option key={i.id} value={String(i.id)}>{i.item_name} ({i.unit_cost?.toLocaleString() || 0}원)</option>
                        ))}
                      </select>
                    </div>
                    {selectedItems.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {selectedItems.map(si => (
                          <div key={si.item_id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="text-sm flex-1">{si.item_name}</span>
                            <Input type="number" min="1" value={si.quantity} onChange={e => updateItemQty(si.item_id, Number(e.target.value))} className="w-16 h-7 text-xs text-center" />
                            <span className="text-xs text-emerald-600 w-20 text-right">{(si.unit_cost * si.quantity).toLocaleString()}원</span>
                            <button onClick={() => removeItem(si.item_id)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 인원 선택 (행사, 인력) */}
                {config.showStaff && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">인원 선택</label>
                    <select onChange={e => { addStaff(e.target.value); e.target.value = ""; }} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" defaultValue="">
                      <option value="">인원 추가...</option>
                      {staffList.filter(s => !selectedStaff.some(ss => ss.staff_id === s.id)).map(s => (
                        <option key={s.id} value={String(s.id)}>{s.name} ({s.job_type}) - {s.unit_cost?.toLocaleString() || 0}원</option>
                      ))}
                    </select>
                    {selectedStaff.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {selectedStaff.map(ss => (
                          <div key={ss.staff_id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <span className="text-sm flex-1">{ss.name}</span>
                            <span className="text-xs text-emerald-600 w-20 text-right">{ss.unit_cost.toLocaleString()}원</span>
                            <button onClick={() => removeStaff(ss.staff_id)} className="p-0.5 rounded hover:bg-red-100"><X className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 총 비용 */}
                {(selectedItems.length > 0 || selectedStaff.length > 0) && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm font-medium text-slate-700">총 비용</span>
                    <span className="text-lg font-bold text-emerald-600">{totalCost.toLocaleString()}원</span>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">비고</label>
                  <Input placeholder="비고" value={formRemarks} onChange={e => setFormRemarks(e.target.value)} />
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
                <div className="flex gap-1 items-center shrink-0">
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)} className="h-7 rounded border border-input bg-background px-2 text-xs">
                    {serviceStatuses.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                  </select>
                  {s.status !== "cancelled" && (
                    <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
                  )}
                  {!["completed", "cancelled"].includes(s.status) && (
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
