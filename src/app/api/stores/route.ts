import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";
import { headers } from "next/headers";

function generateStoreCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 매장 목록 조회 (내 매장)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  if (useNcloudDb()) {
    // 관리자: X-Store-Id 헤더로 특정 가게 조회
    const profile = await queryOne<{ role: string }>(
      "SELECT role FROM user_profiles WHERE id = $1",
      [session.user.id]
    );
    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

    if (isAdmin) {
      const headerStore = await headers();
      const selectedStoreId = headerStore.get("x-store-id");
      if (selectedStoreId) {
        const stores = await query(
          `SELECT s.*, 'admin' as my_role FROM stores s WHERE s.id = $1`,
          [Number(selectedStoreId)]
        );
        return NextResponse.json(stores || []);
      }
    }

    // 일반 사용자: 내가 소속된 매장 조회
    const stores = await query(
      `SELECT s.*, sm.role as my_role
       FROM stores s
       JOIN store_members sm ON s.id = sm.store_id
       WHERE sm.user_id = $1 AND sm.is_active = true AND s.is_active = true
       ORDER BY s.created_at DESC`,
      [session.user.id]
    );
    return NextResponse.json(stores || []);
  }

  return NextResponse.json([]);
}

// 매장 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { store_name, business_number, store_type, address, phone } = body;

  if (!store_name || !store_type) {
    return NextResponse.json({ error: "상호명과 업종은 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const storeCode = generateStoreCode();

    // 매장 생성
    const store = await queryOne(
      `INSERT INTO stores (store_code, owner_id, store_name, business_number, store_type, address, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [storeCode, session.user.id, store_name, business_number || null, store_type, address || null, phone || null]
    );

    if (store) {
      // 사장을 store_members에 owner로 등록
      await execute(
        `INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [(store as Record<string, unknown>).id, session.user.id]
      );

      // user_profiles 업데이트
      await execute(
        `UPDATE user_profiles SET user_type = 'business', business_role = 'owner' WHERE id = $1`,
        [session.user.id]
      );
    }

    return NextResponse.json(store, { status: 201 });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}
