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
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "unauthorized") {
      setError("관리자 권한이 없습니다. 관리자에게 문의하세요.");
    }
  }, [searchParams]);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 잘못되었습니다"
          : error.message === "Email not confirmed"
            ? "이메일 인증이 필요합니다. 메일함을 확인해주세요"
            : error.message
      );
      setLoading(false);
      return;
    }

    // 역할 체크: 관리자인지 먼저 확인
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setError("프로필 조회 실패. 관리자에게 문의하세요.");
        setLoading(false);
        return;
      }

      const role = profile?.role || "regular";
      if (!["admin", "super_admin"].includes(role)) {
        setError("관리자 권한이 없습니다. 관리자에게 문의하세요.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login check error:", err);
      setError("로그인 처리 중 오류가 발생했습니다.");
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
        <p className="text-center text-sm text-gray-500 mt-4">
          {"계정이 없으신가요? "}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            {"회원가입"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
