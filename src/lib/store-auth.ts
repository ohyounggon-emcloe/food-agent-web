import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/ncloud-db";
import { headers } from "next/headers";

interface StoreUser {
  user: { id: string; email?: string };
  storeId: number;
}

/**
 * 가게 권한 검증
 * - 일반 사용자: store_members에서 본인 소속 가게 조회
 * - 관리자: X-Store-Id 헤더로 가게 선택 가능
 */
export async function requireStoreAuth(
  supabase: SupabaseClient
): Promise<StoreUser | NextResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  // 프로필에서 role 확인
  const profile = await queryOne<{ role: string }>(
    "SELECT role FROM user_profiles WHERE id = $1",
    [user.id]
  );

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  // 관리자: X-Store-Id 헤더로 가게 선택
  if (isAdmin) {
    const headerStore = await headers();
    const selectedStoreId = headerStore.get("x-store-id");
    if (selectedStoreId) {
      return { user, storeId: Number(selectedStoreId) };
    }
  }

  // 일반 사용자: store_members에서 본인 가게 조회
  const membership = await queryOne<{ store_id: number }>(
    "SELECT store_id FROM store_members WHERE user_id = $1 AND is_active = true LIMIT 1",
    [user.id]
  );

  if (!membership?.store_id) {
    return NextResponse.json(
      { error: "가게 정보가 없습니다", code: "STORE_NOT_FOUND" },
      { status: 400 }
    );
  }

  return { user, storeId: membership.store_id };
}

export function isStoreAuthError(
  result: StoreUser | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
