"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, X, MapPin, Send } from "lucide-react";

interface CheckItem {
  id: number;
  content: string;
  criteria: string;
  method: string;
  result: "O" | "X" | null;
  photo_url: string | null;
}

interface Store {
  id: number;
  store_name: string;
  store_type: string;
  store_code: string;
}

export default function StoreCheckPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkType, setCheckType] = useState<"opening" | "closing">("opening");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "error">("loading");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  // 매장 조회
  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStore(data[0] as Store);
      })
      .catch(() => {});
  }, []);

  // GPS 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("success");
        },
        () => setGpsStatus("error"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsStatus("error");
    }
  }, []);

  // 점검 항목 로드
  const loadItems = useCallback(async () => {
    if (!store) return;
    setLoading(true);

    // 매장 업종에 맞는 점검 항목 조회
    const typeMap: Record<string, string> = {
      "일반음식점": "일반음식점",
      "배달전문점": "배달간편",
      "단체급식": "단체급식",
      "식품제조가공": "식품공장",
      "식자재유통": "식자재납품",
    };
    const category = typeMap[store.store_type] || "일반음식점";

    try {
      const res = await fetch(`/api/inspection?category=${category}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(
          data.map((d: Record<string, unknown>) => ({
            id: d.id as number,
            content: d.content as string,
            criteria: d.criteria as string,
            method: (d.method as string) || "O/X",
            result: null,
            photo_url: null,
          }))
        );
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCheck = (itemId: number, result: "O" | "X") => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, result: item.result === result ? null : result }
          : item
      )
    );
  };

  const handlePhotoUpload = async (itemId: number, file: File) => {
    if (!store) return;
    setUploadingItemId(itemId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("storeId", String(store.id));
    formData.append("photoType", "check_item");

    try {
      const res = await fetch("/api/upload/photo", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, photo_url: data.url } : item
          )
        );
      }
    } catch {
      // 실패 시 무시
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleSubmit = async () => {
    if (!store) return;
    const checkedItems = items.filter((i) => i.result !== null);
    if (checkedItems.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/hygiene-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          check_type: checkType,
          items: items.map((i) => ({
            item_id: i.id,
            content: i.content,
            criteria: i.criteria,
            result: i.result,
            photo_url: i.photo_url,
          })),
          gps_lat: gps?.lat,
          gps_lng: gps?.lng,
        }),
      });

      if (res.ok) {
        router.push("/user/store/history");
      }
    } catch {
      // 에러 처리
    } finally {
      setSubmitting(false);
    }
  };

  // 점검기준별 그룹핑
  const grouped: Record<string, CheckItem[]> = {};
  for (const item of items) {
    if (!grouped[item.criteria]) grouped[item.criteria] = [];
    grouped[item.criteria].push(item);
  }

  const totalChecked = items.filter((i) => i.result !== null).length;
  const totalPassed = items.filter((i) => i.result === "O").length;
  const progress = items.length > 0 ? Math.round((totalChecked / items.length) * 100) : 0;

  if (!store) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">매장을 먼저 등록해주세요.</p>
        <a href="/user/store/setup" className="text-teal-600 hover:underline text-sm mt-2 block">매장 등록하기</a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">일일 위생 점검</h2>
          <p className="text-gray-500 text-sm">{store.store_name} · {store.store_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setCheckType("opening")}
              className={`px-3 py-1 text-xs rounded-full ${checkType === "opening" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              출근 점검
            </button>
            <button
              onClick={() => setCheckType("closing")}
              className={`px-3 py-1 text-xs rounded-full ${checkType === "closing" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              마감 점검
            </button>
          </div>
        </div>
      </div>

      {/* GPS + 진행률 */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <MapPin className={`w-3 h-3 ${gpsStatus === "success" ? "text-green-500" : gpsStatus === "error" ? "text-red-500" : "text-gray-400"}`} />
          <span className={gpsStatus === "success" ? "text-green-600" : "text-gray-400"}>
            {gpsStatus === "success" ? "위치 인증됨" : gpsStatus === "error" ? "위치 확인 실패" : "위치 확인 중..."}
          </span>
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-gray-500">{totalChecked}/{items.length}</span>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingItemId !== null) {
            handlePhotoUpload(uploadingItemId, file);
          }
          e.target.value = "";
        }}
      />

      {/* 점검 항목 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">점검 항목 로딩 중...</div>
      ) : (
        Object.entries(grouped).map(([criteria, groupItems]) => (
          <Card key={criteria}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-gray-700">{criteria}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.result === "O" ? "bg-green-50 border-green-200" :
                    item.result === "X" ? "bg-red-50 border-red-200" :
                    "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
                    {item.photo_url && (
                      <Badge variant="secondary" className="text-[10px] mt-1">📷 사진 첨부됨</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* 카메라 */}
                    <button
                      onClick={() => {
                        setUploadingItemId(item.id);
                        fileInputRef.current?.click();
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        item.photo_url ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    {/* 적합 */}
                    <button
                      onClick={() => handleCheck(item.id, "O")}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        item.result === "O" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-green-100"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    {/* 부적합 */}
                    <button
                      onClick={() => handleCheck(item.id, "X")}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        item.result === "X" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-100"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {/* 제출 버튼 */}
      {items.length > 0 && (
        <div className="sticky bottom-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting || totalChecked === 0}
            className="w-full h-12 text-base gap-2"
          >
            <Send className="w-5 h-5" />
            {submitting ? "제출 중..." : `점검 결과 제출 (${totalPassed}/${totalChecked} 적합)`}
          </Button>
        </div>
      )}
    </div>
  );
}
