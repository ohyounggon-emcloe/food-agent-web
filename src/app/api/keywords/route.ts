import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const riskLevel = searchParams.get("risk_level");
  const search = searchParams.get("search");

  if (useNcloudDb()) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (riskLevel) {
      conditions.push(`risk_level = $${paramIdx}`);
      params.push(riskLevel);
      paramIdx++;
    }
    if (search) {
      conditions.push(`keyword ILIKE $${paramIdx}`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const data = await query(
      `SELECT * FROM keywords_meta ${whereClause} ORDER BY risk_level ASC, keyword ASC`,
      params
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  let q = supabase
    .from("keywords_meta")
    .select("*")
    .order("risk_level", { ascending: true })
    .order("keyword", { ascending: true });

  if (riskLevel) {
    q = q.eq("risk_level", riskLevel);
  }
  if (search) {
    q = q.ilike("keyword", `%${search}%`);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { keyword, risk_level, action_guide } = body;

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword is required" },
      { status: 400 }
    );
  }

  if (useNcloudDb()) {
    const data = await queryOne(
      `INSERT INTO keywords_meta (keyword, risk_level, action_guide)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [keyword, risk_level || "Level3", action_guide || ""]
    );
    return NextResponse.json(data, { status: 201 });
  }

  // Fallback: existing Supabase code
  const supabase2 = await createClient();
  const { data, error } = await supabase2
    .from("keywords_meta")
    .insert({
      keyword,
      risk_level: risk_level || "Level3",
      action_guide: action_guide || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
