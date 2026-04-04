"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}

function VerifyForm() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) { setError("이메일을 입력해주세요."); return; }
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("인증 메일이 재발송되었습니다. 메일함을 확인해주세요.");
      } else {
        setError(data.error || "재발송에 실패했습니다.");
      }
    } catch {
      setError("재발송 중 오류가 발생했습니다.");
    }
    setResending(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{"이메일 인증"}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          {"가입하신 이메일로 인증 링크를 발송했습니다."}
        </p>
        <p className="text-gray-600">
          {"메일함을 확인하고 인증 링크를 클릭해주세요."}
        </p>
        <p className="text-sm text-gray-400">
          {"메일이 오지 않으면 스팸함을 확인해주세요."}
        </p>

        {message && <div className="bg-blue-50 text-blue-600 text-sm p-3 rounded-md">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}

        <div className="border-t pt-4 space-y-2">
          <p className="text-sm text-gray-500">{"인증 메일이 오지 않나요?"}</p>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="가입 이메일 입력"
            className="text-center"
          />
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full"
          >
            {resending ? "발송 중..." : "인증 메일 재발송"}
          </Button>
        </div>

        <Link href="/auth/login">
          <Button variant="ghost" className="mt-2 text-gray-500">
            {"로그인 페이지로"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
