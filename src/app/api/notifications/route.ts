import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Level1, Level2 위험 게시글 중 최근 것을 알림으로 제공
  let query = supabase
    .from("collected_info")
    .select("id, title, risk_level, site_name, publish_date, url, source_type")
    .in("risk_level", ["Level1", "Level2"])
    .order("publish_date", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("publish_date", since);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 단속 알림도 포함
  let crackdownQuery = supabase
    .from("crackdown_alerts")
    .select("id, title, risk_level, alert_type, region, created_at")
    .in("risk_level", ["Level1", "Level2"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (since) {
    crackdownQuery = crackdownQuery.gt("created_at", since);
  }

  const { data: crackdowns } = await crackdownQuery;

  // 통합 알림 목록
  const notifications = [
    ...(data || []).map((d) => ({
      id: `article-${d.id}`,
      type: "article" as const,
      title: d.title,
      risk_level: d.risk_level,
      source: d.site_name,
      date: d.publish_date,
      url: d.url,
    })),
    ...(crackdowns || []).map((c) => ({
      id: `crackdown-${c.id}`,
      type: "crackdown" as const,
      title: c.title,
      risk_level: c.risk_level,
      source: `${c.alert_type}${c.region ? ` (${c.region})` : ""}`,
      date: c.created_at,
      url: `/user/crackdown`,
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return NextResponse.json({
    count: notifications.length,
    notifications: notifications.slice(0, limit),
  });
}
