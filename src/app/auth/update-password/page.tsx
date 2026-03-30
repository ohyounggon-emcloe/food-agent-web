"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(`변경 실패: ${updateError.message}`);
        setLoading(false);
        return;
      }

      // 비밀번호 변경 성공
      setSuccess(true);
      supabase.auth.signOut().catch(() => {});
    } catch (err) {
      setError(`오류: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{"비밀번호 변경 완료"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            {"비밀번호가 성공적으로 변경되었습니다."}
          </p>
          <Link href="/auth/login?reset=true">
            <Button className="mt-2">{"로그인 페이지로"}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{"새 비밀번호 설정"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md space-y-2">
              <p>{error}</p>
              <div className="flex gap-2">
                <Link href="/auth/reset-password" className="text-xs text-teal-600 hover:underline">
                  {"재설정 링크 재발송"}
                </Link>
                <span className="text-xs text-gray-300">|</span>
                <Link href="/auth/login" className="text-xs text-teal-600 hover:underline">
                  {"로그인 페이지로"}
                </Link>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">{"새 비밀번호"}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium">{"비밀번호 확인"}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
