import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
  const body = await request.json();

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
