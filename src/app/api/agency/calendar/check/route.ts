import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const body = await request.json();
  const { requested_date, service_item_id, assigned_staff_id } = body;
  const conflicts: string[] = [];

  // 기물 중복 체크
  if (service_item_id) {
    const itemConflicts = await query(
      `SELECT sr.title, ac.client_name, si.item_name, si.total_quantity,
        (SELECT count(*) FROM service_requests sr2 WHERE sr2.service_item_id = si.id AND sr2.requested_date = $2 AND sr2.status IN ('requested','confirmed')) as used
      FROM service_items si
      LEFT JOIN service_requests sr ON sr.service_item_id = si.id AND sr.requested_date = $2 AND sr.status IN ('requested','confirmed')
      LEFT JOIN agency_clients ac ON sr.client_id = ac.id
      WHERE si.id = $1 AND si.agency_id = $3`,
      [service_item_id, requested_date, auth.agencyId]
    );

    if (itemConflicts?.length) {
      const item = itemConflicts[0] as Record<string, unknown>;
      const used = Number(item.used || 0);
      const total = Number(item.total_quantity || 1);
      if (used >= total) {
        conflicts.push(`${item.item_name}: ${requested_date}에 재고 부족 (보유 ${total}대, 사용 중 ${used}대)`);
      }
    }
  }

  // 인력 중복 체크
  if (assigned_staff_id) {
    const staffConflicts = await query(
      `SELECT sr.title, ac.client_name, s.name as staff_name
      FROM service_requests sr
      JOIN agency_staff s ON sr.assigned_staff_id = s.id
      LEFT JOIN agency_clients ac ON sr.client_id = ac.id
      WHERE sr.assigned_staff_id = $1 AND sr.requested_date = $2 AND sr.status IN ('requested','confirmed') AND sr.agency_id = $3`,
      [assigned_staff_id, requested_date, auth.agencyId]
    );

    if (staffConflicts?.length) {
      const s = staffConflicts[0] as Record<string, unknown>;
      conflicts.push(`${s.staff_name}: ${requested_date}에 이미 ${s.client_name}에 배정됨`);
    }
  }

  return NextResponse.json({ conflicts, hasConflict: conflicts.length > 0 });
}
