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
  const groupBy = searchParams.get("group") || "client"; // client | vendor

  let sql: string;
  if (groupBy === "vendor") {
    sql = `SELECT sv.vendor_name as group_name, sr.service_type,
      count(*) as count, sum(sr.cost) as total_cost
      FROM service_requests sr
      LEFT JOIN service_vendors sv ON sr.vendor_id = sv.id
      WHERE sr.agency_id = $1 AND sr.requested_date BETWEEN $2 AND $3 AND sr.status = 'completed'
      GROUP BY sv.vendor_name, sr.service_type
      ORDER BY sv.vendor_name`;
  } else {
    sql = `SELECT ac.client_name as group_name, sr.service_type,
      count(*) as count, sum(sr.cost) as total_cost
      FROM service_requests sr
      LEFT JOIN agency_clients ac ON sr.client_id = ac.id
      WHERE sr.agency_id = $1 AND sr.requested_date BETWEEN $2 AND $3 AND sr.status = 'completed'
      GROUP BY ac.client_name, sr.service_type
      ORDER BY ac.client_name`;
  }

  const data = await query(sql, [auth.agencyId, startDate, endDate]);
  return NextResponse.json(data);
}
