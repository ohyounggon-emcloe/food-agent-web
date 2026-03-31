import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  const { data, error } = await supabase
    .from("food_poisoning_stats")
    .select("*")
    .eq("occurrence_year", year)
    .order("occurrence_month", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 지역별 집계
  const byRegion: Record<string, { incidents: number; patients: number }> = {};
  const byMonth: Record<string, { incidents: number; patients: number }> = {};

  for (const row of data || []) {
    const area = row.occurrence_area;
    const month = row.occurrence_month;
    const inc = row.incident_count || 0;
    const pat = row.patient_count || 0;

    if (!byRegion[area]) byRegion[area] = { incidents: 0, patients: 0 };
    byRegion[area].incidents += inc;
    byRegion[area].patients += pat;

    if (!byMonth[month]) byMonth[month] = { incidents: 0, patients: 0 };
    byMonth[month].incidents += inc;
    byMonth[month].patients += pat;
  }

  const totalIncidents = Object.values(byRegion).reduce((s, r) => s + r.incidents, 0);
  const totalPatients = Object.values(byRegion).reduce((s, r) => s + r.patients, 0);

  return NextResponse.json({
    year,
    totalIncidents,
    totalPatients,
    byRegion: Object.entries(byRegion)
      .map(([region, data]) => ({ region, ...data }))
      .sort((a, b) => b.incidents - a.incidents),
    byMonth: Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    raw: data,
  });
}
