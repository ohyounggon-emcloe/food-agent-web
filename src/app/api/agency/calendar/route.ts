import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query } from "@/lib/ncloud-db";
import { requireAgencyAuth, isAgencyAuthError } from "@/lib/agency-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAgencyAuth(supabase);
  if (isAgencyAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const data = await query(
    `SELECT sr.*, ac.client_name, ac.short_name, si.item_name, si.category, as2.name as staff_name
    FROM service_requests sr
    LEFT JOIN agency_clients ac ON sr.client_id = ac.id
    LEFT JOIN service_items si ON sr.service_item_id = si.id
    LEFT JOIN agency_staff as2 ON sr.assigned_staff_id = as2.id
    WHERE sr.agency_id = $1
    AND sr.requested_date >= $2::date AND sr.requested_date <= $3::date
    ORDER BY sr.requested_date`,
    [auth.agencyId, start || "2026-01-01", end || "2026-12-31"]
  );

  const CATEGORY_LABEL: Record<string, string> = { "기물대여": "기물", "행사": "행사", "인력": "인력", "현물": "현물" };

  // FullCalendar 이벤트 형식으로 변환
  const events = (data || []).map((r: Record<string, unknown>) => {
    const clientLabel = (r.short_name || r.client_name || "") as string;
    const catLabel = CATEGORY_LABEL[r.category as string] || r.service_type || "";
    const staffLabel = r.staff_name ? ` ${r.staff_name}` : "";
    const title = `${clientLabel} ${catLabel}${staffLabel}`;

    return {
      id: String(r.id),
      title,
      start: r.requested_date,
      allDay: false,
      backgroundColor:
        r.status === "requested" ? "#f59e0b" :
        r.status === "confirmed" ? "#3b82f6" :
        r.status === "completed" ? "#10b981" : "#9ca3af",
      borderColor: "transparent",
      extendedProps: r,
    };
  });

  return NextResponse.json(events);
}
