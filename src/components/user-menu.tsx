"use client";

import { useAuth } from "@/providers/auth-provider";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { profile, role, loading, signOut } = useAuth();

  if (loading) {
    return <div className="text-xs text-gray-400">{"..."}</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
        <span className="text-sm font-medium text-gray-700 truncate">
          {profile.nickname || profile.email.split("@")[0]}
        </span>
      </div>
      <p className="text-xs text-gray-400 truncate">{profile.email}</p>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs h-7 text-gray-500 hover:text-red-600"
        onClick={signOut}
      >
        {"로그아웃"}
      </Button>
    </div>
  );
}
