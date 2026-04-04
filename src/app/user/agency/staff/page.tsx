"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface StaffMember { id: number; name: string; gender: string; age: number; region: string; has_vehicle: boolean; job_type: string; phone: string; status: string; active_assignments: string; }

export default function AgencyStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", gender: "", age: "", region: "", has_vehicle: false, job_type: "조리사", phone: "" });

  const fetch_ = () => { fetch("/api/agency/staff").then(r => r.json()).then(d => setStaff(Array.isArray(d) ? d : [])); };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async () => {
    if (!form.name) { toast.error("이름 입력"); return; }
    await fetch("/api/agency/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, age: Number(form.age) || null }) });
    toast.success("인력 등록 완료"); setDialogOpen(false); fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">인력 관리</h2><p className="text-gray-500 text-sm mt-1">{staff.length}명</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />인력 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>인력 등록</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="이름 *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="성별" value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} />
                <Input placeholder="나이" type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} />
              </div>
              <Input placeholder="지역" value={form.region} onChange={e => setForm(p => ({...p, region: e.target.value}))} />
              <Input placeholder="직무 (조리사, 행사지원 등)" value={form.job_type} onChange={e => setForm(p => ({...p, job_type: e.target.value}))} />
              <Input placeholder="연락처" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_vehicle} onChange={e => setForm(p => ({...p, has_vehicle: e.target.checked}))} />차량 보유</label>
              <Button onClick={handleSubmit} className="w-full">등록</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {staff.map(s => (
          <Card key={s.id}><CardContent className="py-3 flex items-center gap-3">
            <Badge className={`text-[10px] ${s.status === "available" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{s.status === "available" ? "가용" : "배정"}</Badge>
            <span className="font-medium text-sm">{s.name}</span>
            <Badge variant="outline" className="text-[10px]">{s.job_type}</Badge>
            <span className="text-xs text-gray-400">{s.region}</span>
            {s.has_vehicle && <span className="text-xs text-blue-500">🚗</span>}
            {Number(s.active_assignments) > 0 && <span className="text-xs text-amber-500">배정 {s.active_assignments}건</span>}
            <span className="text-xs text-gray-400 ml-auto">{s.phone}</span>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
