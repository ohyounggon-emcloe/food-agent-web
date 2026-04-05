import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { queryOne, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const data = await queryOne(
    "SELECT * FROM agency_clients WHERE id = $1 AND agency_id = $2",
    [id, auth.agencyId]
  );
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const fields = ["client_name", "client_type", "contact_name", "contact_phone", "contact_email", "address", "contract_start", "contract_end", "notes", "status", "excluded_staff_ids", "excluded_item_ids"];
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  const jsonFields = ["excluded_staff_ids", "excluded_item_ids"];
  for (const f of fields) {
    if (body[f] !== undefined) {
      sets.push(`${f} = $${idx}`);
      vals.push(jsonFields.includes(f) ? JSON.stringify(body[f]) : body[f]);
      idx++;
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: "no fields" }, { status: 400 });

  vals.push(id, auth.agencyId);
  await execute(`UPDATE agency_clients SET ${sets.join(", ")} WHERE id = $${idx} AND agency_id = $${idx + 1}`, vals);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  // 실제 삭제 대신 거래중단 상태로 변경
  await execute("UPDATE agency_clients SET status = 'inactive' WHERE id = $1 AND agency_id = $2", [id, auth.agencyId]);
  return NextResponse.json({ success: true });
}
