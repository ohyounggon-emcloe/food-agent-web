import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/ncloud-db";

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

  // agency_id 조회
  const profile = await queryOne<{ agency_id: number; user_type: string }>(
    "SELECT agency_id, user_type FROM user_profiles WHERE id = $1",
    [user.id]
  );

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
