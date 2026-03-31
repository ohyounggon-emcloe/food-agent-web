import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function POST() {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const suggestions = await query<{ id: number; keyword: string; risk_level: string }>(
      "SELECT * FROM keyword_suggestions WHERE status = 'pending'"
    );

    let approved = 0;
    for (const s of suggestions || []) {
      await execute(
        `INSERT INTO keywords_meta (keyword, risk_level)
         VALUES ($1, $2)
         ON CONFLICT (keyword) DO UPDATE SET risk_level = $2`,
        [s.keyword, s.risk_level]
      );

      await execute(
        "UPDATE keyword_suggestions SET status = 'approved' WHERE id = $1",
        [s.id]
      );

      approved++;
    }

    return NextResponse.json({ success: true, approved });
  }

  // Fallback: existing Supabase code
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
