import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, execute, queryOne } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "active";
  const clientType = searchParams.get("client_type") || "";
  const offset = (page - 1) * limit;

  try {
    const conditions = ["agency_id = $1"];
    const values: unknown[] = [auth.agencyId];
    let idx = 2;

    if (status && status !== "all") {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }

    if (clientType) {
      conditions.push(`client_type = $${idx++}`);
      values.push(clientType);
    }

    if (search) {
      conditions.push(`(client_name ILIKE $${idx} OR contact_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.join(" AND ");

    const countResult = await queryOne<{ count: string }>(
      `SELECT count(*) FROM agency_clients WHERE ${where}`,
      values
    );
    const total = Number(countResult?.count || 0);

    const data = await query(
      `SELECT * FROM agency_clients WHERE ${where} ORDER BY client_name LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    console.error("Clients GET error:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const { client_name, client_type, short_name, contact_name, contact_phone, contact_email, address, notes, excluded_staff_ids = [], excluded_item_ids = [] } = body;

  if (!client_name) {
    return NextResponse.json({ error: "client_name required" }, { status: 400 });
  }

  await execute(
    `INSERT INTO agency_clients (agency_id, client_name, client_type, short_name, contact_name, contact_phone, contact_email, address, notes, status, excluded_staff_ids, excluded_item_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11)`,
    [auth.agencyId, client_name, client_type, short_name, contact_name, contact_phone, contact_email, address, notes, JSON.stringify(excluded_staff_ids), JSON.stringify(excluded_item_ids)]
  );
  return NextResponse.json({ success: true });
}
