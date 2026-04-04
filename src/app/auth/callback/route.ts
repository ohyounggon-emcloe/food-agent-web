import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { execute, queryOne } from "@/lib/ncloud-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const siteUrl = "https://aifx.kr";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${siteUrl}/auth/login?error=expired`);
    }

    // 비밀번호 재설정인 경우
    if (type === "recovery") {
      return NextResponse.redirect(`${siteUrl}/auth/update-password`);
    }

    // AMR에서 recovery 확인 (Supabase가 type을 전달하지 않을 때 대비)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amr = (data?.session?.user as any)?.amr as { method: string }[] | undefined;
    if (amr && amr.some((a) => a.method === "recovery")) {
      return NextResponse.redirect(`${siteUrl}/auth/update-password`);
    }

    if (data?.user) {
      const meta = data.user.user_metadata || {};
      const nickname = meta.nickname || null;
      const userType = meta.user_type || "personal";

      // NCloud DB에 프로필 upsert (user_type 포함)
      await execute(
        `INSERT INTO user_profiles (id, email, nickname, role, user_type)
         VALUES ($1, $2, $3, 'regular', $4)
         ON CONFLICT (id) DO UPDATE SET
           nickname = COALESCE(EXCLUDED.nickname, user_profiles.nickname),
           user_type = EXCLUDED.user_type`,
        [data.user.id, data.user.email || "", nickname, userType]
      );

      // 대리점 유형이면 agencies 자동 생성 + user_profiles.agency_id 연결
      if (userType === "agency" && meta.agency_name) {
        try {
          const existing = await queryOne<{ agency_id: number }>(
            "SELECT agency_id FROM user_profiles WHERE id = $1",
            [data.user.id]
          );

          if (!existing?.agency_id) {
            await execute(
              `INSERT INTO agencies (agency_name, business_no, representative, phone, address, admin_user_id)
               VALUES ($1, $2, $3, $4, $5, $6::uuid)`,
              [
                meta.agency_name,
                meta.agency_business_no || null,
                meta.agency_representative || null,
                meta.agency_phone || null,
                meta.agency_address || null,
                data.user.id,
              ]
            );

            const agency = await queryOne<{ id: number }>(
              "SELECT id FROM agencies WHERE admin_user_id = $1::uuid ORDER BY id DESC LIMIT 1",
              [data.user.id]
            );

            if (agency) {
              await execute(
                "UPDATE user_profiles SET agency_id = $1 WHERE id = $2",
                [agency.id, data.user.id]
              );
            }
          }
        } catch (err) {
          console.error("Agency registration error:", err);
        }
      }

      return NextResponse.redirect(`${siteUrl}/user/dashboard`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth/login?verified=true`);
}
