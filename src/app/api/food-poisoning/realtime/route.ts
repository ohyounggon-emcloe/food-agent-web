import { NextResponse } from "next/server";

export const revalidate = 3600; // 1시간 캐시

export async function GET() {
  try {
    const resp = await fetch("https://poisonmap.mfds.go.kr/api/risk.do", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "API 오류" }, { status: 500 });
    }

    const data = await resp.json();
    const items = data?.data || [];

    // 시도별 요약 (sgg=null인 항목만)
    const sidoSummary = items
      .filter((item: Record<string, unknown>) => item.sgg === null)
      .map((item: Record<string, unknown>) => {
        const todayRisk = Number(item.todayRisk2) || 0;
        const tomorrowRisk = Number(item.tomorrowRisk2) || 0;
        const afterRisk = Number(item.afterTomorrowRisk2) || 0;

        const getLabel = (score: number) => {
          if (score >= 86) return "위험";
          if (score >= 71) return "경고";
          if (score >= 51) return "주의";
          if (score >= 36) return "관심";
          return "안전";
        };

        return {
          sido: item.sd,
          today: Math.round(todayRisk * 10) / 10,
          todayLabel: getLabel(todayRisk),
          tomorrow: Math.round(tomorrowRisk * 10) / 10,
          tomorrowLabel: getLabel(tomorrowRisk),
          afterTomorrow: Math.round(afterRisk * 10) / 10,
          afterTomorrowLabel: getLabel(afterRisk),
          baseDate: item.baseDate,
        };
      });

    return NextResponse.json({
      summary: sidoSummary,
      totalRegions: sidoSummary.length,
      baseDate: sidoSummary[0]?.baseDate || "",
    });
  } catch (error) {
    console.error("Food poisoning realtime error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
