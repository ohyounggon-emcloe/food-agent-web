"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setInfo("세션이 만료되었습니다. 다시 로그인해주세요.");
    } else if (searchParams.get("reset") === "true") {
      setInfo("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
    } else if (searchParams.get("verified") === "true") {
      setInfo("이메일 인증이 완료되었습니다. 로그인해주세요.");
    } else if (searchParams.get("error") === "expired") {
      setError("인증 링크가 만료되었습니다. 이메일을 입력 후 인증 메일을 재발송해주세요.");
      setShowResend(true);
    } else if (searchParams.get("error") === "unverified") {
      setError("이메일 인증이 필요합니다. 메일함을 확인하거나 인증 메일을 재발송해주세요.");
      setShowResend(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("이메일 또는 비밀번호가 잘못되었습니다.");
        } else if (signInError.message === "Email not confirmed") {
          setError("이메일 인증이 필요합니다. 메일함을 확인하거나 인증 메일을 재발송해주세요.");
          setShowResend(true);
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      setShowResend(false);
      // 로그인 성공 → full reload로 이동 (쿠키가 미들웨어에 반영되도록)
      window.location.href = "/user/dashboard";
    } catch {
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{"로그인"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {info && (
            <div className="bg-blue-50 text-blue-600 text-sm p-3 rounded-md">
              {info}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              <p>{error}</p>
              {showResend && (
                <button
                  type="button"
                  disabled={resending || !email}
                  onClick={async () => {
                    if (!email) { setError("이메일을 입력해주세요."); return; }
                    setResending(true);
                    try {
                      const res = await fetch("/api/auth/resend", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setError("");
                        setShowResend(false);
                        setInfo("인증 메일이 재발송되었습니다. 메일함을 확인해주세요.");
                      } else {
                        setError(data.error || "재발송에 실패했습니다.");
                      }
                    } catch {
                      setError("재발송 중 오류가 발생했습니다.");
                    }
                    setResending(false);
                  }}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {resending ? "발송 중..." : "인증 메일 재발송"}
                </button>
              )}
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
          <div>
            <label className="text-sm font-medium">{"비밀번호"}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
        <div className="text-center text-sm text-gray-500 mt-4 space-y-2">
          <p>
            <Link href="/auth/reset-password" className="text-teal-500 hover:underline">
              {"비밀번호를 잊으셨나요?"}
            </Link>
          </p>
          <p>
            {"계정이 없으신가요? "}
            <Link href="/auth/signup" className="text-teal-500 hover:underline">
              {"회원가입"}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
