"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StoreJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      setError("6자리 매장 코드를 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stores/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_code: code.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`"${data.store_name}" 매장에 가입되었습니다!`);
        setTimeout(() => router.push("/user/store/dashboard"), 1500);
      } else {
        setError(data.error || "가입 실패");
      }
    } catch {
      setError("가입 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold">매장 코드로 가입</h2>
      <p className="text-gray-500 text-sm">사장님이 알려준 6자리 매장 코드를 입력하세요.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">매장 코드 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md">{success}</div>}

            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />

            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading ? "가입 중..." : "매장 가입하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
