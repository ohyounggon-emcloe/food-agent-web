import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const clientType = searchParams.get("client_type");

  try {
    // 고객사 목록 (상태 active만, 유형 필터 가능)
    let clientQuery = "SELECT id, client_name, client_type FROM agency_clients WHERE agency_id = $1 AND status = 'active'";
    const clientParams: unknown[] = [auth.agencyId];

    if (clientType && clientType !== "all") {
      clientQuery += " AND client_type = $2";
      clientParams.push(clientType);
    }
    clientQuery += " ORDER BY client_name";

    const clients = await query<{ id: number; client_name: string; client_type: string }>(clientQuery, clientParams);

    // 매출 데이터: 특정 고객사 또는 전체
    let revenueQuery: string;
    let revenueParams: unknown[];

    if (clientId) {
      revenueQuery = "SELECT * FROM client_revenue WHERE agency_id = $1 AND client_id = $2 ORDER BY year_month DESC";
      revenueParams = [auth.agencyId, clientId];
    } else {
      revenueQuery = "SELECT * FROM client_revenue WHERE agency_id = $1 ORDER BY year_month DESC";
      revenueParams = [auth.agencyId];
    }

    const revenue = await query(revenueQuery, revenueParams);

    return NextResponse.json({ clients, revenue });
  } catch (err) {
    console.error("Revenue GET error:", err);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  try {
    const { client_id, year_month, amount, notes = "" } = await request.json();

    if (!client_id || !year_month) {
      return NextResponse.json({ error: "client_id, year_month required" }, { status: 400 });
    }

    await execute(
      `INSERT INTO client_revenue (agency_id, client_id, year_month, amount, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (agency_id, client_id, year_month)
       DO UPDATE SET amount = $4, notes = $5, updated_at = now()`,
      [auth.agencyId, client_id, year_month, Number(amount) || 0, notes]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Revenue POST error:", err);
    return NextResponse.json({ error: "Failed to save revenue" }, { status: 500 });
  }
}
