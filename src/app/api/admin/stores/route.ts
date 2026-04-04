import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query } from "@/lib/ncloud-db";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (isAuthError(auth)) return auth;

  const stores = await query(
    "SELECT id, store_name, store_type, address, is_active FROM stores ORDER BY store_name"
  );

  return NextResponse.json(stores || []);
}
