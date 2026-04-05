import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

// 고객사별 최근 12개월 품목/인력 사용 횟수 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");

  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  try {
    // 최근 12개월간 해당 고객사의 품목별 사용 횟수 (취소 제외)
    const itemUsage = await query<{ service_item_id: number; usage_count: string }>(
      `SELECT service_item_id, count(*) as usage_count
       FROM service_requests
       WHERE agency_id = $1 AND client_id = $2
         AND service_item_id IS NOT NULL
         AND status != 'cancelled'
         AND requested_date >= NOW() - INTERVAL '12 months'
       GROUP BY service_item_id`,
      [auth.agencyId, clientId]
    );

    // 최근 12개월간 해당 고객사의 인력별 사용 횟수 (취소 제외)
    const staffUsage = await query<{ assigned_staff_id: number; usage_count: string }>(
      `SELECT assigned_staff_id, count(*) as usage_count
       FROM service_requests
       WHERE agency_id = $1 AND client_id = $2
         AND assigned_staff_id IS NOT NULL
         AND status != 'cancelled'
         AND requested_date >= NOW() - INTERVAL '12 months'
       GROUP BY assigned_staff_id`,
      [auth.agencyId, clientId]
    );

    // 고객사 매출 조회 (최근 12개월 합계)
    const revenueRows = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM client_revenue
       WHERE agency_id = $1 AND client_id = $2
         AND year_month >= to_char(NOW() - INTERVAL '12 months', 'YYYY-MM')`,
      [auth.agencyId, clientId]
    );
    const totalRevenue = Math.round(Number(revenueRows[0]?.total || 0) / 10000); // 만원 단위

    return NextResponse.json({
      item_usage: Object.fromEntries(itemUsage.map(r => [r.service_item_id, Number(r.usage_count)])),
      staff_usage: Object.fromEntries(staffUsage.map(r => [r.assigned_staff_id, Number(r.usage_count)])),
      total_revenue: totalRevenue,
    });
  } catch (err) {
    console.error("Usage GET error:", err);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
