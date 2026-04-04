import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query } from "@/lib/ncloud-db";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (isAuthError(auth)) return auth;

  const agencies = await query(
    "SELECT id, agency_name, representative, phone, is_active FROM agencies ORDER BY agency_name"
  );

  return NextResponse.json(agencies || []);
}
