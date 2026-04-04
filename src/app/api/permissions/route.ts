import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, execute } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("target_type");
  const targetValue = searchParams.get("target_value");

  try {
    if (targetType && targetValue) {
      const data = await query(
        "SELECT * FROM menu_permissions WHERE target_type = $1 AND target_value = $2 ORDER BY menu_href",
        [targetType, targetValue]
      );
      return NextResponse.json(data);
    }

    const data = await query("SELECT * FROM menu_permissions ORDER BY target_type, target_value, menu_href");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Permissions GET error:", err);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  try {
    const body = await request.json();
    const { target_type, target_value, menu_href, granted = true } = body;

    if (!target_type || !target_value || !menu_href) {
      return NextResponse.json({ error: "target_type, target_value, menu_href are required" }, { status: 400 });
    }

    const validTypes = ["user_type", "role", "user"];
    if (!validTypes.includes(target_type)) {
      return NextResponse.json({ error: "target_type must be user_type, role, or user" }, { status: 400 });
    }

    await execute(
      `INSERT INTO menu_permissions (target_type, target_value, menu_href, granted)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (target_type, target_value, menu_href)
       DO UPDATE SET granted = $4, updated_at = now()`,
      [target_type, target_value, menu_href, granted]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permissions POST error:", err);
    return NextResponse.json({ error: "Failed to save permission" }, { status: 500 });
  }
}
