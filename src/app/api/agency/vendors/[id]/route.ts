import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const fields = ["vendor_name", "contact_name", "contact_phone", "service_type", "unit_cost", "notes"];
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  for (const f of fields) {
    if (body[f] !== undefined) {
      sets.push(`${f} = $${idx}`);
      vals.push(body[f]);
      idx++;
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: "no fields" }, { status: 400 });

  vals.push(id, auth.agencyId);
  await execute(`UPDATE service_vendors SET ${sets.join(", ")} WHERE id = $${idx} AND agency_id = $${idx + 1}`, vals);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  await execute("DELETE FROM service_vendors WHERE id = $1 AND agency_id = $2", [id, auth.agencyId]);
  return NextResponse.json({ success: true });
}
