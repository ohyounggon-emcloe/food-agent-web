import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin, isAuthError } from "@/lib/api-auth";
import { execute } from "@/lib/ncloud-db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const authResult = await requireAdmin(supabase);
  if (isAuthError(authResult)) return authResult;

  const { id } = await params;

  try {
    const rowCount = await execute("DELETE FROM menu_permissions WHERE id = $1", [id]);

    if (rowCount === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permissions DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
}
