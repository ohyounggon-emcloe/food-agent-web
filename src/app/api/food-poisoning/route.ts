import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  let rawData: {
    occurrence_area: string;
    occurrence_month: string;
    incident_count: number;
    patient_count: number;
  }[];

  if (useNcloudDb()) {
    rawData = await query<{
      occurrence_area: string;
      occurrence_month: string;
      incident_count: number;
      patient_count: number;
    }>(
      `SELECT * FROM food_poisoning_stats
       WHERE occurrence_year = $1
       ORDER BY occurrence_month ASC`,
      [year]
    );
  } else {
    // Fallback: existing Supabase code
    const { data, error } = await supabase
      .from("food_poisoning_stats")
      .select("*")
      .eq("occurrence_year", year)
      .order("occurrence_month", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rawData = data || [];
  }

  // 지역별 집계
  const byRegion: Record<string, { incidents: number; patients: number }> = {};
  const byMonth: Record<string, { incidents: number; patients: number }> = {};

  for (const row of rawData) {
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
    raw: rawData,
  });
}
