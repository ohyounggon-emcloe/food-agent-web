import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: "https://aifx.kr/auth/callback",
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message === "User already registered" ? "이미 인증된 계정입니다. 로그인해주세요." : error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
