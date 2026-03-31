import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const fields = Object.keys(body);
    const values = Object.values(body);
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
    values.push(parseInt(id));

    const data = await queryOne(
      `UPDATE api_sources SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("api_sources")
    .update(body)
    .eq("id", parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    await execute("DELETE FROM api_sources WHERE id = $1", [parseInt(id)]);
    return NextResponse.json({ ok: true });
  }

  // Fallback: existing Supabase code
  const { error } = await supabase
    .from("api_sources")
    .delete()
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
