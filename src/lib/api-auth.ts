import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthResult {
  user: { id: string; email?: string };
  profile: { id: string; email: string; role: string } | null;
  isAdmin: boolean;
}

export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult | NextResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "regular";

  return {
    user,
    profile,
    isAdmin: ["admin", "super_admin"].includes(role),
  };
}

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(supabase);

  if (result instanceof NextResponse) {
    return result;
  }

  if (!result.isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return result;
}

export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
