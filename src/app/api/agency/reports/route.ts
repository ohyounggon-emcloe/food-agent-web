import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start") || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("end") || new Date().toISOString().split("T")[0];
  const groupBy = searchParams.get("group") || "client";

  // 요약 데이터
  let summarySql: string;
  if (groupBy === "vendor") {
    summarySql = `SELECT sv.vendor_name as group_name, sr.service_type,
      count(*) as count, sum(sr.cost) as total_cost
      FROM service_requests sr
      LEFT JOIN service_vendors sv ON sr.vendor_id = sv.id
      WHERE sr.agency_id = $1 AND sr.requested_date BETWEEN $2 AND $3 AND sr.status = 'completed'
      GROUP BY sv.vendor_name, sr.service_type
      ORDER BY sv.vendor_name`;
  } else {
    summarySql = `SELECT ac.client_name as group_name, sr.service_type,
      count(*) as count, sum(sr.cost) as total_cost
      FROM service_requests sr
      LEFT JOIN agency_clients ac ON sr.client_id = ac.id
      WHERE sr.agency_id = $1 AND sr.requested_date BETWEEN $2 AND $3 AND sr.status = 'completed'
      GROUP BY ac.client_name, sr.service_type
      ORDER BY ac.client_name`;
  }

  const summary = await query(summarySql, [auth.agencyId, startDate, endDate]);

  // 상세 데이터
  const detailSql = `SELECT sr.id, sr.title, sr.service_type, sr.requested_date, sr.cost, sr.quantity,
    ac.client_name, ac.short_name, si.item_name, as2.name as staff_name, sv.vendor_name
    FROM service_requests sr
    LEFT JOIN agency_clients ac ON sr.client_id = ac.id
    LEFT JOIN service_items si ON sr.service_item_id = si.id
    LEFT JOIN agency_staff as2 ON sr.assigned_staff_id = as2.id
    LEFT JOIN service_vendors sv ON sr.vendor_id = sv.id
    WHERE sr.agency_id = $1 AND sr.requested_date BETWEEN $2 AND $3 AND sr.status = 'completed'
    ORDER BY sr.requested_date DESC`;

  const details = await query(detailSql, [auth.agencyId, startDate, endDate]);

  return NextResponse.json({ summary, details });
}
