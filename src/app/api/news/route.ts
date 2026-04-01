import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, useNcloudDb } from "@/lib/ncloud-db";

// 30초 캐시
export const revalidate = 30;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const riskLevel = searchParams.get("risk_level");
  const search = searchParams.get("search");
  const region = searchParams.get("region");
  const days = Number(searchParams.get("days")) || 7;
  const limit = Number(searchParams.get("limit")) || 100;
  const personalized = searchParams.get("personalized") !== "false";

  const sourceType = searchParams.get("source_type");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  if (useNcloudDb()) {
    const conditions: string[] = ["(publish_date >= $1 OR publish_date IS NULL)"];
    const params: unknown[] = [cutoffStr];
    let paramIdx = 2;

    // source_type 필터
    if (sourceType === "api_feed") {
      conditions.push("source_type = 'api_feed'");
    } else {
      conditions.push("(source_type IS NULL OR source_type != 'api_feed')");
    }

    if (riskLevel && riskLevel !== "all") {
      conditions.push(`risk_level = $${paramIdx}`);
      params.push(riskLevel);
      paramIdx++;
    } else {
      conditions.push("risk_level NOT IN ('해당없음', '미분류')");
      conditions.push("risk_level IS NOT NULL");
    }

    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR site_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (region) {
      conditions.push(`(region IS NULL OR region = $${paramIdx})`);
      params.push(region);
      paramIdx++;
    }

    const sql = `
      SELECT id, title, url, site_name, publish_date, risk_level, summary, has_attachments, region, industry_tags
      FROM collected_info
      WHERE ${conditions.join(" AND ")}
      ORDER BY risk_level ASC, publish_date DESC
      LIMIT $${paramIdx}
    `;
    params.push(limit);

    const data = await query<{
      id: number;
      title: string;
      url: string;
      site_name: string;
      publish_date: string;
      risk_level: string;
      summary: string;
      has_attachments: boolean;
      region: string | null;
      industry_tags: string[];
    }>(sql, params);

    // 개인화 필터: 사용자 선호 지역/업태 기반
    if (personalized && !region) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("preferred_regions, preferred_industries")
        .eq("id", user.id)
        .single();

      const prefRegions = profile?.preferred_regions || [];
      const prefIndustries = profile?.preferred_industries || [];

      if (prefRegions.length > 0 || prefIndustries.length > 0) {
        const prefSidos = prefRegions.map((r: { sido: string }) => r.sido);

        const filtered = (data || []).filter((article: { region: string | null; industry_tags: string[] }) => {
          if (!article.region) return true;
          if (prefSidos.length > 0 && prefSidos.includes(article.region)) return true;
          if (prefIndustries.length > 0 && article.industry_tags) {
            const prefCats = prefIndustries.map((i: { category: string }) => i.category);
            const hasMatch = article.industry_tags.some((tag: string) =>
              prefCats.some((cat: string) => tag.includes(cat) || cat.includes(tag))
            );
            if (hasMatch) return true;
          }
          if (prefSidos.length > 0) return false;
          return true;
        });

        return NextResponse.json(filtered);
      }
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" },
    });
  }

  // Fallback: existing Supabase code
  let q = supabase
    .from("collected_info")
    .select(
      "id, title, url, site_name, publish_date, risk_level, summary, has_attachments, region, industry_tags"
    )
    .gte("publish_date", cutoffStr)
    .order("risk_level", { ascending: true })
    .order("publish_date", { ascending: false })
    .limit(limit);

  // API 수집 데이터 제외
  q = q.or("source_type.is.null,source_type.neq.api_feed");

  if (riskLevel && riskLevel !== "all") {
    q = q.eq("risk_level", riskLevel);
  } else {
    q = q.not("risk_level", "in", '("해당없음","미분류")');
    q = q.not("risk_level", "is", "null");
  }
  if (search) {
    q = q.or(`title.ilike.%${search}%,site_name.ilike.%${search}%`);
  }
  if (region) {
    q = q.or(`region.is.null,region.eq.${region}`);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 개인화 필터: 사용자 선호 지역/업태 기반
  if (personalized && !region) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("preferred_regions, preferred_industries")
      .eq("id", user.id)
      .single();

    const prefRegions = profile?.preferred_regions || [];
    const prefIndustries = profile?.preferred_industries || [];

    // 선호 설정이 있으면 필터링
    if (prefRegions.length > 0 || prefIndustries.length > 0) {
      const prefSidos = prefRegions.map((r: { sido: string }) => r.sido);

      const filtered = (data || []).filter((article: { region: string | null; industry_tags: string[] }) => {
        // 전국(null) 자료는 항상 포함
        if (!article.region) return true;

        // 지역 매칭
        if (prefSidos.length > 0 && prefSidos.includes(article.region)) {
          return true;
        }

        // 업태 매칭
        if (prefIndustries.length > 0 && article.industry_tags) {
          const prefCats = prefIndustries.map((i: { category: string }) => i.category);
          const hasMatch = article.industry_tags.some((tag: string) =>
            prefCats.some((cat: string) => tag.includes(cat) || cat.includes(tag))
          );
          if (hasMatch) return true;
        }

        // 선호 지역이 있지만 매칭 안 되면 제외
        if (prefSidos.length > 0) return false;

        return true;
      });

      return NextResponse.json(filtered);
    }
  }

  return NextResponse.json(data);
}
