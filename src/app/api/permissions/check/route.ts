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
    const profile = await queryOne<{ user_type: string; role: string }>(
      "SELECT user_type, role FROM user_profiles WHERE id = $1",
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ permissions: [], has_custom: false });
    }

    const role = profile.role || "regular";

    // admin/super_admin은 모든 메뉴 접근 → 권한 체크 불필요
    if (["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ permissions: [], has_custom: false });
    }

    const userType = profile.user_type || "personal";

    // 우선순위: user_type(2순위) → user(1순위, 나중에 덮어씀)
    const rows = await query<PermissionRow>(
      `SELECT target_type, menu_href, granted FROM menu_permissions
       WHERE (target_type = 'user_type' AND target_value = $1)
          OR (target_type = 'user' AND target_value = $2)
       ORDER BY
         CASE target_type WHEN 'user_type' THEN 1 WHEN 'user' THEN 2 END`,
      [userType, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ permissions: [], has_custom: false });
    }

    // 우선순위 병합: user_type → user (개별 설정이 덮어씀)
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
