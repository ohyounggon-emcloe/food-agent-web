import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, execute } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");

  // 일자 지난 요청/확정 서비스를 미진행으로 자동 변경
  await execute(
    `UPDATE service_requests SET status = 'expired'
     WHERE agency_id = $1 AND status IN ('requested', 'confirmed')
     AND requested_date < CURRENT_DATE`,
    [auth.agencyId]
  );

  let sql = `SELECT sr.*, ac.client_name, si.item_name, as2.name as staff_name
    FROM service_requests sr
    LEFT JOIN agency_clients ac ON sr.client_id = ac.id
    LEFT JOIN service_items si ON sr.service_item_id = si.id
    LEFT JOIN agency_staff as2 ON sr.assigned_staff_id = as2.id
    WHERE sr.agency_id = $1`;
  const params: unknown[] = [auth.agencyId];
  let idx = 2;

  if (status && status !== "all") {
    sql += ` AND sr.status = $${idx}`;
    params.push(status);
    idx++;
  }
  if (clientId) {
    sql += ` AND sr.client_id = $${idx}`;
    params.push(clientId);
    idx++;
  }

  sql += " ORDER BY sr.requested_date DESC";
  const data = await query(sql, params);
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const { client_id, service_item_id, service_type, title, requested_date, end_date, vendor_id, assigned_staff_id, quantity, cost, remarks } = body;

  if (!title || !requested_date || !service_type) {
    return NextResponse.json({ error: "title, requested_date, service_type required" }, { status: 400 });
  }

  // 서버사이드 재고 검증
  if (service_item_id) {
    const stock = await queryOne<{ total_quantity: number; used: string }>(
      `SELECT si.total_quantity,
        (SELECT count(*) FROM service_requests sr2
         WHERE sr2.service_item_id = si.id
         AND sr2.requested_date = $2
         AND sr2.status IN ('requested','confirmed')) as used
       FROM service_items si
       WHERE si.id = $1 AND si.agency_id = $3`,
      [service_item_id, requested_date, auth.agencyId]
    );
    if (stock) {
      const used = Number(stock.used || 0);
      const reqQty = Number(quantity) || 1;
      if ((used + reqQty) > stock.total_quantity) {
        return NextResponse.json(
          { error: `재고 부족 (보유 ${stock.total_quantity}, 사용중 ${used}, 요청 ${reqQty})` },
          { status: 400 }
        );
      }
    }
  }

  await execute(
    `INSERT INTO service_requests (agency_id, client_id, service_item_id, service_type, title, requested_date, end_date, vendor_id, assigned_staff_id, quantity, cost, remarks, registered_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [auth.agencyId, client_id, service_item_id, service_type, title, requested_date, end_date, vendor_id, assigned_staff_id, quantity || 1, cost || 0, remarks, auth.user.id]
  );
  return NextResponse.json({ success: true });
}
