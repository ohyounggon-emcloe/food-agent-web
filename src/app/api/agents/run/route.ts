import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

const VALID_AGENTS = [
  "scout",
  "news_collector",
  "analyst",
  "reclassifier",
  "discovery",
  "reporting",
  "orchestrate",
  "site_recommender",
  "keyword_recommender",
  "collection_strategy",
  "level_classifier",
  "level_validator",
  "level_criteria",
  "health_monitor",
  "improvement_planner",
  "self_improvement",
  "data_quality",
  "embeddings",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { agent } = body;

  if (!agent || !VALID_AGENTS.includes(agent)) {
    return NextResponse.json(
      { error: `Invalid agent. Valid: ${VALID_AGENTS.join(", ")}` },
      { status: 400 }
    );
  }

  if (useNcloudDb()) {
    const data = await queryOne<{ id: number }>(
      `INSERT INTO agent_run_requests (agent_name, status, requested_by)
       VALUES ($1, 'pending', $2)
       RETURNING *`,
      [agent, authResult.user.id]
    );

    return NextResponse.json({
      success: true,
      message: `${agent} 실행 요청 완료`,
      request_id: data?.id,
    });
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("agent_run_requests")
    .insert({
      agent_name: agent,
      status: "pending",
      requested_by: authResult.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `${agent} 실행 요청 완료`,
    request_id: data.id,
  });
}

export async function GET() {
  const supabase = await createClient();

  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const data = await query(
      "SELECT * FROM agent_run_requests ORDER BY requested_at DESC LIMIT 20"
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("agent_run_requests")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
