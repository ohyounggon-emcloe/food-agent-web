import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, requireAuth, isAuthError } from "@/lib/api-auth";
import { query, execute } from "@/lib/ncloud-db";

// GET: 코드 목록 조회 (일반 사용자도 조회 가능)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("group");

  try {
    if (groupCode) {
      const data = await query(
        "SELECT * FROM code_master WHERE group_code = $1 AND is_active = true ORDER BY sort_order, code_label",
        [groupCode]
      );
      return NextResponse.json(data);
    }

    const data = await query(
      "SELECT * FROM code_master ORDER BY group_code, sort_order, code_label"
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("Codes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}

// POST: 코드 추가 (관리자만)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  try {
    const { group_code, code_value, code_label, sort_order = 0 } = await request.json();

    if (!group_code || !code_value || !code_label) {
      return NextResponse.json({ error: "group_code, code_value, code_label are required" }, { status: 400 });
    }

    await execute(
      `INSERT INTO code_master (group_code, code_value, code_label, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_code, code_value)
       DO UPDATE SET code_label = $3, sort_order = $4, updated_at = now()`,
      [group_code, code_value, code_label, sort_order]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Codes POST error:", err);
    return NextResponse.json({ error: "Failed to save code" }, { status: 500 });
  }
}
