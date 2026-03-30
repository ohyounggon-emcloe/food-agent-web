"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // hash fragment에서 recovery 이벤트 감지
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/auth/update-password");
        return;
      }
      if (event === "SIGNED_IN") {
        router.replace("/user/dashboard");
        return;
      }
    });

    // 일반 접속: 세션 확인 후 리다이렉트
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/user/dashboard");
      } else {
        router.replace("/auth/login");
      }
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">{"로딩 중..."}</p>
    </div>
  );
}
