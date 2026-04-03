"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, AlertCircle, User } from "lucide-react";

interface HealthCert {
  id: number;
  doc_name: string | null;
  file_url: string;
  expiry_date: string | null;
  created_at: string;
}

export default function HealthCertsPage() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [certs, setCerts] = useState<HealthCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStore(data[0]);
      })
      .catch(() => {});
  }, []);

  const fetchCerts = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/store-documents?storeId=${store.id}&docType=health_cert`);
      const data = await res.json();
      setCerts(Array.isArray(data) ? data : []);
    } catch {
      setCerts([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const handleUpload = async (file: File) => {
    if (!store || !staffName.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", String(store.id));
      formData.append("docType", "health_cert");
      formData.append("docName", staffName);

      const uploadRes = await fetch("/api/upload/document", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const uploadData = await uploadRes.json();

      await fetch("/api/store-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          doc_type: "health_cert",
          doc_name: staffName,
          file_url: uploadData.url,
          expiry_date: expiryDate || null,
        }),
      });

      setStaffName("");
      setExpiryDate("");
      fetchCerts();
    } catch {
      // 에러
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/store-documents?id=${id}`, { method: "DELETE" });
    fetchCerts();
  };

  const today = new Date();

  const getStatus = (cert: HealthCert) => {
    if (!cert.expiry_date) return { label: "만료일 미등록", color: "bg-gray-100 border-gray-200", dot: "bg-gray-400", text: "text-gray-500" };
    const exp = new Date(cert.expiry_date);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { label: `만료 (${Math.abs(diff)}일 전)`, color: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-600" };
    if (diff <= 30) return { label: `${diff}일 후 만료`, color: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-600" };
    return { label: `유효 (${diff}일 남음)`, color: "bg-green-50 border-green-200", dot: "bg-green-500", text: "text-green-600" };
  };

  if (!store) return <div className="text-center py-16 text-gray-400">매장을 먼저 등록해주세요.</div>;

  const expiredCount = certs.filter((c) => c.expiry_date && new Date(c.expiry_date) < today).length;
  const expiringCount = certs.filter((c) => {
    if (!c.expiry_date) return false;
    const diff = Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000);
    return diff > 0 && diff <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">직원 보건증 관리</h2>
        <Badge variant="outline" className="text-xs">등록 {certs.length}명</Badge>
      </div>

      {/* 경고 */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            {expiredCount > 0 && <p className="text-red-600 font-semibold">만료된 보건증 {expiredCount}건 — 즉시 갱신 필요 (과태료 최대 100만원)</p>}
            {expiringCount > 0 && <p className="text-amber-600">30일 이내 만료 예정 {expiringCount}건</p>}
          </div>
        </div>
      )}

      {/* 등록 폼 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">보건증 등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">직원명 *</label>
              <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="홍길동" className="h-9" />
            </div>
            <div>
              <label className="text-xs text-gray-500">만료일</label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-9" />
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => {
            if (!staffName.trim()) { alert("직원명을 입력해주세요"); return; }
            fileRef.current?.click();
          }} disabled={uploading} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중..." : "보건증 사진 촬영/업로드"}
          </Button>
        </CardContent>
      </Card>

      {/* 보건증 카드 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : certs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">등록된 보건증이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {certs.map((cert) => {
            const status = getStatus(cert);
            return (
              <Card key={cert.id} className={`${status.color} overflow-hidden`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{cert.doc_name || "직원"}</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                          <span className={`text-[10px] ${status.text}`}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(cert.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">만료일: {cert.expiry_date || "-"}</span>
                    <a href={cert.file_url} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-white">보기</Badge>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
