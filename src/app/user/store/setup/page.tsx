"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const STORE_TYPES = [
  "일반음식점",
  "배달전문점",
  "단체급식",
  "식품제조가공",
  "식자재유통",
];

export default function StoreSetupPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [storeType, setStoreType] = useState("일반음식점");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError("상호명을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          business_number: businessNumber || null,
          store_type: storeType,
          address: address || null,
          phone: phone || null,
        }),
      });

      if (res.ok) {
        router.push("/user/store/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "등록 실패");
      }
    } catch {
      setError("등록 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold">매장 등록</h2>
      <p className="text-gray-500 text-sm">매장 정보를 등록하면 직원 초대 코드가 자동 생성됩니다.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">매장 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
            )}

            <div>
              <label className="text-sm font-medium">상호명 *</label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="매장 이름" required />
            </div>

            <div>
              <label className="text-sm font-medium">업종 *</label>
              <Select value={storeType} onValueChange={(v) => v && setStoreType(v)}>
                <SelectTrigger><span>{storeType}</span></SelectTrigger>
                <SelectContent>
                  {STORE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">사업자등록번호</label>
              <Input value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} placeholder="000-00-00000" />
            </div>

            <div>
              <label className="text-sm font-medium">주소</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="매장 주소" />
            </div>

            <div>
              <label className="text-sm font-medium">전화번호</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-0000-0000" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "등록 중..." : "매장 등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
