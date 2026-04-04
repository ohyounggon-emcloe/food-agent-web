"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface Item { id: number; item_name: string; category: string; total_quantity: number; unit_cost: number; vendor_name: string; in_use: string; is_active: boolean; description: string; }

const EMPTY = { category: "", item_name: "", total_quantity: "1", unit_cost: "0", description: "" };

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function AgencyItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { codes: serviceCategories } = useCodes("service_category");

  const fetch_ = () => { fetch("/api/agency/items").then(r => r.json()).then(d => setItems((Array.isArray(d) ? d : []).filter((i: Item) => i.is_active !== false))); };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async () => {
    if (!form.item_name) { toast.error("품목명 입력"); return; }
    if (editItem) {
      await fetch(`/api/agency/items/${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, total_quantity: Number(form.total_quantity), unit_cost: Number(form.unit_cost) }) });
      toast.success("품목 수정 완료");
    } else {
      await fetch("/api/agency/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, total_quantity: Number(form.total_quantity), unit_cost: Number(form.unit_cost) }) });
      toast.success("품목 등록 완료");
    }
    closeDialog(); fetch_();
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`${item.item_name}을(를) 삭제하시겠습니까?`)) return;
    await fetch(`/api/agency/items/${item.id}`, { method: "DELETE" });
    toast.success("삭제 완료"); fetch_();
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setForm({ category: item.category, item_name: item.item_name, total_quantity: String(item.total_quantity), unit_cost: String(item.unit_cost), description: item.description || "" });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditItem(null); setForm(EMPTY); };

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">품목/기물 관리</h2><p className="text-gray-500 text-sm mt-1">{items.length}개 품목</p></div>
        <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else { setEditItem(null); setForm(EMPTY); setDialogOpen(true); } }}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />품목 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "품목 수정" : "품목 등록"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">카테고리</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v || ""}))}>
                  <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(c => <SelectItem key={c.code_value} value={c.code_value}>{c.code_label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">품목명 *</label>
                <Input value={form.item_name} onChange={e => setForm(p => ({...p, item_name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">보유 수량</label>
                  <Input type="number" value={form.total_quantity} onChange={e => setForm(p => ({...p, total_quantity: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">단가 (원)</label>
                  <Input type="number" value={form.unit_cost} onChange={e => setForm(p => ({...p, unit_cost: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">설명</label>
                <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
              </div>
              <Button onClick={handleSubmit} className="w-full">{editItem ? "수정" : "등록"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 리스트형 테이블 */}
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{cat}</h3>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left py-2 px-3">품목명</th>
                  <th className="text-right py-2 px-3 w-20">보유</th>
                  <th className="text-right py-2 px-3 w-20">사용중</th>
                  <th className="text-right py-2 px-3 w-20">잔여</th>
                  <th className="text-right py-2 px-3 w-24">단가</th>
                  <th className="text-center py-2 px-3 w-16">관리</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i => i.category === cat).map(item => {
                  const inUse = Number(item.in_use || 0);
                  const available = item.total_quantity - inUse;
                  return (
                    <tr key={item.id} className={`border-b last:border-0 ${available <= 0 ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-gray-800">{item.item_name}</span>
                        {item.description && <span className="block text-[11px] text-gray-400 mt-0.5">{item.description}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">{fmt(item.total_quantity)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {inUse > 0 ? <Badge className="text-[10px] bg-amber-100 text-amber-700">{fmt(inUse)}</Badge> : <span className="text-gray-300">0</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={available <= 0 ? "text-red-600 font-bold" : "text-emerald-600 font-semibold"}>{fmt(available)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-600">
                        {item.unit_cost > 0 ? `${fmt(item.unit_cost)}원` : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-slate-100" title="수정">
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDelete(item)} className="p-1 rounded hover:bg-red-50" title="삭제">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
