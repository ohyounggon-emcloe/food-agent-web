import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const data = await query(
    "SELECT * FROM service_vendors WHERE agency_id = $1 ORDER BY vendor_name",
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
    `INSERT INTO service_vendors (agency_id, vendor_name, contact_name, contact_phone, service_type, unit_cost, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [auth.agencyId, body.vendor_name, body.contact_name, body.contact_phone, body.service_type, body.unit_cost, body.notes]
  );
  return NextResponse.json({ success: true });
}
