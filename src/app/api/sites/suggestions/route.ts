import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compliance_data")
    .select("*")
    .not("suggested_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: "id와 action(approve/reject)은 필수입니다" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (action === "approve") {
    const { data: site } = await supabase
      .from("compliance_data")
      .select("*")
      .eq("id", id)
      .single();

    if (!site?.suggested_url) {
      return NextResponse.json(
        { error: "추천 URL이 없습니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("compliance_data")
      .update({
        target_url: site.suggested_url,
        suggested_url: null,
        status: "active",
        error_message: null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("compliance_data")
      .update({ suggested_url: null })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "rejected" });
  }

  return NextResponse.json({ error: "잘못된 action" }, { status: 400 });
}
