import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAuth, isAuthError } from "@/lib/api-auth";

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

    let query = supabase
      .from("crackdown_alerts")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (alertType && alertType !== "all") {
      query = query.eq("alert_type", alertType);
    }
    if (region && region !== "all") {
      query = query.eq("region", region);
    }

    const { data, error } = await query.limit(100);

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
