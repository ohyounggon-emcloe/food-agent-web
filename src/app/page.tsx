"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "recovery" | "redirect">("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        return;
      }
    });

    // 3초 후에도 recovery가 아니면 일반 리다이렉트
    const timer = setTimeout(() => {
      setMode((prev) => {
        if (prev === "loading") {
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              router.replace("/user/dashboard");
            } else {
              router.replace("/auth/login");
            }
          });
          return "redirect";
        }
        return prev;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

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
        setError(`변경 실패: ${updateError.message} (${updateError.status || ""})`);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      router.push("/auth/login?reset=true");
    } catch (err) {
      setError(`비밀번호 변경 중 오류: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  if (mode === "recovery") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{"새 비밀번호 설정"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                  {error}
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
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">{"로딩 중..."}</p>
    </div>
  );
}
