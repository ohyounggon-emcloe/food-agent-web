import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const data = await query(
    `SELECT s.*,
      (SELECT count(*) FROM service_requests sr WHERE sr.assigned_staff_id = s.id AND sr.status = 'confirmed' AND sr.requested_date >= CURRENT_DATE) as active_assignments
    FROM agency_staff s
    WHERE s.agency_id = $1
    ORDER BY s.status, s.name`,
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
    `INSERT INTO agency_staff (agency_id, name, gender, age, region, has_vehicle, job_type, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [auth.agencyId, body.name, body.gender, body.age, body.region, body.has_vehicle || false, body.job_type, body.phone]
  );
  return NextResponse.json({ success: true });
}
