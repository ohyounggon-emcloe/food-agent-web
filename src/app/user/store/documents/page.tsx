"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, AlertCircle } from "lucide-react";

interface StoreDoc {
  id: number;
  doc_type: string;
  doc_name: string | null;
  file_url: string;
  expiry_date: string | null;
  created_at: string;
}

const DOC_TYPES = [
  { value: "business_license", label: "사업자등록증", icon: "📋" },
  { value: "business_permit", label: "영업신고증", icon: "📄" },
  { value: "hygiene_training", label: "위생교육수료증", icon: "🎓" },
  { value: "health_cert", label: "보건증", icon: "💳" },
  { value: "water_test", label: "수질검사 성적서", icon: "💧" },
  { value: "origin_cert", label: "원산지 증명", icon: "🌍" },
  { value: "other", label: "기타", icon: "📎" },
];

export default function StoreDocumentsPage() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [docs, setDocs] = useState<StoreDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("business_license");
  const [docName, setDocName] = useState("");
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

  const fetchDocs = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/store-documents?storeId=${store.id}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (file: File) => {
    if (!store) return;
    setUploading(true);

    try {
      // 1. 파일 업로드
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", String(store.id));
      formData.append("docType", selectedType);
      formData.append("docName", docName);

      const uploadRes = await fetch("/api/upload/document", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const uploadData = await uploadRes.json();

      // 2. DB 등록
      await fetch("/api/store-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          doc_type: selectedType,
          doc_name: docName || file.name,
          file_url: uploadData.url,
          expiry_date: expiryDate || null,
        }),
      });

      setDocName("");
      setExpiryDate("");
      fetchDocs();
    } catch {
      // 에러 처리
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/store-documents?id=${docId}`, { method: "DELETE" });
    fetchDocs();
  };

  // 만료 임박 서류
  const today = new Date();
  const expiringDocs = docs.filter((d) => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
    return diff <= 30 && diff > 0;
  });
  const expiredDocs = docs.filter((d) => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < today;
  });

  if (!store) {
    return <div className="text-center py-16 text-gray-400">매장을 먼저 등록해주세요.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">서류함</h2>

      {/* 만료 경고 */}
      {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold mb-1">
            <AlertCircle className="w-4 h-4" />
            서류 만료 알림
          </div>
          {expiredDocs.map((d) => (
            <p key={d.id} className="text-xs text-red-500">
              ❌ {DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type} — 만료됨 ({d.expiry_date})
            </p>
          ))}
          {expiringDocs.map((d) => (
            <p key={d.id} className="text-xs text-amber-600">
              ⚠️ {DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type} — 30일 이내 만료 ({d.expiry_date})
            </p>
          ))}
        </div>
      )}

      {/* 업로드 폼 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">서류 등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">서류 종류</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">만료일 (선택)</label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-9" />
            </div>
          </div>
          <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="서류명 또는 직원명 (선택)" className="h-9" />

          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중..." : "파일 선택 및 등록"}
          </Button>
        </CardContent>
      </Card>

      {/* 서류 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">등록된 서류가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((doc) => {
            const typeInfo = DOC_TYPES.find((t) => t.value === doc.doc_type);
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < today;

            return (
              <Card key={doc.id} className={isExpired ? "border-red-200" : ""}>
                <CardContent className="py-3 flex items-center gap-3">
                  <span className="text-2xl">{typeInfo?.icon || "📎"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.doc_name || typeInfo?.label || doc.doc_type}</p>
                    <p className="text-xs text-gray-400">
                      {typeInfo?.label}
                      {doc.expiry_date && (
                        <span className={isExpired ? " text-red-500" : ""}> · 만료: {doc.expiry_date}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-gray-50">보기</Badge>
                    </a>
                    <button onClick={() => handleDelete(doc.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
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
