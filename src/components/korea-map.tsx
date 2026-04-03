"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

/* ── Leaflet을 SSR 없이 로드 ── */

const LeafletMap = dynamic(() => import("@/components/korea-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] bg-gray-50 text-gray-400 text-sm">
      지도 로딩 중...
    </div>
  ),
});

/* ── 지역 → 위경도 매핑 ── */

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.978 },
  경기: { lat: 37.275, lng: 127.01 },
  인천: { lat: 37.4563, lng: 126.7052 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  세종: { lat: 36.48, lng: 127.0 },
  강원: { lat: 37.8228, lng: 128.1555 },
  충북: { lat: 36.6357, lng: 127.4913 },
  충남: { lat: 36.5184, lng: 126.8 },
  전북: { lat: 35.82, lng: 127.15 },
  전남: { lat: 34.816, lng: 126.463 },
  경북: { lat: 36.576, lng: 128.506 },
  경남: { lat: 35.46, lng: 128.2132 },
  제주: { lat: 33.4996, lng: 126.5312 },
  전국: { lat: 36.8, lng: 130.2 },
};

/* ── Types ── */

interface CrackdownAlert {
  id: number;
  title: string;
  alert_type: string;
  risk_level: string;
  region: string;
  summary?: string;
}

export interface MapMarker {
  lat: number;
  lng: number;
  region: string;
  count: number;
  maxRisk: string;
  alerts: CrackdownAlert[];
}

interface KoreaMapProps {
  className?: string;
}

interface PoisonRisk {
  sido: string;
  today: number;
  todayLabel: string;
  tomorrow: number;
  tomorrowLabel: string;
  afterTomorrow: number;
  afterTomorrowLabel: string;
  baseDate: string;
}

const RISK_LABEL_COLORS: Record<string, string> = {
  "위험": "bg-red-100 text-red-700",
  "경고": "bg-orange-100 text-orange-700",
  "주의": "bg-amber-100 text-amber-700",
  "관심": "bg-yellow-50 text-yellow-700",
  "안전": "bg-emerald-50 text-emerald-700",
};

const SIDO_TO_REGION: Record<string, string> = {
  "서울특별시": "서울", "경기도": "경기", "인천광역시": "인천",
  "부산광역시": "부산", "대구광역시": "대구", "광주광역시": "광주",
  "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
  "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
  "전북특별자치도": "전북", "전라남도": "전남",
  "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주",
};

export function KoreaMap({ className }: KoreaMapProps) {
  const [alerts, setAlerts] = useState<CrackdownAlert[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapTab, setMapTab] = useState<"crackdown" | "poison">("crackdown");
  const [poisonDay, setPoisonDay] = useState<"today" | "tomorrow" | "after">("today");
  const [poisonData, setPoisonData] = useState<PoisonRisk[]>([]);
  const [poisonBaseDate, setPoisonBaseDate] = useState("");

  useEffect(() => {
    fetch("/api/crackdown?days=90")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAlerts(Array.isArray(d) ? d : []))
      .catch(() => setAlerts([]));

    fetch("/api/food-poisoning/realtime")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.summary) {
          setPoisonData(d.summary);
          setPoisonBaseDate(d.baseDate || "");
        }
      })
      .catch(() => {});
  }, []);

  // 지역별 집계 → 마커 데이터 생성
  const markers: MapMarker[] = (() => {
    const stats: Record<string, { count: number; maxRisk: string; alerts: CrackdownAlert[] }> = {};
    for (const alert of alerts) {
      const region = alert.region || "전국";
      if (!REGION_COORDS[region]) continue;
      if (!stats[region]) {
        stats[region] = { count: 0, maxRisk: "Level3", alerts: [] };
      }
      stats[region].count++;
      stats[region].alerts.push(alert);
      if (alert.risk_level === "Level1") {
        stats[region].maxRisk = "Level1";
      } else if (alert.risk_level === "Level2" && stats[region].maxRisk !== "Level1") {
        stats[region].maxRisk = "Level2";
      }
    }

    return Object.entries(stats).map(([region, data]) => ({
      lat: REGION_COORDS[region].lat,
      lng: REGION_COORDS[region].lng,
      region,
      ...data,
    }));
  })();

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* 탭 */}
          <div className="flex gap-1">
            <button
              onClick={() => { setMapTab("crackdown"); setSelectedMarker(null); }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                mapTab === "crackdown" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              단속 현황
            </button>
            <button
              onClick={() => { setMapTab("poison"); setSelectedMarker(null); }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                mapTab === "poison" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              식중독 예측
            </button>
          </div>
          <span className="text-xs text-gray-400 font-normal">
            {mapTab === "crackdown"
              ? `최근 90일 · ${markers.reduce((s, m) => s + m.count, 0)}건`
              : `기준일 ${poisonBaseDate.slice(0,4)}.${poisonBaseDate.slice(4,6)}.${poisonBaseDate.slice(6,8)}`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        {mapTab === "crackdown" ? (
          <>
            <LeafletMap markers={markers} onMarkerClick={setSelectedMarker} />
            {selectedMarker && (
              <div className="p-3 border-t bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={
                      selectedMarker.maxRisk === "Level1"
                        ? "bg-red-500 text-white"
                        : selectedMarker.maxRisk === "Level2"
                        ? "bg-amber-500 text-white"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {selectedMarker.maxRisk}
                  </Badge>
                  <span className="font-semibold text-sm">{selectedMarker.region}</span>
                  <span className="text-xs text-gray-400">{selectedMarker.count}건</span>
                </div>
                <div className="space-y-1 mt-2">
                  {selectedMarker.alerts.slice(0, 5).map((alert) => (
                    <Link key={alert.id} href={`/user/crackdown?id=${alert.id}`} className="block text-xs hover:bg-gray-50 rounded px-1 py-0.5 -mx-1 transition-colors">
                      <span className="text-gray-400 mr-1">{alert.alert_type}</span>
                      <span className="text-blue-600 hover:underline line-clamp-1">{alert.title}</span>
                    </Link>
                  ))}
                  {selectedMarker.alerts.length > 5 && (
                    <Link href={`/user/crackdown?region=${selectedMarker.region}`} className="text-xs text-teal-600 hover:underline block mt-1">
                      전체 {selectedMarker.alerts.length}건 보기 →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 식중독 예측 지도 */
          <>
            {/* 오늘/내일/모레 서브탭 */}
            <div className="flex gap-1 px-3 pt-2 pb-1">
              {([["today", "오늘"], ["tomorrow", "내일"], ["after", "모레"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPoisonDay(key)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    poisonDay === key ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <LeafletMap
              markers={[]}
              onMarkerClick={() => {}}
              mode="poison"
              poisonMarkers={poisonData.map(d => {
                const regionKey = SIDO_TO_REGION[d.sido] || d.sido;
                const coords = REGION_COORDS[regionKey];
                if (!coords) return null;
                const score = poisonDay === "today" ? d.today : poisonDay === "tomorrow" ? d.tomorrow : d.afterTomorrow;
                const label = poisonDay === "today" ? d.todayLabel : poisonDay === "tomorrow" ? d.tomorrowLabel : d.afterTomorrowLabel;
                return { lat: coords.lat, lng: coords.lng, region: regionKey, score, label };
              }).filter(Boolean) as { lat: number; lng: number; region: string; score: number; label: string }[]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
