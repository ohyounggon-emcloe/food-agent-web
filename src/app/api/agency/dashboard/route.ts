import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { queryOne, query } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const [counts, thisMonth, staff, items] = await Promise.all([
    queryOne(
      `SELECT
        count(*) FILTER (WHERE status = 'requested') as pending,
        count(*) FILTER (WHERE status = 'confirmed') as confirmed,
        count(*) FILTER (WHERE status = 'completed' AND completed_at >= date_trunc('month', CURRENT_DATE)) as completed_month,
        count(*) as total
      FROM service_requests WHERE agency_id = $1`,
      [auth.agencyId]
    ),
    query(
      `SELECT sr.title, sr.requested_date, sr.status, ac.client_name, sr.service_type
      FROM service_requests sr
      LEFT JOIN agency_clients ac ON sr.client_id = ac.id
      WHERE sr.agency_id = $1 AND sr.requested_date >= CURRENT_DATE
      ORDER BY sr.requested_date LIMIT 10`,
      [auth.agencyId]
    ),
    query(
      `SELECT name, status, job_type, region FROM agency_staff
      WHERE agency_id = $1 AND status = 'available' LIMIT 10`,
      [auth.agencyId]
    ),
    query(
      `SELECT si.item_name, si.total_quantity, si.category,
        (SELECT count(*) FROM service_requests sr WHERE sr.service_item_id = si.id AND sr.status IN ('requested','confirmed') AND sr.requested_date >= CURRENT_DATE) as in_use
      FROM service_items si WHERE si.agency_id = $1 AND si.is_active = true
      ORDER BY si.category`,
      [auth.agencyId]
    ),
  ]);

  return NextResponse.json({
    counts,
    upcomingEvents: thisMonth,
    availableStaff: staff,
    inventory: items,
  });
}
