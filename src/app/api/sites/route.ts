import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("compliance_data")
    .select("*")
    .order("category", { ascending: false })
    .order("site_name", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `site_name.ilike.%${search}%,target_url.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

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
