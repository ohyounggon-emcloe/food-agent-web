import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "pending";
  const limit = Number(searchParams.get("limit")) || 50;

  let query = supabase
    .from("collected_info")
    .select("id, title, url, site_name, publish_date, risk_level, summary, region, industry_tags")
    .order("publish_date", { ascending: false })
    .limit(limit);

  if (filter === "pending") {
    // 미분류 + 해당없음
    query = query.or("risk_level.eq.미분류,risk_level.eq.해당없음,risk_level.is.null");
  } else if (filter === "해당없음") {
    query = query.eq("risk_level", "해당없음");
  } else if (filter === "미분류") {
    query = query.or("risk_level.eq.미분류,risk_level.is.null");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { id, risk_level, action } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("collected_info")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "deleted" });
  }

  if (risk_level) {
    const { error } = await supabase
      .from("collected_info")
      .update({ risk_level })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "updated" });
  }

  return NextResponse.json({ error: "risk_level or action required" }, { status: 400 });
}
