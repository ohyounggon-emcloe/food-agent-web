"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

interface Receipt {
  id: number;
  doc_name: string | null;
  file_url: string;
  created_at: string;
}

export default function StoreReceiptsPage() {
  const [store, setStore] = useState<Record<string, unknown> | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStore(data[0]);
      })
      .catch(() => {});
  }, []);

  const fetchReceipts = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/store-documents?storeId=${store.id}&docType=origin_cert`);
      const data = await res.json();
      setReceipts(Array.isArray(data) ? data : []);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const handleUpload = async (file: File) => {
    if (!store) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", String(store.id));
      formData.append("docType", "origin_cert");
      formData.append("docName", description || `거래명세서_${new Date().toLocaleDateString("ko-KR")}`);

      const uploadRes = await fetch("/api/upload/document", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const uploadData = await uploadRes.json();

      await fetch("/api/store-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          doc_type: "origin_cert",
          doc_name: description || `거래명세서_${new Date().toLocaleDateString("ko-KR")}`,
          file_url: uploadData.url,
        }),
      });

      setDescription("");
      fetchReceipts();
    } catch {
      // 에러
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/store-documents?id=${id}`, { method: "DELETE" });
    fetchReceipts();
  };

  // 날짜별 그룹핑
  const grouped: Record<string, Receipt[]> = {};
  for (const r of receipts) {
    const date = r.created_at?.split("T")[0] || "unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(r);
  }

  if (!store) return <div className="text-center py-16 text-gray-400">매장을 먼저 등록해주세요.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">식재료 증빙</h2>
        <Badge variant="outline" className="text-xs">{receipts.length}건</Badge>
      </div>
      <p className="text-gray-500 text-sm">거래명세서, 원산지 증명서를 촬영하여 보관합니다.</p>

      {/* 업로드 */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 (예: OO마트 거래명세서, 한우 원산지증명)"
            className="h-9"
          />
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
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중..." : "사진 촬영/업로드"}
          </Button>
        </CardContent>
      </Card>

      {/* 날짜별 사진첩 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 증빙 사진이 없습니다.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {new Date(date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} ({items.length}건)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((r) => (
                <Card key={r.id} className="overflow-hidden">
                  <a href={r.file_url} target="_blank" rel="noreferrer">
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  </a>
                  <CardContent className="py-2 flex items-center justify-between">
                    <p className="text-xs text-gray-600 truncate flex-1">{r.doc_name || "증빙"}</p>
                    <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
