"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/update-password` }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("비밀번호 재설정 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{"이메일 전송 완료"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{email}</strong>{"로 비밀번호 재설정 링크를 전송했습니다."}
          </p>
          <p className="text-xs text-gray-400">
            {"메일이 도착하지 않으면 스팸 폴더를 확인해주세요."}
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="mt-2">
              {"로그인 페이지로"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{"비밀번호 재설정"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            {"가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다."}
          </p>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium">{"이메일"}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "전송 중..." : "재설정 링크 전송"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/auth/login" className="text-teal-500 hover:underline">
            {"로그인 페이지로 돌아가기"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
