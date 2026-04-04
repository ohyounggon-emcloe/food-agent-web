import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendor_id");

  if (!vendorId) {
    return NextResponse.json({ error: "vendor_id required" }, { status: 400 });
  }

  const data = await query(
    "SELECT * FROM vendor_items WHERE vendor_id = $1 AND agency_id = $2 ORDER BY item_name",
    [vendorId, auth.agencyId]
  );
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { vendor_id, item_name, unit_cost = 0, notes = "" } = await request.json();

  if (!vendor_id || !item_name) {
    return NextResponse.json({ error: "vendor_id, item_name required" }, { status: 400 });
  }

  await execute(
    "INSERT INTO vendor_items (vendor_id, agency_id, item_name, unit_cost, notes) VALUES ($1, $2, $3, $4, $5)",
    [vendor_id, auth.agencyId, item_name, unit_cost, notes]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await execute("DELETE FROM vendor_items WHERE id = $1 AND agency_id = $2", [id, auth.agencyId]);
  return NextResponse.json({ success: true });
}
