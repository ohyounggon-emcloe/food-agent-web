import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentName = searchParams.get("agent_name");
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit")) || 100;

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (agentName) {
      conditions.push(`agent_name = $${paramIdx}`);
      params.push(agentName);
      paramIdx++;
    }
    if (status) {
      conditions.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit);

    const data = await query(
      `SELECT * FROM system_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx}`,
      params
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  let q = supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agentName) {
    q = q.eq("agent_name", agentName);
  }
  if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
