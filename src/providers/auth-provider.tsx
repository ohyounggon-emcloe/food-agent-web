"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const initDone = useRef(false);

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
        const { data: newProfile, error: upsertError } = await supabase
          .from("user_profiles")
          .upsert({
            id: currentUser.id,
            email: currentUser.email || "",
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

  // 초기화: 모든 페이지에서 실행 (auth 페이지 포함)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 중복 실행 방지
      if (initDone.current) return;
      initDone.current = true;

      try {
        // 10초 타임아웃: getUser()가 응답하지 않으면 강제로 loading 해제
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 10000)
        );

        const { data: { user: currentUser } } = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ]);

        if (!mounted) return;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // onAuthStateChange 리스너: init 완료 후에만 프로필 재조회
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: { user: User } | null) => {
      if (!mounted) return;

      // INITIAL_SESSION 이벤트는 init()과 중복되므로 무시
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

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } catch { /* ignore */ }
        setUser(null);
        setProfile(null);
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
    // 즉시 리다이렉트 (signOut 응답을 기다리지 않음 — 콜드스타트 대응)
    setUser(null);
    setProfile(null);
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
