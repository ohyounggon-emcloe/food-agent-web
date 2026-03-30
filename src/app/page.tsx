"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/user/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <p className="text-gray-500">{"로딩 중..."}</p>
      <a
        href="/auth/login?logout=true"
        className="text-xs text-gray-400 hover:text-teal-500 hover:underline mt-4"
      >
        {"오래 걸리면 여기를 클릭하세요"}
      </a>
    </div>
  );
}
