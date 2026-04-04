import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { execute } from "@/lib/ncloud-db";

// PATCH: 코드 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { code_label, sort_order, is_active } = body;

  try {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (code_label !== undefined) { sets.push(`code_label = $${idx++}`); values.push(code_label); }
    if (sort_order !== undefined) { sets.push(`sort_order = $${idx++}`); values.push(sort_order); }
    if (is_active !== undefined) { sets.push(`is_active = $${idx++}`); values.push(is_active); }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    sets.push(`updated_at = now()`);
    values.push(id);

    await execute(
      `UPDATE code_master SET ${sets.join(", ")} WHERE id = $${idx}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Codes PATCH error:", err);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

// DELETE: 코드 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    await execute("DELETE FROM code_master WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Codes DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
