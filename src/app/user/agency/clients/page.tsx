"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCodes } from "@/hooks/use-codes";

interface Client {
  id: number;
  client_name: string;
  client_type: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  notes: string;
  status: string;
}

const EMPTY_FORM = { client_name: "", client_type: "", contact_name: "", contact_phone: "", address: "", notes: "" };

export default function AgencyClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { codes: clientTypes } = useCodes("client_type");
  const limit = 20;

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status: statusFilter,
      ...(search && { search }),
      ...(typeFilter !== "all" && { client_type: typeFilter }),
    });
    try {
      const res = await fetch(`/api/agency/clients?${params}`);
      const json = await res.json();
      setClients(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setClients([]);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // 검색 시 1페이지로
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  const handleSubmit = async () => {
    if (!form.client_name) { toast.error("고객사명을 입력하세요"); return; }

    if (editClient) {
      const res = await fetch(`/api/agency/clients/${editClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success("고객사 수정 완료"); closeDialog(); fetchClients(); }
    } else {
      const res = await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success("고객사 등록 완료"); closeDialog(); fetchClients(); }
    }
  };

  const handleDelete = async (client: Client) => {
    const action = client.status === "active" ? "거래중단" : "거래재개";
    if (!confirm(`${client.client_name}을(를) ${action} 처리하시겠습니까?`)) return;

    const newStatus = client.status === "active" ? "inactive" : "active";
    await fetch(`/api/agency/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    toast.success(`${action} 처리 완료`);
    fetchClients();
  };

  const openEdit = (client: Client) => {
    setEditClient(client);
    setForm({
      client_name: client.client_name,
      client_type: client.client_type || "",
      contact_name: client.contact_name || "",
      contact_phone: client.contact_phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditClient(null);
    setForm(EMPTY_FORM);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">고객사 관리</h2>
          <p className="text-gray-500 text-sm mt-1">총 {total}개 고객사</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger>
            <Button size="sm" onClick={() => { setEditClient(null); setForm(EMPTY_FORM); }}>
              <Plus className="w-4 h-4 mr-1" />고객사 등록
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editClient ? "고객사 수정" : "고객사 등록"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="고객사명 *" value={form.client_name} onChange={e => setForm(p => ({...p, client_name: e.target.value}))} />
              <Select value={form.client_type} onValueChange={v => setForm(p => ({...p, client_type: v || ""}))}>
                <SelectTrigger><SelectValue placeholder="업종 선택" /></SelectTrigger>
                <SelectContent>
                  {clientTypes.map(c => (
                    <SelectItem key={c.code_value} value={c.code_value}>{c.code_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="담당자명" value={form.contact_name} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} />
              <Input placeholder="연락처" value={form.contact_phone} onChange={e => setForm(p => ({...p, contact_phone: e.target.value}))} />
              <Input placeholder="주소" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
              <Input placeholder="비고" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              <Button onClick={handleSubmit} className="w-full">
                {editClient ? "수정" : "등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 조회 조건 */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v || "active")}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">거래중</SelectItem>
            <SelectItem value="inactive">거래중단</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 업종</SelectItem>
            {clientTypes.map(c => (
              <SelectItem key={c.code_value} value={c.code_value}>{c.code_label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="고객사명 또는 담당자 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* 고객사 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clients.map(c => (
          <Card key={c.id} className={`hover:shadow-md transition-shadow ${c.status === "inactive" ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {c.client_name}
                  {c.status === "inactive" && (
                    <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">거래중단</Badge>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {c.client_type && <Badge variant="outline" className="text-[10px]">{c.client_type}</Badge>}
                  <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-slate-100">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1 rounded hover:bg-slate-100">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-gray-600">
              {c.contact_name && <p>담당: {c.contact_name} {c.contact_phone && `(${c.contact_phone})`}</p>}
              {c.address && <p>주소: {c.address}</p>}
              {c.notes && <p className="text-gray-400">{c.notes}</p>}
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-slate-400">
            조회된 고객사가 없습니다
          </div>
        )}
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
