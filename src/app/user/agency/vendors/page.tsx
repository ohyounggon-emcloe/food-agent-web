"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface Vendor { id: number; vendor_name: string; contact_name: string; contact_phone: string; service_type: string; unit_cost: number; notes: string; }
interface VendorItem { id: number; item_name: string; unit_cost: number; notes: string; }
interface ServiceItem { id: number; item_name: string; category: string; }

const EMPTY = { vendor_name: "", contact_name: "", contact_phone: "", service_type: "", unit_cost: "0", notes: "" };
const EMPTY_ITEM = { item_name: "", unit_cost: "0", notes: "" };

export default function AgencyVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { codes: serviceTypes } = useCodes("vendor_service_type");

  // 납품품목 관련
  const [expandedVendor, setExpandedVendor] = useState<number | null>(null);
  const [vendorItems, setVendorItems] = useState<VendorItem[]>([]);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);

  const fetch_ = () => { fetch("/api/agency/vendors").then(r => r.json()).then(d => setVendors(Array.isArray(d) ? d : [])); };
  useEffect(() => {
    fetch_();
    fetch("/api/agency/items").then(r => r.json()).then(d => setServiceItems(Array.isArray(d) ? d : []));
  }, []);

  const handleSubmit = async () => {
    if (!form.vendor_name) { toast.error("업체명 입력"); return; }
    const payload = { ...form, unit_cost: Number(form.unit_cost) };
    if (editVendor) {
      await fetch(`/api/agency/vendors/${editVendor.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast.success("공급사 수정 완료");
    } else {
      await fetch("/api/agency/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast.success("공급사 등록 완료");
    }
    closeDialog(); fetch_();
  };

  const handleDelete = async (v: Vendor) => {
    if (!confirm(`${v.vendor_name}을(를) 삭제하시겠습니까?`)) return;
    await fetch(`/api/agency/vendors/${v.id}`, { method: "DELETE" });
    toast.success("삭제 완료"); fetch_();
  };

  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setForm({ vendor_name: v.vendor_name, contact_name: v.contact_name || "", contact_phone: v.contact_phone || "", service_type: v.service_type || "", unit_cost: String(v.unit_cost || 0), notes: v.notes || "" });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditVendor(null); setForm(EMPTY); };

  // 납품품목 토글
  const toggleVendorItems = async (vendorId: number) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
      return;
    }
    setExpandedVendor(vendorId);
    const res = await fetch(`/api/agency/vendor-items?vendor_id=${vendorId}`);
    const data = await res.json();
    setVendorItems(Array.isArray(data) ? data : []);
    setItemForm(EMPTY_ITEM);
  };

  const addVendorItem = async () => {
    if (!itemForm.item_name || !expandedVendor) return;
    const res = await fetch("/api/agency/vendor-items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: expandedVendor, item_name: itemForm.item_name, unit_cost: Number(itemForm.unit_cost), notes: itemForm.notes }),
    });
    if (res.ok) {
      // 로컬 상태에 직접 추가 (재조회 없음)
      const newItem: VendorItem = {
        id: Date.now(), // 임시 ID
        item_name: itemForm.item_name,
        unit_cost: Number(itemForm.unit_cost),
        notes: itemForm.notes,
      };
      setVendorItems(prev => [...prev, newItem]);
      toast.success("납품품목 추가");
      setItemForm(EMPTY_ITEM);
    }
  };

  const deleteVendorItem = async (itemId: number) => {
    if (!expandedVendor) return;
    await fetch(`/api/agency/vendor-items?id=${itemId}`, { method: "DELETE" });
    setVendorItems(prev => prev.filter(i => i.id !== itemId));
    toast.success("삭제 완료");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">공급사 관리</h2><p className="text-gray-500 text-sm mt-1">{vendors.length}개 업체</p></div>
        <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else { setEditVendor(null); setForm(EMPTY); setDialogOpen(true); } }}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />공급사 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editVendor ? "공급사 수정" : "공급사 등록"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">업체명 *</label>
                <Input value={form.vendor_name} onChange={e => setForm(p => ({...p, vendor_name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">담당자명</label>
                <Input value={form.contact_name} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">연락처</label>
                <Input value={form.contact_phone} onChange={e => setForm(p => ({...p, contact_phone: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">서비스 유형</label>
                <select value={form.service_type} onChange={e => setForm(p => ({...p, service_type: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="">서비스 유형 선택</option>
                  {serviceTypes.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">비고</label>
                <Input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              </div>
              <Button onClick={handleSubmit} className="w-full">{editVendor ? "수정" : "등록"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {vendors.map(v => (
          <Card key={v.id}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <p className="font-medium text-sm flex-1">{v.vendor_name}</p>
                {v.service_type && <Badge variant="outline" className="text-[10px]">{v.service_type}</Badge>}
                <button onClick={() => toggleVendorItems(v.id)} className="p-1 rounded hover:bg-slate-100 flex items-center gap-1 text-xs text-slate-500">
                  <Package className="w-3.5 h-3.5" />납품품목
                  {expandedVendor === v.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button onClick={() => openEdit(v)} className="p-1 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
                <button onClick={() => handleDelete(v)} className="p-1 rounded hover:bg-slate-100"><Trash2 className="w-3.5 h-3.5 text-slate-400" /></button>
              </div>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {v.contact_name && <p>담당: {v.contact_name} {v.contact_phone && `(${v.contact_phone})`}</p>}
                {v.notes && <p className="text-gray-400">{v.notes}</p>}
              </div>

              {/* 납품품목 확장 영역 */}
              {expandedVendor === v.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <p className="text-xs font-semibold text-slate-600">납품 품목/기물</p>
                  {vendorItems.length === 0 && <p className="text-xs text-slate-400">등록된 납품품목이 없습니다</p>}
                  {vendorItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <span className="flex-1 font-medium">{item.item_name}</span>
                      {item.unit_cost > 0 && <span className="text-emerald-600">{item.unit_cost.toLocaleString()}원</span>}
                      {item.notes && <span className="text-slate-400">{item.notes}</span>}
                      <button onClick={() => deleteVendorItem(item.id)} className="p-0.5 rounded hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  ))}
                  {/* 품목 추가 폼 */}
                  <div className="flex gap-2 items-end">
                    <select value={itemForm.item_name} onChange={e => setItemForm(p => ({...p, item_name: e.target.value}))} className="text-xs h-8 flex-1 rounded border border-input bg-background px-2">
                      <option value="">품목 선택</option>
                      {serviceItems.map(i => <option key={i.id} value={i.item_name}>{i.item_name} ({i.category})</option>)}
                    </select>
                    <Input type="number" placeholder="단가" value={itemForm.unit_cost} onChange={e => setItemForm(p => ({...p, unit_cost: e.target.value}))} className="text-xs h-8 w-24 shrink-0" />
                    <Input placeholder="비고" value={itemForm.notes} onChange={e => setItemForm(p => ({...p, notes: e.target.value}))} className="text-xs h-8 flex-1" />
                    <Button size="sm" onClick={addVendorItem} className="h-8 text-xs shrink-0"><Plus className="w-3 h-3 mr-1" />저장</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
