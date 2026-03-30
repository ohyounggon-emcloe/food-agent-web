"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ── Types ── */

interface GeoFeature {
  type: "Feature";
  properties: { name: string; code: string };
  geometry: { type: string; coordinates: number[][][] };
}

interface RegionStat {
  region: string;
  count: number;
  maxRisk: string;
  alerts: CrackdownAlert[];
}

interface CrackdownAlert {
  id: number;
  title: string;
  alert_type: string;
  risk_level: string;
  region: string;
  summary?: string;
}

/* ── Geo Projection (Mercator 간소화) ── */

const VIEW_W = 560;
const VIEW_H = 720;

// 한반도 경위도 범위
const LNG_MIN = 125.8;
const LNG_MAX = 130.0;
const LAT_MIN = 33.0;
const LAT_MAX = 38.6;

function project(lng: number, lat: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_W;
  // Y축 반전 (위도가 클수록 위쪽)
  const y = VIEW_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VIEW_H;
  return [x, y];
}

function geoToPath(coordinates: number[][][]): string {
  return coordinates
    .map((ring) => {
      const pts = ring.map(([lng, lat]) => {
        const [x, y] = project(lng, lat);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return `M${pts.join("L")}Z`;
    })
    .join(" ");
}

function getCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return project(sumLng / ring.length, sumLat / ring.length);
}

/* ── Colors ── */

const RISK_COLORS: Record<string, string> = {
  Level1: "#ef4444",
  Level2: "#f59e0b",
  Level3: "#3b82f6",
};

function getFillColor(count: number, maxCount: number): string {
  if (count === 0) return "#f1f5f9";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (intensity < 0.25) return "#99f6e4";
  if (intensity < 0.5) return "#5eead4";
  if (intensity < 0.75) return "#14b8a6";
  return "#0f766e";
}

/* ── Component ── */

interface KoreaMapProps {
  className?: string;
}

export function KoreaMap({ className }: KoreaMapProps) {
  const [geoData, setGeoData] = useState<GeoFeature[]>([]);
  const [alerts, setAlerts] = useState<CrackdownAlert[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    fetch("/geo/korea-sido.json")
      .then((r) => r.json())
      .then((d) => setGeoData(d.features || []))
      .catch(() => setGeoData([]));

    fetch("/api/crackdown?days=90")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAlerts(Array.isArray(d) ? d : []))
      .catch(() => setAlerts([]));
  }, []);

  // 지역별 집계
  const regionStats = useMemo(() => {
    const stats: Record<string, RegionStat> = {};
    for (const alert of alerts) {
      const region = alert.region || "전국";
      if (!stats[region]) {
        stats[region] = { region, count: 0, maxRisk: "Level3", alerts: [] };
      }
      stats[region].count++;
      stats[region].alerts.push(alert);
      if (alert.risk_level === "Level1") {
        stats[region].maxRisk = "Level1";
      } else if (
        alert.risk_level === "Level2" &&
        stats[region].maxRisk !== "Level1"
      ) {
        stats[region].maxRisk = "Level2";
      }
    }
    return stats;
  }, [alerts]);

  const maxCount = useMemo(
    () => Math.max(...Object.values(regionStats).map((s) => s.count), 1),
    [regionStats]
  );

  const totalCount = alerts.length;
  const regionCount = Object.keys(regionStats).length;
  const selectedData = selectedRegion ? regionStats[selectedRegion] : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>지역별 단속 현황</span>
          <span className="text-xs text-gray-400 font-normal">
            최근 90일
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* SVG 지도 */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          style={{ maxHeight: "400px" }}
        >
          {geoData.map((feature) => {
            const name = feature.properties.name;
            const stat = regionStats[name];
            const count = stat?.count || 0;
            const fill = getFillColor(count, maxCount);
            const isHovered = hoveredRegion === name;
            const isSelected = selectedRegion === name;
            const [cx, cy] = getCentroid(feature.geometry.coordinates);

            return (
              <g
                key={name}
                onMouseEnter={() => setHoveredRegion(name)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() =>
                  setSelectedRegion(selectedRegion === name ? null : name)
                }
                style={{ cursor: "pointer" }}
              >
                <path
                  d={geoToPath(feature.geometry.coordinates)}
                  fill={fill}
                  stroke={isSelected ? "#0f766e" : isHovered ? "#14b8a6" : "#cbd5e1"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  opacity={isHovered || isSelected ? 1 : 0.9}
                />
                {/* 지역명 */}
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#334155"
                  pointerEvents="none"
                >
                  {name}
                </text>
                {/* 건수 */}
                {count > 0 && (
                  <text
                    x={cx}
                    y={cy + 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#0f766e"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {count}건
                  </text>
                )}
                {/* 위험 표시 */}
                {stat && stat.maxRisk !== "Level3" && (
                  <circle
                    cx={cx + 18}
                    cy={cy - 10}
                    r="5"
                    fill={RISK_COLORS[stat.maxRisk]}
                    stroke="white"
                    strokeWidth="1.5"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* 범례 */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#f1f5f9" }} />
              0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#99f6e4" }} />
              소
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#14b8a6" }} />
              중
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#0f766e" }} />
              다
            </span>
          </div>
          <span className="text-teal-600 font-medium">
            총 {totalCount}건 ({regionCount}개 지역)
          </span>
        </div>

        {/* 선택된 지역 상세 */}
        {selectedData && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{selectedRegion}</span>
              <Badge
                className={
                  selectedData.maxRisk === "Level1"
                    ? "bg-red-500 text-white"
                    : selectedData.maxRisk === "Level2"
                    ? "bg-amber-500 text-white"
                    : "bg-blue-100 text-blue-700"
                }
              >
                {selectedData.maxRisk}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {selectedData.alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-xs">
                  <span className="text-gray-400 mr-1">{alert.alert_type}</span>
                  <span className="text-gray-700 line-clamp-1">{alert.title}</span>
                </div>
              ))}
              {selectedData.alerts.length > 3 && (
                <p className="text-xs text-gray-400">
                  외 {selectedData.alerts.length - 3}건
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
