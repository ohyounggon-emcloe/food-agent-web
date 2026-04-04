import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/**
 * JWT payload에서 user 정보를 추출 (base64 디코딩)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Cookie 기반 Supabase 클라이언트 (웹 브라우저용)
 * Bearer 토큰이 있으면 JWT 디코딩으로 세션 구성 (앱용)
 */
export async function createClient() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = decodeJwtPayload(token);

    if (payload?.sub) {
      const client = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );

      // JWT에서 추출한 user 정보로 세션 구성
      client.auth.getSession = async () => {
        return {
          data: {
            session: {
              access_token: token,
              refresh_token: "",
              expires_in: 3600,
              expires_at: Number(payload.exp) || Math.floor(Date.now() / 1000) + 3600,
              token_type: "bearer",
              user: {
                id: payload.sub as string,
                email: (payload.email as string) || "",
                aud: (payload.aud as string) || "authenticated",
                role: (payload.role as string) || "authenticated",
                app_metadata: {},
                user_metadata: payload.user_metadata || {},
                created_at: "",
              },
            },
          },
          error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      };

      return client;
    }
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
