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
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (data && !error) {
          setProfile(data);
          return;
        }

        console.warn("Profile not found, creating:", error?.message);
        const nickname = currentUser.user_metadata?.nickname || null;
        const { data: newProfile, error: upsertError } = await supabase
          .from("user_profiles")
          .upsert({
            id: currentUser.id,
            email: currentUser.email || "",
            nickname,
            role: "regular",
          })
          .select()
          .single();

        if (newProfile && !upsertError) {
          setProfile(newProfile);
        } else {
          console.error("Profile upsert failed:", upsertError?.message);
          setProfile({
            id: currentUser.id,
            email: currentUser.email || "",
            nickname: null,
            role: "regular",
          });
        }
      } catch (err) {
        console.error("Profile fetch exception:", err);
        setProfile({
          id: currentUser.id,
          email: currentUser.email || "",
          nickname: null,
          role: "regular",
        });
      }
    },
    [supabase]
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // loading을 즉시 해제 — profile은 백그라운드로 로드
        if (mounted) setLoading(false);
        if (currentUser) {
          fetchProfile(currentUser);
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
