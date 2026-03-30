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
 * 대한민국 17개 시도 중심 좌표.
 * 경도(x)·위도(y)를 SVG viewBox 0~500 기준으로 변환.
 * 변환식: x = (lng - 125) * 70,  y = (39 - lat) * 85
 */
const REGIONS: { name: string; x: number; y: number }[] = [
  { name: "서울",   x: 182, y: 148 },
  { name: "인천",   x: 155, y: 156 },
  { name: "경기",   x: 192, y: 175 },
  { name: "강원",   x: 270, y: 130 },
  { name: "충북",   x: 228, y: 230 },
  { name: "세종",   x: 190, y: 252 },
  { name: "충남",   x: 155, y: 260 },
  { name: "대전",   x: 200, y: 272 },
  { name: "전북",   x: 168, y: 325 },
  { name: "광주",   x: 148, y: 380 },
  { name: "전남",   x: 160, y: 415 },
  { name: "경북",   x: 310, y: 250 },
  { name: "대구",   x: 295, y: 310 },
  { name: "울산",   x: 340, y: 340 },
  { name: "경남",   x: 275, y: 370 },
  { name: "부산",   x: 325, y: 380 },
  { name: "제주",   x: 155, y: 510 },
];

/* 한반도 외곽 실루엣 (간략화) */
const KOREA_OUTLINE =
  "M160,80 L195,75 L230,60 L280,55 L340,50 L370,70 L355,110 " +
  "L340,140 L360,170 L370,200 L355,240 L365,270 L350,310 " +
  "L360,350 L340,390 L310,400 L290,395 L260,410 L230,435 " +
  "L195,445 L170,430 L140,440 L120,420 L105,385 L110,345 " +
  "L95,310 L100,270 L110,235 L100,200 L110,170 L125,140 L140,110 Z";

const JEJU_OUTLINE =
  "M115,490 L200,488 L210,510 L195,530 L120,532 L105,510 Z";

function getBubbleRadius(count: number, maxCount: number): number {
  if (count === 0) return 6;
  const ratio = count / Math.max(maxCount, 1);
  return 8 + ratio * 20;
}

function getBubbleColor(count: number, maxCount: number): string {
  if (count === 0) return "#e2e8f0";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio < 0.25) return "#6ee7b7";
  if (ratio < 0.5) return "#34d399";
  if (ratio < 0.75) return "#10b981";
  return "#059669";
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
          <svg viewBox="60 30 340 530" className="w-full h-auto max-h-[400px]">
            {/* 한반도 실루엣 */}
            <path
              d={KOREA_OUTLINE}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />
            <path
              d={JEJU_OUTLINE}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />

            {/* 지역 버블 */}
            {REGIONS.map((region) => {
              const stat = statMap[region.name];
              const count = stat?.count || 0;
              const r = getBubbleRadius(count, maxCount);
              const fill = getBubbleColor(count, maxCount);
              const isHovered = hoveredRegion === region.name;

              return (
                <g key={region.name}>
                  <circle
                    cx={region.x}
                    cy={region.y}
                    r={isHovered ? r + 3 : r}
                    fill={fill}
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    stroke={isHovered ? "#047857" : "#fff"}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredRegion(region.name)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() =>
                      router.push(`/user/crackdown?region=${region.name}`)
                    }
                  />
                  <text
                    x={region.x}
                    y={region.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none"
                    fontSize={9}
                    fontWeight={600}
                    fill={count > 0 ? "#fff" : "#64748b"}
                  >
                    {region.name}
                  </text>
                  {count > 0 && (
                    <text
                      x={region.x}
                      y={region.y + r + 10}
                      textAnchor="middle"
                      className="pointer-events-none select-none"
                      fontSize={8}
                      fill="#475569"
                      fontWeight={500}
                    >
                      {count}
                    </text>
                  )}
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
                <span className="font-bold text-emerald-600">{hoveredStat.count}</span>
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
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
            {"0"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-300" />
            {"소"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            {"중"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-700" />
            {"다"}
          </span>
        </div>

        {/* 전체 통계 */}
        {stats.length > 0 && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-500">
            {"최근 90일 총 "}
            <span className="font-bold text-emerald-600">
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
