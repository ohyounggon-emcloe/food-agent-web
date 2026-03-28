"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateNickname = async () => {
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("닉네임 변경 완료");
      refreshProfile();
    } else {
      toast.error("변경 실패");
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("비밀번호 변경 완료");
      setPassword("");
      setPasswordConfirm("");
    } else {
      const data = await res.json();
      toast.error(data.error || "변경 실패");
    }
  };

  if (!profile) {
    return <p className="text-gray-500">{"로딩 중..."}</p>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold">{"내 정보"}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"계정 정보"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{"이메일"}</span>
            <span className="text-sm">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{"회원 등급"}</span>
            <RoleBadge role={profile.role} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{"가입일"}</span>
            <span className="text-sm text-gray-600">
              {"-"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"닉네임 변경"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
          />
          <Button onClick={handleUpdateNickname} disabled={saving} className="w-full">
            {"닉네임 저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"비밀번호 변경"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
          />
          <Input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
          />
          <Button onClick={handleUpdatePassword} disabled={saving} className="w-full">
            {"비밀번호 변경"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
