import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const { data: suggestions, error } = await supabase
    .from("keyword_suggestions")
    .select("*")
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let approved = 0;
  for (const s of suggestions || []) {
    await supabase
      .from("keywords_meta")
      .upsert(
        { keyword: s.keyword, risk_level: s.risk_level },
        { onConflict: "keyword" }
      );

    await supabase
      .from("keyword_suggestions")
      .update({ status: "approved" })
      .eq("id", s.id);

    approved++;
  }

  return NextResponse.json({ success: true, approved });
}
