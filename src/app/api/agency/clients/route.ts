import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const data = await query(
    "SELECT * FROM agency_clients WHERE agency_id = $1 ORDER BY client_name",
    [auth.agencyId]
  );
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const { client_name, client_type, contact_name, contact_phone, address, contract_start, contract_end, supply_items, notes } = body;

  if (!client_name) {
    return NextResponse.json({ error: "client_name required" }, { status: 400 });
  }

  await execute(
    `INSERT INTO agency_clients (agency_id, client_name, client_type, contact_name, contact_phone, address, contract_start, contract_end, supply_items, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [auth.agencyId, client_name, client_type, contact_name, contact_phone, address, contract_start, contract_end, supply_items, notes]
  );
  return NextResponse.json({ success: true });
}
