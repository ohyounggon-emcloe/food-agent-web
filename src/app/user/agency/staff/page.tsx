"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface StaffMember { id: number; name: string; gender: string; age: number; region: string; has_vehicle: boolean; job_type: string; phone: string; status: string; active_assignments: string; unit_cost: number; }

const EMPTY = { name: "", gender: "", age: "", region: "", has_vehicle: false, job_type: "", phone: "", unit_cost: "0" };

export default function AgencyStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { codes: genders } = useCodes("gender");
  const { codes: jobTypes } = useCodes("job_type");

  const fetch_ = () => { fetch("/api/agency/staff").then(r => r.json()).then(d => setStaff((Array.isArray(d) ? d : []).filter((s: StaffMember) => s.status !== "inactive"))); };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async () => {
    if (!form.name) { toast.error("이름 입력"); return; }
    const payload = { ...form, age: Number(form.age) || null, unit_cost: Number(form.unit_cost) || 0 };
    if (editStaff) {
      await fetch(`/api/agency/staff/${editStaff.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast.success("인력 수정 완료");
    } else {
      await fetch("/api/agency/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      toast.success("인력 등록 완료");
    }
    closeDialog(); fetch_();
  };

  const handleDelete = async (s: StaffMember) => {
    if (!confirm(`${s.name}을(를) 삭제하시겠습니까?`)) return;
    await fetch(`/api/agency/staff/${s.id}`, { method: "DELETE" });
    toast.success("삭제 완료"); fetch_();
  };

  const openEdit = (s: StaffMember) => {
    setEditStaff(s);
    setForm({ name: s.name, gender: s.gender || "", age: String(s.age || ""), region: s.region || "", has_vehicle: s.has_vehicle, job_type: s.job_type || "", phone: s.phone || "", unit_cost: String(s.unit_cost || 0) });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditStaff(null); setForm(EMPTY); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">인력 관리</h2><p className="text-gray-500 text-sm mt-1">{staff.length}명</p></div>
        <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else { setEditStaff(null); setForm(EMPTY); setDialogOpen(true); } }}>
          <DialogTrigger><Button size="sm"><Plus className="w-4 h-4 mr-1" />인력 등록</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editStaff ? "인력 수정" : "인력 등록"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">이름 *</label>
                <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">성별</label>
                  <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    <option value="">성별 선택</option>
                    {genders.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">나이</label>
                  <Input type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">지역 (시/구/동)</label>
                <Input placeholder="예: 서울 강남구 역삼동" value={form.region} onChange={e => setForm(p => ({...p, region: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">직무</label>
                <select value={form.job_type} onChange={e => setForm(p => ({...p, job_type: e.target.value}))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="">직무 선택</option>
                  {jobTypes.map(c => <option key={c.code_value} value={c.code_value}>{c.code_label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">연락처</label>
                <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">일일 단가 (원)</label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm(p => ({...p, unit_cost: e.target.value}))} />
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_vehicle} onChange={e => setForm(p => ({...p, has_vehicle: e.target.checked}))} />차량 보유</label>
              <Button onClick={handleSubmit} className="w-full">{editStaff ? "수정" : "등록"}</Button>
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
            {s.unit_cost > 0 && <span className="text-xs text-emerald-500">{s.unit_cost.toLocaleString()}원</span>}
            {Number(s.active_assignments) > 0 && <span className="text-xs text-amber-500">배정 {s.active_assignments}건</span>}
            <span className="text-xs text-gray-400 ml-auto">{s.phone}</span>
            <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
            <button onClick={() => handleDelete(s)} className="p-1 rounded hover:bg-slate-100"><X className="w-3.5 h-3.5 text-slate-400" /></button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
