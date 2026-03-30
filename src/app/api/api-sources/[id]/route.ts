import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

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

  const { error } = await supabase
    .from("api_sources")
    .delete()
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
