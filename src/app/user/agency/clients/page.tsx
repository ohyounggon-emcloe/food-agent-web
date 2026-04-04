"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: number;
  client_name: string;
  client_type: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  supply_items: string;
  notes: string;
}

export default function AgencyClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_type: "", contact_name: "", contact_phone: "", address: "", supply_items: "", notes: "" });

  const fetchClients = () => {
    fetch("/api/agency/clients").then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {});
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSubmit = async () => {
    if (!form.client_name) { toast.error("고객사명을 입력하세요"); return; }
    const res = await fetch("/api/agency/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("고객사 등록 완료"); setDialogOpen(false); setForm({ client_name: "", client_type: "", contact_name: "", contact_phone: "", address: "", supply_items: "", notes: "" }); fetchClients(); }
  };

  const filtered = clients.filter(c => !search || c.client_name.includes(search) || (c.contact_name || "").includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">고객사 관리</h2>
          <p className="text-gray-500 text-sm mt-1">납품 고객사 {clients.length}개</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />고객사 등록</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>고객사 등록</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="고객사명 *" value={form.client_name} onChange={e => setForm(p => ({...p, client_name: e.target.value}))} />
              <Input placeholder="업종 (식당, 단체급식, 학교 등)" value={form.client_type} onChange={e => setForm(p => ({...p, client_type: e.target.value}))} />
              <Input placeholder="담당자명" value={form.contact_name} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} />
              <Input placeholder="연락처" value={form.contact_phone} onChange={e => setForm(p => ({...p, contact_phone: e.target.value}))} />
              <Input placeholder="주소" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
              <Input placeholder="납품 품목" value={form.supply_items} onChange={e => setForm(p => ({...p, supply_items: e.target.value}))} />
              <Input placeholder="비고" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              <Button onClick={handleSubmit} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="고객사명 또는 담당자 검색..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{c.client_name}</span>
                {c.client_type && <Badge variant="outline" className="text-[10px]">{c.client_type}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-gray-600">
              {c.contact_name && <p>담당: {c.contact_name} {c.contact_phone && `(${c.contact_phone})`}</p>}
              {c.address && <p>주소: {c.address}</p>}
              {c.supply_items && <p>납품: {c.supply_items}</p>}
              {c.notes && <p className="text-gray-400">{c.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
