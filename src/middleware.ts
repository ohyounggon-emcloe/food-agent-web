import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Supabase 세션 쿠키 존재 여부로 로그인 판단 (네트워크 호출 없음)
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  // 루트에서 code 파라미터가 있으면 /auth/callback으로 전달
  if (pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
  }

  // /admin/*, /user/* — 세션 쿠키 없으면 로그인 페이지로
  if (pathname.startsWith("/admin") || pathname.startsWith("/user")) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // /auth/login, /auth/signup — 세션 쿠키 있으면 대시보드로
  if (pathname === "/auth/login" || pathname === "/auth/signup") {
    const sp = request.nextUrl.searchParams;
    const bypassRedirect =
      sp.has("logout") ||
      sp.has("expired") ||
      sp.has("verified") ||
      sp.has("reset") ||
      sp.has("error");

    if (hasSession && !bypassRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = "/user/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*", "/auth/login", "/auth/signup"],
};
