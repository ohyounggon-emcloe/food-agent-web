import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/ncloud-db";

interface PermissionRow {
  target_type: string;
  menu_href: string;
  granted: boolean;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || authResult.user.id;

  try {
    // 사용자 프로필 조회
    const profile = await queryOne<{ user_type: string; role: string }>(
      "SELECT user_type, role FROM user_profiles WHERE id = $1",
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ permissions: [], has_custom: false });
    }

    const userType = profile.user_type || "personal";
    const role = profile.role || "regular";

    // 모든 관련 권한을 한번에 조회 (user_type, role, user)
    const rows = await query<PermissionRow>(
      `SELECT target_type, menu_href, granted FROM menu_permissions
       WHERE (target_type = 'user_type' AND target_value = $1)
          OR (target_type = 'role' AND target_value = $2)
          OR (target_type = 'user' AND target_value = $3)
       ORDER BY
         CASE target_type WHEN 'user_type' THEN 1 WHEN 'role' THEN 2 WHEN 'user' THEN 3 END`,
      [userType, role, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ permissions: [], has_custom: false });
    }

    // 우선순위 병합: user_type → role → user (나중 것이 덮어씀)
    const merged = new Map<string, boolean>();
    for (const row of rows) {
      merged.set(row.menu_href, row.granted);
    }

    const permissions = Array.from(merged.entries()).map(([menu_href, granted]) => ({
      menu_href,
      granted,
    }));

    return NextResponse.json({ permissions, has_custom: true });
  } catch (err) {
    console.error("Permissions check error:", err);
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 });
  }
}
