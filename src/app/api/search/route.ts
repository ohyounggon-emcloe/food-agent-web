import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

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

  if (useNcloudDb()) {
    const conditions: string[] = [
      `(title ILIKE $1 OR summary ILIKE $1 OR site_name ILIKE $1)`,
      `(publish_date >= $2 OR publish_date IS NULL)`,
    ];
    const params: unknown[] = [`%${q}%`, cutoffStr];
    let paramIdx = 3;

    if (!includeAll) {
      conditions.push("risk_level NOT IN ('해당없음', '미분류')");
      conditions.push("risk_level IS NOT NULL");
    }

    if (riskLevel && riskLevel !== "all") {
      conditions.push(`risk_level = $${paramIdx}`);
      params.push(riskLevel);
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");

    // Count query
    const countResult = await queryOne<{ count: string }>(
      `SELECT count(*) FROM collected_info WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || "0");

    // Data query
    const data = await query(
      `SELECT id, title, url, site_name, publish_date, risk_level, summary, region
       FROM collected_info
       WHERE ${whereClause}
       ORDER BY publish_date DESC NULLS LAST
       OFFSET $${paramIdx} LIMIT $${paramIdx + 1}`,
      [...params, from, pageSize]
    );

    return NextResponse.json({
      data: data || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  // Fallback: existing Supabase code
  const to = from + pageSize - 1;

  let searchQuery = supabase
    .from("collected_info")
    .select("id, title, url, site_name, publish_date, risk_level, summary, region", { count: "exact" })
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%,site_name.ilike.%${q}%`)
    .gte("publish_date", cutoffStr);

  // 사용자용: 해당없음/미분류 제외
  if (!includeAll) {
    searchQuery = searchQuery.not("risk_level", "in", '("해당없음","미분류")');
    searchQuery = searchQuery.not("risk_level", "is", "null");
  }

  if (riskLevel && riskLevel !== "all") {
    searchQuery = searchQuery.eq("risk_level", riskLevel);
  }

  searchQuery = searchQuery
    .order("publish_date", { ascending: false })
    .range(from, to);

  const { data, error, count } = await searchQuery;

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
