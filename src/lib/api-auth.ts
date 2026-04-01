import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOne, useNcloudDb } from "@/lib/ncloud-db";

interface AuthResult {
  user: { id: string; email?: string };
  profile: { id: string; email: string; role: string } | null;
  isAdmin: boolean;
}

export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult | NextResponse> {
  // getSession()은 로컬 토큰 기반 — 네트워크 호출 없음
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const user = session.user;

  // NCloud DB에서 profile 조회 (같은 서버 → 빠름)
  let profile: { id: string; email: string; role: string } | null = null;

  if (useNcloudDb()) {
    const row = await queryOne<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM user_profiles WHERE id = $1",
      [user.id]
    );
    profile = row;
  } else {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const role = profile?.role || "regular";

  return {
    user,
    profile,
    isAdmin: ["admin", "super_admin"].includes(role),
  };
}

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(supabase);

  if (result instanceof NextResponse) {
    return result;
  }

  if (!result.isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return result;
}

export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
