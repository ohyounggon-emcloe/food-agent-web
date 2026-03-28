import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // /auth/* - 세션 갱신만 (로그인 상태여도 접근 허용)
  if (pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // /admin/* - 비로그인이면 로그인으로
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // 역할 체크
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // RLS 에러 또는 프로필 없으면 로그 출력용으로 쿠키에 저장
    const role = profile?.role || "regular";

    if (!["admin", "super_admin"].includes(role)) {
      // 로그아웃 처리 후 로그인 페이지로
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
