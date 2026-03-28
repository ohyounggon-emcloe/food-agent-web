import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const riskLevel = searchParams.get("risk_level");
  const search = searchParams.get("search");

  let query = supabase
    .from("keywords_meta")
    .select("*")
    .order("risk_level", { ascending: true })
    .order("keyword", { ascending: true });

  if (riskLevel) {
    query = query.eq("risk_level", riskLevel);
  }
  if (search) {
    query = query.ilike("keyword", `%${search}%`);
  }

  const { data, error } = await query;

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
