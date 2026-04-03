import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const siteUrl = "https://aifx.kr";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${siteUrl}/auth/login?error=expired`);
    }

    // 비밀번호 재설정인 경우
    if (type === "recovery") {
      return NextResponse.redirect(`${siteUrl}/auth/update-password`);
    }

    // AMR에서 recovery 확인 (Supabase가 type을 전달하지 않을 때 대비)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amr = (data?.session?.user as any)?.amr as { method: string }[] | undefined;
    if (amr && amr.some((a) => a.method === "recovery")) {
      return NextResponse.redirect(`${siteUrl}/auth/update-password`);
    }

    if (data?.user) {
      const nickname = data.user.user_metadata?.nickname || null;

      // 프로필이 없으면 생성, 있으면 닉네임 업데이트
      await supabase
        .from("user_profiles")
        .upsert({
          id: data.user.id,
          email: data.user.email || "",
          nickname,
          role: "regular",
        }, { onConflict: "id", ignoreDuplicates: false })
        .select();

      return NextResponse.redirect(`${siteUrl}/user/dashboard`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?verified=true`);
}
