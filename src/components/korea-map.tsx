"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegionStat {
  region: string;
  count: number;
  level1: number;
  level2: number;
  level3: number;
}

/*
 * 대한민국 17개 시도 — 간략화 SVG path.
 * viewBox="0 0 800 1000" 기준 좌표.
 */
const REGIONS: { name: string; d: string; cx: number; cy: number }[] = [
  { name: "서울", d: "M370,280 L390,275 L400,290 L395,305 L375,300 Z", cx: 385, cy: 290 },
  { name: "인천", d: "M340,280 L365,270 L370,285 L360,305 L335,300 Z", cx: 352, cy: 288 },
  { name: "경기", d: "M330,230 L420,225 L430,260 L415,320 L390,330 L350,325 L320,290 Z", cx: 375, cy: 275 },
  { name: "강원", d: "M420,200 L540,180 L560,250 L520,320 L440,330 L420,290 Z", cx: 490, cy: 260 },
  { name: "충북", d: "M390,340 L460,330 L480,370 L460,410 L400,400 Z", cx: 435, cy: 370 },
  { name: "충남", d: "M280,340 L385,335 L395,400 L360,430 L270,420 L260,380 Z", cx: 330, cy: 380 },
  { name: "세종", d: "M360,355 L385,350 L390,370 L370,375 Z", cx: 375, cy: 362 },
  { name: "대전", d: "M370,385 L400,380 L405,400 L380,405 Z", cx: 388, cy: 393 },
  { name: "전북", d: "M270,430 L380,420 L400,470 L360,500 L270,490 L255,460 Z", cx: 325, cy: 460 },
  { name: "전남", d: "M250,500 L370,505 L390,560 L360,620 L280,640 L230,590 L240,540 Z", cx: 310, cy: 570 },
  { name: "광주", d: "M300,530 L330,525 L335,545 L310,550 Z", cx: 318, cy: 538 },
  { name: "경북", d: "M465,340 L570,320 L590,400 L560,460 L480,470 L450,420 Z", cx: 525, cy: 395 },
  { name: "대구", d: "M490,430 L530,420 L535,450 L500,455 Z", cx: 513, cy: 440 },
  { name: "경남", d: "M400,480 L530,465 L550,530 L490,570 L410,560 L390,520 Z", cx: 470, cy: 520 },
  { name: "울산", d: "M555,450 L590,440 L595,480 L565,490 Z", cx: 575, cy: 465 },
  { name: "부산", d: "M540,530 L575,520 L580,555 L550,560 Z", cx: 560, cy: 540 },
  { name: "제주", d: "M280,760 L380,755 L390,790 L370,810 L290,810 L270,790 Z", cx: 330, cy: 783 },
];

function getColor(count: number, maxCount: number): string {
  if (count === 0) return "#f1f5f9";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  // slate-200 → teal-300 → teal-500 → teal-700
  if (intensity < 0.25) return "#99f6e4";
  if (intensity < 0.5) return "#5eead4";
  if (intensity < 0.75) return "#14b8a6";
  return "#0f766e";
}

export function KoreaMap() {
  const [stats, setStats] = useState<RegionStat[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/crackdown/stats")
      .then((r) => r.json())
      .then((d) => setStats(Array.isArray(d) ? d : []))
      .catch(() => setStats([]));
  }, []);

  const statMap: Record<string, RegionStat> = {};
  for (const s of stats) {
    statMap[s.region] = s;
  }
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  const hoveredStat = hoveredRegion ? statMap[hoveredRegion] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{"지역별 단속 현황"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox="200 150 450 700"
            className="w-full h-auto max-h-[350px]"
          >
            {REGIONS.map((region) => {
              const stat = statMap[region.name];
              const count = stat?.count || 0;
              const fill = getColor(count, maxCount);
              const isHovered = hoveredRegion === region.name;

              return (
                <g key={region.name}>
                  <path
                    d={region.d}
                    fill={fill}
                    stroke={isHovered ? "#0f766e" : "#94a3b8"}
                    strokeWidth={isHovered ? 2.5 : 1}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredRegion(region.name)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() =>
                      router.push(`/user/crackdown?region=${region.name}`)
                    }
                  />
                  <text
                    x={region.cx}
                    y={region.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none"
                    fontSize={region.name.length > 2 ? 10 : 12}
                    fill={count > 0 ? "#0f172a" : "#64748b"}
                    fontWeight={count > 0 ? 600 : 400}
                  >
                    {region.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 호버 툴팁 */}
          {hoveredStat && (
            <div className="absolute top-2 right-2 bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
              <p className="font-semibold text-slate-800">{hoveredStat.region}</p>
              <p className="text-slate-500">
                {"총 "}
                <span className="font-bold text-teal-600">{hoveredStat.count}</span>
                {"건"}
              </p>
              {hoveredStat.level1 > 0 && (
                <p className="text-red-500">{"긴급 "}{hoveredStat.level1}{"건"}</p>
              )}
              {hoveredStat.level2 > 0 && (
                <p className="text-amber-500">{"주의 "}{hoveredStat.level2}{"건"}</p>
              )}
            </div>
          )}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <span>{"건수:"}</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
            {"0"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-teal-200" />
            {"소"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-teal-400" />
            {"중"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-teal-700" />
            {"다"}
          </span>
        </div>

        {/* 전체 통계 */}
        {stats.length > 0 && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-500">
            {"최근 90일 총 "}
            <span className="font-bold text-teal-600">
              {stats.reduce((s, r) => s + r.count, 0)}
            </span>
            {"건 ("}
            {stats.filter((s) => s.count > 0).length}
            {"개 지역)"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
