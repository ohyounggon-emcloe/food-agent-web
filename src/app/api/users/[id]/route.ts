import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();

  const allowedFields = ["role", "nickname"];
  const updateData: Record<string, string> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  if (useNcloudDb()) {
    try {
      const setClauses = Object.keys(updateData).map((k, i) => `${k} = $${i + 1}`);
      const values = [...Object.values(updateData), id];
      const sql = `UPDATE user_profiles SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
      const rows = await query(sql, values);

      // Supabase에도 동기화
      await supabase.from("user_profiles").update(updateData).eq("id", id);

      return NextResponse.json(rows?.[0] || {});
    } catch (err) {
      console.error("Users PATCH NCloud error:", err);
    }
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
