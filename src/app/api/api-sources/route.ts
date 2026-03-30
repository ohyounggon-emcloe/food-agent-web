import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";

export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { data, error } = await supabase
    .from("api_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, provider, endpoint } = body;

  if (!name || !provider || !endpoint) {
    return NextResponse.json(
      { error: "name, provider, endpoint는 필수입니다" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { data, error } = await supabase
    .from("api_sources")
    .insert({
      name,
      provider,
      endpoint,
      api_key_env: body.api_key_env || null,
      auth_type: body.auth_type || "query_param",
      category: body.category || "food_safety",
      rate_limit_per_min: body.rate_limit_per_min || 30,
      is_active: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
