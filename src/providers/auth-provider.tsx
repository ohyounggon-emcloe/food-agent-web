"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "regular",
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (currentUser: User) => {
      try {
        // NCloud DB에서 profile 조회 (API 경유)
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setProfile(data);
            return;
          }
        }
        // API 실패 시 기본값
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          nickname: currentUser.user_metadata?.nickname || null,
          role: "regular",
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          nickname: null,
          role: "regular",
        });
      }
    },
    []
  );

  // 초기화
  useEffect(() => {
    let mounted = true;

    const isAuthPage = typeof window !== "undefined" &&
      (window.location.pathname.startsWith("/auth/") ||
       window.location.pathname === "/");

    const init = async () => {
      // 인증 페이지는 즉시 렌더링
      if (isAuthPage) {
        if (mounted) setLoading(false);
      }

      try {
        // getSession으로 빠르게 토큰 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        const currentUser = session?.user ?? null;

        // 이메일 미인증 세션이면 강제 로그아웃 + 쿠키 직접 삭제
        if (currentUser && !currentUser.email_confirmed_at) {
          // sb- 쿠키 직접 삭제 (미들웨어 리다이렉트 루프 방지)
          document.cookie.split(";").forEach((c) => {
            const name = c.trim().split("=")[0];
            if (name.startsWith("sb-")) {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
          });
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          if (mounted) setLoading(false);
          if (!isAuthPage) {
            window.location.href = "/auth/login?error=unverified";
          }
          return;
        }

        setUser(currentUser);

        if (currentUser) {
          // profile 로드 후 loading 해제
          await fetchProfile(currentUser);
          if (mounted) setLoading(false);
        } else {
          if (mounted) setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    };

    init();

    if (isAuthPage) {
      return () => { mounted = false; };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: { user: User } | null) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") return;

      const currentUser = session?.user ?? null;

      // 미인증 세션 차단
      if (currentUser && !currentUser.email_confirmed_at) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // 비활동 30분 타임아웃
  useEffect(() => {
    if (!user) return;

    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    let lastReset = 0;
    const resetTimer = () => {
      const now = Date.now();
      if (now - lastReset < 5000) return; // 5초에 한 번만
      lastReset = now;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setUser(null);
        setProfile(null);
        document.cookie.split(";").forEach((c) => {
          const name = c.trim().split("=")[0];
          if (name.startsWith("sb-")) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
        supabase.auth.signOut().catch(() => {});
        window.location.href = "/auth/login?expired=true";
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, supabase]);

  const signOut = async () => {
    setUser(null);
    setProfile(null);

    // Supabase 세션 쿠키 직접 삭제 (signOut 미완료 시에도 쿠키 정리)
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });

    supabase.auth.signOut().catch(() => {});
    window.location.href = "/auth/login?logout=true";
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || "regular",
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
