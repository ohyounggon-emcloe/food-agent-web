import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const riskLevel = searchParams.get("risk_level");
  const days = Number(searchParams.get("days")) || 90;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const includeAll = searchParams.get("includeAll") === "true"; // 관리자용

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [], total: 0, page, pageSize, totalPages: 0 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 검색 쿼리
  let query = supabase
    .from("collected_info")
    .select("id, title, url, site_name, publish_date, risk_level, summary, region, industry_tags", { count: "exact" })
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%,site_name.ilike.%${q}%`)
    .gte("publish_date", cutoffStr);

  // 사용자용: 해당없음/미분류 제외
  if (!includeAll) {
    query = query.not("risk_level", "in", '("해당없음","미분류")');
    query = query.not("risk_level", "is", "null");
  }

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("risk_level", riskLevel);
  }

  query = query
    .order("publish_date", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}
