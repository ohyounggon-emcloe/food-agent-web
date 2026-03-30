import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let query = supabase
    .from("collected_info")
    .select(
      "id, title, url, site_name, publish_date, risk_level, summary, has_attachments, region, industry_tags"
    )
    .gte("publish_date", cutoffStr)
    .order("publish_date", { ascending: false })
    .limit(limit);

  if (riskLevel && riskLevel !== "all") {
    query = query.eq("risk_level", riskLevel);
  } else {
    // 기본: '해당없음' 제외 (사용자 페이지에서는 보이지 않음)
    query = query.neq("risk_level", "해당없음");
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,site_name.ilike.%${search}%`);
  }
  if (region) {
    // 명시적 지역 필터: 전국(null) + 해당 지역
    query = query.or(`region.is.null,region.eq.${region}`);
  }

  const { data, error } = await query;

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
