import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { queryOne, execute, useNcloudDb } from "@/lib/ncloud-db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const body = await request.json();
  const { action, risk_level } = body;

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "action must be approve or reject" },
      { status: 400 }
    );
  }

  if (useNcloudDb()) {
    if (action === "approve") {
      const suggestion = await queryOne<{ keyword: string; risk_level: string }>(
        "SELECT * FROM keyword_suggestions WHERE id = $1",
        [Number(id)]
      );

      if (!suggestion) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }

      const finalRiskLevel = risk_level || suggestion.risk_level;

      await execute(
        `INSERT INTO keywords_meta (keyword, risk_level)
         VALUES ($1, $2)
         ON CONFLICT (keyword) DO UPDATE SET risk_level = $2`,
        [suggestion.keyword, finalRiskLevel]
      );

      await execute(
        "UPDATE keyword_suggestions SET status = 'approved' WHERE id = $1",
        [Number(id)]
      );

      return NextResponse.json({ success: true, action: "approved" });
    }

    if (action === "reject") {
      await execute(
        "UPDATE keyword_suggestions SET status = 'rejected' WHERE id = $1",
        [Number(id)]
      );
      return NextResponse.json({ success: true, action: "rejected" });
    }
  }

  // Fallback: existing Supabase code
  if (action === "approve") {
    const { data: suggestion } = await supabase
      .from("keyword_suggestions")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (!suggestion) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const finalRiskLevel = risk_level || suggestion.risk_level;

    await supabase
      .from("keywords_meta")
      .upsert(
        { keyword: suggestion.keyword, risk_level: finalRiskLevel },
        { onConflict: "keyword" }
      );

    await supabase
      .from("keyword_suggestions")
      .update({ status: "approved" })
      .eq("id", Number(id));

    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    await supabase
      .from("keyword_suggestions")
      .update({ status: "rejected" })
      .eq("id", Number(id));

    return NextResponse.json({ success: true, action: "rejected" });
  }
}
