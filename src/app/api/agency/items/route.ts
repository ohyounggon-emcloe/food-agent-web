import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const data = await query(
    `SELECT si.*, sv.vendor_name,
      (SELECT count(*) FROM service_requests sr WHERE sr.service_item_id = si.id AND sr.status IN ('requested','confirmed') AND sr.requested_date >= CURRENT_DATE) as in_use
    FROM service_items si
    LEFT JOIN service_vendors sv ON si.vendor_id = sv.id
    WHERE si.agency_id = $1 AND si.is_active = true
    ORDER BY si.category, si.item_name`,
    [auth.agencyId]
  );
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  await execute(
    `INSERT INTO service_items (agency_id, category, item_name, total_quantity, unit_cost, vendor_id, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [auth.agencyId, body.category, body.item_name, body.total_quantity || 1, body.unit_cost || 0, body.vendor_id, body.description]
  );
  return NextResponse.json({ success: true });
}
