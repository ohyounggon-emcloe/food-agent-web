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

        if (error || !data) {
          console.error("Profile fetch failed, creating:", error?.message);
          // 프로필이 없으면 자동 생성
          const { data: newProfile } = await supabase
            .from("user_profiles")
            .upsert({
              id: currentUser.id,
              email: currentUser.email || "",
              role: "regular",
            })
            .select()
            .single();
          setProfile(newProfile);
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("Profile fetch exception:", err);
        setProfile(null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  // 비활동 10분 타임아웃
  useEffect(() => {
    if (!user) return;

    const TIMEOUT_MS = 10 * 60 * 1000; // 10분
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/auth/login";
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
