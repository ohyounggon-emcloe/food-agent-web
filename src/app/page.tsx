"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"loading" | "recovery" | "redirect">("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    const handleAuth = async () => {
      // PKCE: code 파라미터가 있으면 세션으로 교환
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("Code exchange error:", exchangeError);
          setError("인증 링크가 만료되었습니다. 다시 시도해주세요.");
          setMode("recovery");
          return;
        }
      }

      // auth state 변경 감지
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setMode("recovery");
        }
      });

      // 현재 세션 확인
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // recovery 이벤트가 아직 안 왔을 수 있으니 잠시 대기
        setTimeout(() => {
          setMode((prev) => {
            if (prev === "loading") {
              router.replace("/user/dashboard");
              return "redirect";
            }
            return prev;
          });
        }, 1500);
      } else {
        router.replace("/auth/login");
      }
    };

    handleAuth();
  }, [router, searchParams]);

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
