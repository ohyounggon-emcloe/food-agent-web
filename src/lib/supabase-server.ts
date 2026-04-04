import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/**
 * Cookie 기반 Supabase 클라이언트 (웹 브라우저용)
 * Bearer 토큰이 있으면 토큰 기반으로 전환 (앱용)
 *
 * Bearer 토큰 사용 시 getSession()이 동작하도록
 * 가짜 세션을 주입하는 래퍼 클라이언트를 반환
 */
export async function createClient() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // getUser()로 토큰 검증 → getSession()도 동작하도록 프록시
    const original = client.auth.getSession.bind(client.auth);
    client.auth.getSession = async () => {
      const { data: userData, error } = await client.auth.getUser(token);
      if (error || !userData.user) {
        return original();
      }
      return {
        data: {
          session: {
            access_token: token,
            refresh_token: "",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: "bearer",
            user: userData.user,
          },
        },
        error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    };

    return client;
  }

  // Cookie 기반 (웹 브라우저용)
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 cookie 설정 불가 (정상)
          }
        },
      },
    }
  );
}
