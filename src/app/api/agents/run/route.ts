import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";

const VALID_AGENTS = [
  "scout",
  "analyst",
  "reclassifier",
  "discovery",
  "reporting",
  "orchestrate",
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
