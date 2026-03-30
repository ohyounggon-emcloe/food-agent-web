import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // 비밀번호 재설정 → 새 비밀번호 입력 페이지로
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/update-password`);
    }

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
      return NextResponse.redirect(`${origin}/user/dashboard`);
    }
  }

  // 인증 실패 시
  return NextResponse.redirect(`${origin}/auth/login?verified=true`);
}
