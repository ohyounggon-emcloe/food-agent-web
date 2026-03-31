import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const data = await query(
      "SELECT * FROM keyword_suggestions WHERE status = 'pending' ORDER BY created_at DESC"
    );
    return NextResponse.json(data);
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("keyword_suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
