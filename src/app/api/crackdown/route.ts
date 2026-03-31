import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuth(supabase);
    if (isAuthError(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("alert_type");
    const region = searchParams.get("region");
    const days = parseInt(searchParams.get("days") || "30");

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (useNcloudDb()) {
      const conditions: string[] = ["created_at >= $1"];
      const params: unknown[] = [cutoff];
      let paramIdx = 2;

      if (alertType && alertType !== "all") {
        conditions.push(`alert_type = $${paramIdx}`);
        params.push(alertType);
        paramIdx++;
      }
      if (region && region !== "all") {
        conditions.push(`region = $${paramIdx}`);
        params.push(region);
        paramIdx++;
      }

      const data = await query(
        `SELECT * FROM crackdown_alerts
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT 100`,
        params
      );

      return NextResponse.json(data || []);
    }

    // Fallback: existing Supabase code
    let q = supabase
      .from("crackdown_alerts")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (alertType && alertType !== "all") {
      q = q.eq("alert_type", alertType);
    }
    if (region && region !== "all") {
      q = q.eq("region", region);
    }

    const { data, error } = await q.limit(100);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Crackdown API error:", error);
    return NextResponse.json(
      { error: "단속 정보 조회 실패" },
      { status: 500 }
    );
  }
}
