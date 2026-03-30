import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const riskLevel = searchParams.get("risk_level");
  const search = searchParams.get("search");
  const days = Number(searchParams.get("days")) || 7;
  const limit = Number(searchParams.get("limit")) || 100;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let query = supabase
    .from("collected_info")
    .select(
      "id, title, url, site_name, publish_date, risk_level, summary, has_attachments"
    )
    .gte("publish_date", cutoffStr)
    .order("publish_date", { ascending: false })
    .limit(limit);

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("risk_level", riskLevel);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,site_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
