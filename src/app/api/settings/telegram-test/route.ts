import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { query, useNcloudDb } from "@/lib/ncloud-db";

export async function POST() {
  const supabase = await createClient();

  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  let token: string | undefined;
  let chatId: string | undefined;

  if (useNcloudDb()) {
    const configs = await query<{ key: string; value: string }>(
      "SELECT key, value FROM system_config WHERE key IN ('telegram_bot_token', 'telegram_chat_id')"
    );

    const configMap: Record<string, string> = {};
    for (const c of configs || []) {
      configMap[c.key] = c.value;
    }
    token = configMap.telegram_bot_token;
    chatId = configMap.telegram_chat_id;
  } else {
    // Fallback: existing Supabase code
    const { data: configs } = await supabase
      .from("system_config")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);

    const configMap: Record<string, string> = {};
    for (const c of configs || []) {
      configMap[c.key] = c.value;
    }
    token = configMap.telegram_bot_token;
    chatId = configMap.telegram_chat_id;
  }

  if (!token || !chatId) {
    return NextResponse.json(
      { error: "Telegram token or chat ID not configured" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Food Safety Agent - Test message\nThis is a test notification.",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await res.json();

    if (data.ok) {
      return NextResponse.json({ success: true, message: "Test message sent" });
    } else {
      return NextResponse.json(
        { error: data.description || "Telegram API error" },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send telegram message" },
      { status: 500 }
    );
  }
}
