import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// user_profiles is auth-related - KEEP using Supabase (rule #3)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const user = session.user;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname, password, preferred_regions, preferred_industries } = body;

  const profileUpdate: Record<string, unknown> = {};

  if (nickname !== undefined) {
    profileUpdate.nickname = nickname;
  }

  if (preferred_regions !== undefined) {
    profileUpdate.preferred_regions = preferred_regions;
  }

  if (preferred_industries !== undefined) {
    profileUpdate.preferred_industries = preferred_industries;
  }

  if (Object.keys(profileUpdate).length > 0) {
    profileUpdate.updated_at = new Date().toISOString();
    await supabase
      .from("user_profiles")
      .update(profileUpdate)
      .eq("id", user.id);
  }

  if (password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
