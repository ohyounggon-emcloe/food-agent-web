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
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">{"로딩 중..."}</p>
    </div>
  );
}
