import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, execute, useNcloudDb } from "@/lib/ncloud-db";

const DEFAULT_SETTINGS = {
  schedule_morning: "08:00",
  schedule_afternoon: "16:00",
  schedule_discovery: "MON 06:00",
  schedule_reclassifier: "MON",
  telegram_enabled: true,
  reclassifier_confidence: 0.7,
  scout_concurrency: 5,
  reclassifier_batch_size: 20,
};

export async function GET() {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  if (useNcloudDb()) {
    const data = await query<{ key: string; value: string }>(
      "SELECT * FROM system_config"
    );

    const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  }

  // Fallback: existing Supabase code
  const { data, error } = await supabase
    .from("system_config")
    .select("*");

  if (error) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of data || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  if (useNcloudDb()) {
    for (const [key, value] of Object.entries(body)) {
      await execute(
        `INSERT INTO system_config (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, String(value)]
      );
    }
    return NextResponse.json({ success: true });
  }

  // Fallback: existing Supabase code
  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from("system_config")
      .upsert(
        { key, value: String(value) },
        { onConflict: "key" }
      );
  }

  return NextResponse.json({ success: true });
}
