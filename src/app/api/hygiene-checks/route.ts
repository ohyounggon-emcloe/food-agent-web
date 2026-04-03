import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

// 점검 기록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const days = Number(searchParams.get("days")) || 30;

  if (!storeId) {
    return NextResponse.json({ error: "storeId 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const checks = await query(
      `SELECT hc.*, up.nickname as checker_name
       FROM hygiene_checks hc
       LEFT JOIN user_profiles up ON hc.checked_by = up.id
       WHERE hc.store_id = $1 AND hc.check_date >= CURRENT_DATE - $2::integer
       ORDER BY hc.check_date DESC, hc.created_at DESC`,
      [Number(storeId), days]
    );
    return NextResponse.json(checks || []);
  }

  return NextResponse.json([]);
}

// 점검 기록 제출
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { store_id, check_type, items, gps_lat, gps_lng, notes } = body;

  if (!store_id || !check_type || !items) {
    return NextResponse.json({ error: "store_id, check_type, items 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const totalItems = Array.isArray(items) ? items.length : 0;
    const passedItems = Array.isArray(items) ? items.filter((i: Record<string, unknown>) => i.result === "O" || i.result === true).length : 0;
    const score = totalItems > 0 ? Math.round((passedItems / totalItems) * 10000) / 100 : 0;

    const check = await queryOne(
      `INSERT INTO hygiene_checks
       (store_id, checked_by, check_date, check_type, items, total_items, passed_items, score, gps_lat, gps_lng, notes)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        store_id, session.user.id, check_type,
        JSON.stringify(items), totalItems, passedItems, score,
        gps_lat || null, gps_lng || null, notes || null,
      ]
    );

    return NextResponse.json(check, { status: 201 });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}

// 점검 승인/반려
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status: newStatus } = body;

  if (!id || !["approved", "rejected"].includes(newStatus)) {
    return NextResponse.json({ error: "id와 status(approved/rejected) 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    await execute(
      "UPDATE hygiene_checks SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3",
      [newStatus, session.user.id, id]
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}
