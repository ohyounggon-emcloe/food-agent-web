import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();

  if (useNcloudDb()) {
    const fields = Object.keys(body);
    const values = Object.values(body);
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
    values.push(Number(id));

    const data = await queryOne(
      `UPDATE compliance_data SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("compliance_data")
    .update(body)
    .eq("id", Number(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  if (useNcloudDb()) {
    await execute("DELETE FROM compliance_data WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  }

  // Fallback: existing Supabase code
  const { error } = await supabase
    .from("compliance_data")
    .delete()
    .eq("id", Number(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
