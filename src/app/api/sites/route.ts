import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const collectionMethod = searchParams.get("collection_method");

  if (useNcloudDb()) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`category = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (status) {
      conditions.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (collectionMethod && collectionMethod !== "all") {
      conditions.push(`collection_method = $${paramIdx}`);
      params.push(collectionMethod);
      paramIdx++;
    }
    if (search) {
      conditions.push(`(site_name ILIKE $${paramIdx} OR target_url ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const data = await query(
      `SELECT * FROM compliance_data ${whereClause} ORDER BY category DESC, site_name ASC`,
      params
    );

    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  let q = supabase
    .from("compliance_data")
    .select("*")
    .order("category", { ascending: false })
    .order("site_name", { ascending: true });

  if (category) {
    q = q.eq("category", category);
  }
  if (status) {
    q = q.eq("status", status);
  }
  if (collectionMethod && collectionMethod !== "all") {
    q = q.eq("collection_method", collectionMethod);
  }
  if (search) {
    q = q.or(
      `site_name.ilike.%${search}%,target_url.ilike.%${search}%`
    );
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { site_name, target_url, category, board_name } = body;

  if (!site_name || !target_url) {
    return NextResponse.json(
      { error: "site_name과 target_url은 필수입니다" },
      { status: 400 }
    );
  }

  if (useNcloudDb()) {
    const data = await queryOne(
      `INSERT INTO compliance_data (site_name, target_url, category, board_name, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [site_name, target_url, category || "", board_name || ""]
    );
    return NextResponse.json(data, { status: 201 });
  }

  // Fallback: existing Supabase code
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compliance_data")
    .insert({
      site_name,
      target_url,
      category: category || "",
      board_name: board_name || "",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
