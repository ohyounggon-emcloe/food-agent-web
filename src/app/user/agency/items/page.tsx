"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Item { id: number; item_name: string; category: string; total_quantity: number; unit_cost: number; vendor_name: string; in_use: string; }

export default function AgencyItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "기물대여", item_name: "", total_quantity: "1", unit_cost: "0", description: "" });

  const fetch_ = () => { fetch("/api/agency/items").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])); };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async () => {
    if (!form.item_name) { toast.error("품목명 입력"); return; }
    await fetch("/api/agency/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, total_quantity: Number(form.total_quantity), unit_cost: Number(form.unit_cost) }) });
    toast.success("품목 등록 완료"); setDialogOpen(false); fetch_();
  };

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">품목/기물 관리</h2><p className="text-gray-500 text-sm mt-1">{items.length}개 품목</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />품목 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>품목 등록</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v || ""}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="기물대여">기물 대여</SelectItem>
                  <SelectItem value="행사">행사 지원</SelectItem>
                  <SelectItem value="인력">인력 지원</SelectItem>
                  <SelectItem value="현물">현물/배달</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="품목명 *" value={form.item_name} onChange={e => setForm(p => ({...p, item_name: e.target.value}))} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="보유 수량" value={form.total_quantity} onChange={e => setForm(p => ({...p, total_quantity: e.target.value}))} />
                <Input type="number" placeholder="단가 (원)" value={form.unit_cost} onChange={e => setForm(p => ({...p, unit_cost: e.target.value}))} />
              </div>
              <Input placeholder="설명" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
              <Button onClick={handleSubmit} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">{cat}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.filter(i => i.category === cat).map(item => {
              const inUse = Number(item.in_use || 0);
              const available = item.total_quantity - inUse;
              return (
                <Card key={item.id} className={available <= 0 ? "border-red-200" : ""}>
                  <CardContent className="py-3 text-center">
                    <p className="text-sm font-medium truncate">{item.item_name}</p>
                    <p className="text-2xl font-bold mt-1">{available}<span className="text-xs text-gray-400">/{item.total_quantity}</span></p>
                    {inUse > 0 && <Badge className="text-[10px] bg-amber-100 text-amber-700 mt-1">사용 중 {inUse}</Badge>}
                    {item.unit_cost > 0 && <p className="text-[10px] text-gray-400 mt-1">{item.unit_cost.toLocaleString()}원</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
