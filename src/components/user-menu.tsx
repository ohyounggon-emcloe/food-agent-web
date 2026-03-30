"use client";

import { useAuth } from "@/providers/auth-provider";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { profile, role, loading, signOut } = useAuth();

  if (loading) {
    return <div className="text-xs text-slate-500">{"..."}</div>;
  }

  if (!profile) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">세션 만료</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm h-8 mt-1 border-slate-600 text-slate-200 hover:text-white hover:bg-red-600 hover:border-red-600"
          onClick={signOut}
        >
          {"로그아웃"}
        </Button>
      </div>
    );
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
        className="w-full text-sm h-8 mt-1 border-slate-600 text-slate-200 hover:text-white hover:bg-red-600 hover:border-red-600"
        onClick={signOut}
      >
        {"로그아웃"}
      </Button>
    </div>
  );
}
