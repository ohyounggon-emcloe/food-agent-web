import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

// 매장 초대 코드로 가입
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { store_code } = body;

  if (!store_code) {
    return NextResponse.json({ error: "매장 코드는 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    // 매장 코드로 매장 찾기
    const store = await queryOne(
      "SELECT id, store_name, store_type FROM stores WHERE store_code = $1 AND is_active = true",
      [store_code.toUpperCase()]
    );

    if (!store) {
      return NextResponse.json({ error: "유효하지 않은 매장 코드" }, { status: 404 });
    }

    const storeId = (store as Record<string, unknown>).id;

    // 이미 가입된 매장인지 확인
    const existing = await queryOne(
      "SELECT id FROM store_members WHERE store_id = $1 AND user_id = $2",
      [storeId, session.user.id]
    );

    if (existing) {
      return NextResponse.json({ error: "이미 가입된 매장" }, { status: 409 });
    }

    // 직원으로 등록
    await execute(
      "INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'staff')",
      [storeId, session.user.id]
    );

    // user_profiles 업데이트
    await execute(
      "UPDATE user_profiles SET user_type = 'business', business_role = 'staff' WHERE id = $1",
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      store_name: (store as Record<string, unknown>).store_name,
      store_type: (store as Record<string, unknown>).store_type,
    });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}
