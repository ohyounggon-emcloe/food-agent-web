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

  // 세션 갱신 (모든 요청)
  await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // 루트에서 code 파라미터가 있으면 /auth/callback으로 전달 (비밀번호 재설정 등)
  if (pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
  }

  // /admin/*, /user/* — 비로그인이면 로그인 페이지로
  if (pathname.startsWith("/admin") || pathname.startsWith("/user")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // /auth/login, /auth/signup — 이미 로그인이면 사용자 대시보드로
  // 단, logout 파라미터가 있으면 리다이렉트하지 않음 (로그아웃 직후)
  if (pathname === "/auth/login" || pathname === "/auth/signup") {
    const isLogout = request.nextUrl.searchParams.get("logout") === "true";
    if (session && !isLogout) {
      const url = request.nextUrl.clone();
      url.pathname = "/user/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*", "/auth/login", "/auth/signup"],
};
