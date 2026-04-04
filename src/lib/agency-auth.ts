import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/ncloud-db";
import { headers } from "next/headers";

interface AgencyUser {
  user: { id: string; email?: string };
  agencyId: number;
}

export async function requireAgencyAuth(
  supabase: SupabaseClient
): Promise<AgencyUser | NextResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 프로필 조회
  const profile = await queryOne<{ agency_id: number; user_type: string; role: string }>(
    "SELECT agency_id, user_type, role FROM user_profiles WHERE id = $1",
    [user.id]
  );

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  // 관리자: X-Agency-Id 헤더로 대리점 선택 가능
  if (isAdmin) {
    const headerStore = await headers();
    const selectedAgencyId = headerStore.get("x-agency-id");
    if (selectedAgencyId) {
      return { user, agencyId: Number(selectedAgencyId) };
    }
    // 관리자이지만 대리점 미선택 → 본인 agency_id 사용 (없으면 에러)
    if (profile?.agency_id) {
      return { user, agencyId: profile.agency_id };
    }
    return NextResponse.json(
      { error: "대리점을 선택해주세요", code: "AGENCY_NOT_SELECTED" },
      { status: 400 }
    );
  }

  // 일반 사용자: agency_id 필수
  if (!profile?.agency_id) {
    return NextResponse.json(
      { error: "대리점 권한이 없습니다" },
      { status: 403 }
    );
  }

  return { user, agencyId: profile.agency_id };
}

export function isAgencyAuthError(
  result: AgencyUser | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
