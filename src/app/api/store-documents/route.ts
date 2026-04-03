import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

// 서류 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const docType = searchParams.get("docType");

  if (!storeId) {
    return NextResponse.json({ error: "storeId 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    let sql = "SELECT * FROM store_documents WHERE store_id = $1 AND is_valid = true";
    const params: unknown[] = [Number(storeId)];
    let idx = 2;

    if (docType) {
      sql += ` AND doc_type = $${idx}`;
      params.push(docType);
      idx++;
    }

    sql += " ORDER BY created_at DESC";
    const docs = await query(sql, params);
    return NextResponse.json(docs || []);
  }

  return NextResponse.json([]);
}

// 서류 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { store_id, doc_type, doc_name, file_url, expiry_date } = body;

  if (!store_id || !doc_type || !file_url) {
    return NextResponse.json({ error: "store_id, doc_type, file_url 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    const doc = await queryOne(
      `INSERT INTO store_documents (store_id, uploaded_by, doc_type, doc_name, file_url, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [store_id, session.user.id, doc_type, doc_name || null, file_url, expiry_date || null]
    );
    return NextResponse.json(doc, { status: 201 });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}

// 서류 삭제 (무효화)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  if (useNcloudDb()) {
    await execute("UPDATE store_documents SET is_valid = false WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "DB 미설정" }, { status: 500 });
}
