import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=expired`);
    }

    // 비밀번호 재설정인 경우
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/update-password`);
    }

    // AMR에서 recovery 확인 (Supabase가 type을 전달하지 않을 때 대비)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amr = (data?.session?.user as any)?.amr as { method: string }[] | undefined;
    if (amr && amr.some((a) => a.method === "recovery")) {
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

  return NextResponse.redirect(`${origin}/auth/login?verified=true`);
}
