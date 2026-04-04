"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Vendor { id: number; vendor_name: string; contact_name: string; contact_phone: string; service_type: string; unit_cost: number; notes: string; }

export default function AgencyVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ vendor_name: "", contact_name: "", contact_phone: "", service_type: "", unit_cost: "0", notes: "" });

  const fetch_ = () => { fetch("/api/agency/vendors").then(r => r.json()).then(d => setVendors(Array.isArray(d) ? d : [])); };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async () => {
    if (!form.vendor_name) { toast.error("업체명 입력"); return; }
    await fetch("/api/agency/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, unit_cost: Number(form.unit_cost) }) });
    toast.success("공급사 등록 완료"); setDialogOpen(false); fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">공급사 관리</h2><p className="text-gray-500 text-sm mt-1">{vendors.length}개 업체</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />공급사 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>공급사 등록</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="업체명 *" value={form.vendor_name} onChange={e => setForm(p => ({...p, vendor_name: e.target.value}))} />
              <Input placeholder="담당자명" value={form.contact_name} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} />
              <Input placeholder="연락처" value={form.contact_phone} onChange={e => setForm(p => ({...p, contact_phone: e.target.value}))} />
              <Input placeholder="서비스 유형 (커피차, 조리사 등)" value={form.service_type} onChange={e => setForm(p => ({...p, service_type: e.target.value}))} />
              <Input type="number" placeholder="단가 (원)" value={form.unit_cost} onChange={e => setForm(p => ({...p, unit_cost: e.target.value}))} />
              <Input placeholder="비고" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              <Button onClick={handleSubmit} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vendors.map(v => (
          <Card key={v.id}><CardContent className="py-3">
            <p className="font-medium text-sm">{v.vendor_name}</p>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {v.contact_name && <p>담당: {v.contact_name} {v.contact_phone && `(${v.contact_phone})`}</p>}
              {v.service_type && <p>유형: {v.service_type}</p>}
              {v.unit_cost > 0 && <p>단가: {v.unit_cost.toLocaleString()}원</p>}
              {v.notes && <p className="text-gray-400">{v.notes}</p>}
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
