import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { queryOne, useNcloudDb } from "@/lib/ncloud-db";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(null);
  }
  const user = session.user;

  if (useNcloudDb()) {
    const profile = await queryOne(
      "SELECT id, email, nickname, role FROM user_profiles WHERE id = $1",
      [user.id]
    );

    if (profile) {
      return NextResponse.json(profile);
    }

    // NCloud에 없으면 생성
    await queryOne(
      `INSERT INTO user_profiles (id, email, nickname, role)
       VALUES ($1, $2, $3, 'regular')
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [user.id, user.email || "", user.user_metadata?.nickname || null]
    );

    const newProfile = await queryOne(
      "SELECT id, email, nickname, role FROM user_profiles WHERE id = $1",
      [user.id]
    );
    return NextResponse.json(newProfile);
  }

  // Fallback: Supabase
  const { data } = await supabase
    .from("user_profiles")
    .select("id, email, nickname, role")
    .eq("id", user.id)
    .single();

  return NextResponse.json(data);
}
