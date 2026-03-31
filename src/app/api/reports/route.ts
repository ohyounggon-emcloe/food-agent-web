import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry");

  if (useNcloudDb()) {
    let sql = "SELECT * FROM weekly_reports";
    const params: unknown[] = [];

    if (industry && industry !== "all") {
      sql += " WHERE industry = $1";
      params.push(industry);
    }

    sql += " ORDER BY week_start DESC LIMIT 50";

    const data = await query(sql, params);
    return NextResponse.json(data);
  }

  let q = supabase
    .from("weekly_reports")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(50);

  if (industry && industry !== "all") {
    q = q.eq("industry", industry);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
