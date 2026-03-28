import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || "regular";
      if (["admin", "super_admin"].includes(role)) {
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      }
    }
  }

  // regular/premium 또는 인증 실패 시
  return NextResponse.redirect(`${origin}/auth/login?verified=true`);
}
