"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, profile, role, loading, signOut } = useAuth();

  // 세션 만료 시 자동 로그아웃 (user 확인 후에만)
  useEffect(() => {
    if (!loading && !profile && !user) {
      signOut();
    }
  }, [loading, profile, user, signOut]);

  if (loading || (!profile && user)) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-5 w-24 bg-slate-700 rounded" />
        <div className="h-3 w-32 bg-slate-800 rounded" />
        <div className="h-8 w-full bg-slate-800 rounded" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
        <span className="text-sm font-medium text-slate-200 truncate">
          {profile.nickname || profile.email.split("@")[0]}
        </span>
      </div>
      <p className="text-xs text-slate-500 truncate">{profile.email}</p>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-sm h-8 mt-1 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
        onClick={signOut}
      >
        {"로그아웃"}
      </Button>
    </div>
  );
}
