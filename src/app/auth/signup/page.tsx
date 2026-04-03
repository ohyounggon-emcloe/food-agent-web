"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegionItem { id: number; sido: string; }
interface IndustryItem { id: number; category: string; sub_type: string; }

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/regions").then(r => r.json()).then(data => {
      let sidos: string[] = [];
      if (Array.isArray(data)) {
        sidos = [...new Set(data.map((r: RegionItem) => r.sido))];
      } else if (data && typeof data === "object") {
        sidos = Object.keys(data);
      }
      setRegions([{ id: -1, sido: "전체" }, ...sidos.map((s, i) => ({ id: i, sido: s }))]);
    }).catch(() => {});
    fetch("/api/industries").then(r => r.json()).then(data => {
      let cats: string[] = [];
      if (Array.isArray(data)) {
        cats = [...new Set(data.map((i: IndustryItem) => i.category))];
      } else if (data && typeof data === "object") {
        cats = Object.keys(data);
      }
      setIndustries([{ id: -1, category: "전체", sub_type: "" }, ...cats.map((c, i) => ({ id: i, category: c, sub_type: "" }))]);
    }).catch(() => {});
  }, []);

  const toggleRegion = (sido: string) => {
    if (sido === "전체") {
      setSelectedRegions(prev => prev.includes("전체") ? [] : ["전체"]);
    } else {
      setSelectedRegions(prev => {
        const without = prev.filter(r => r !== "전체" && r !== sido);
        return prev.includes(sido) ? without : [...without, sido];
      });
    }
  };

  const toggleIndustry = (cat: string) => {
    if (cat === "전체") {
      setSelectedIndustries(prev => prev.includes("전체") ? [] : ["전체"]);
    } else {
      setSelectedIndustries(prev => {
        const without = prev.filter(i => i !== "전체" && i !== cat);
        return prev.includes(cat) ? without : [...without, cat];
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          preferred_regions: selectedRegions.map(s => ({ sido: s })),
          preferred_industries: selectedIndustries.map(c => ({ category: c })),
        },
        emailRedirectTo: "https://aifx.kr/auth/callback",
      },
    });

    if (error) {
      setError(
        error.message === "User already registered"
          ? "이미 가입된 이메일입니다"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/auth/verify");
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{"회원가입"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium">{"이메일 *"}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{"닉네임"}</label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="표시될 이름"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{"비밀번호 *"}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{"비밀번호 확인 *"}</label>
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              required
            />
          </div>

          {/* 관심 지역 선택 */}
          <div>
            <label className="text-sm font-medium block mb-2">{"관심 지역 (선택)"}</label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map(r => (
                <button
                  key={r.sido}
                  type="button"
                  onClick={() => toggleRegion(r.sido)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedRegions.includes(r.sido)
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                  }`}
                >
                  {r.sido}
                </button>
              ))}
            </div>
          </div>

          {/* 관심 업태 선택 */}
          <div>
            <label className="text-sm font-medium block mb-2">{"관심 업태 (선택)"}</label>
            <div className="flex flex-wrap gap-1.5">
              {industries.map(i => (
                <button
                  key={i.category}
                  type="button"
                  onClick={() => toggleIndustry(i.category)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedIndustries.includes(i.category)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {i.category}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {"이미 계정이 있으신가요? "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            {"로그인"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
