"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ── 타입 ── */

interface MapAlert {
  id: number;
  title: string;
  alert_type: string;
  region: string | null;
  summary: string;
  risk_level: string;
  enforcement_date: string | null;
  source: string;
}

interface CrackdownMapProps {
  alerts: MapAlert[];
}

/* ── 지역별 좌표 ── */

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
};

const RISK_COLORS: Record<string, string> = {
  Level1: "#ef4444",
  Level2: "#f59e0b",
  Level3: "#3b82f6",
};

/* ── 컴포넌트 ── */

export function CrackdownMap({ alerts }: CrackdownMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 지역별 알림 집계
  const regionCounts: Record<string, { count: number; maxRisk: string; alerts: MapAlert[] }> = {};
  for (const alert of alerts) {
    const region = alert.region || "전국";
    if (!REGION_COORDS[region]) continue;
    if (!regionCounts[region]) {
      regionCounts[region] = { count: 0, maxRisk: "Level3", alerts: [] };
    }
    regionCounts[region].count++;
    regionCounts[region].alerts.push(alert);
    if (alert.risk_level === "Level1") regionCounts[region].maxRisk = "Level1";
    else if (alert.risk_level === "Level2" && regionCounts[region].maxRisk !== "Level1") {
      regionCounts[region].maxRisk = "Level2";
    }
  }

  // 네이버 맵 스크립트 로드
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 미설정");
      return;
    }

    if (typeof window !== "undefined" && (window as any).naver?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 지도 초기화 + 마커 배치
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const naver = (window as any).naver;
    if (!naver?.maps) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(36.0, 127.5),
      zoom: 7,
      mapTypeId: naver.maps.MapTypeId.NORMAL,
    });
    mapInstanceRef.current = map;

    // 지역별 원형 마커 + 라벨
    Object.entries(regionCounts).forEach(([region, data]) => {
      const coords = REGION_COORDS[region];
      if (!coords) return;

      const color = RISK_COLORS[data.maxRisk] || "#94a3b8";
      const size = Math.min(20 + data.count * 5, 50);

      // 원형 오버레이
      const circle = new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(coords.lat, coords.lng),
        radius: size * 500,
        fillColor: color,
        fillOpacity: 0.35,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 2,
      });

      // 마커
      const marker = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(coords.lat, coords.lng),
        icon: {
          content: `<div style="
            background:${color};
            color:white;
            border-radius:50%;
            width:${size}px;
            height:${size}px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:12px;
            font-weight:bold;
            box-shadow:0 2px 8px ${color}80;
            cursor:pointer;
          ">${data.count}</div>`,
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
      });

      naver.maps.Event.addListener(marker, "click", () => {
        if (data.alerts.length > 0) {
          setSelectedAlert(data.alerts[0]);
        }
      });
    });
  }, [mapLoaded, alerts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 지도 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">전국 단속 현황</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl">
            <div
              ref={mapRef}
              style={{ width: "100%", height: "400px" }}
              className="bg-gray-100"
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  지도 로딩 중...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사이드 패널 */}
      <div>
        {selectedAlert ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className={
                  selectedAlert.risk_level === "Level1" ? "bg-red-500 text-white" :
                  selectedAlert.risk_level === "Level2" ? "bg-amber-500 text-white" :
                  "bg-blue-100 text-blue-700"
                }>
                  {selectedAlert.risk_level}
                </Badge>
                {selectedAlert.alert_type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{selectedAlert.title}</p>
              {selectedAlert.region && (
                <div className="text-gray-400">📍 {selectedAlert.region}</div>
              )}
              {selectedAlert.enforcement_date && (
                <div className="text-gray-400">📅 {selectedAlert.enforcement_date}</div>
              )}
              <div className="text-gray-400">📰 {selectedAlert.source}</div>
              {selectedAlert.summary && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
                  <span className="text-emerald-600 font-medium">AI 요약: </span>
                  {selectedAlert.summary}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-400 text-sm">
              <p>지도의 마커를 클릭하면</p>
              <p>AI 분석 결과가 표시됩니다</p>
            </CardContent>
          </Card>
        )}

        {/* 지역별 요약 */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">지역별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(regionCounts)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([region, data]) => (
                  <div
                    key={region}
                    className="flex items-center justify-between text-xs py-1 cursor-pointer hover:bg-gray-50 rounded px-1"
                    onClick={() => data.alerts[0] && setSelectedAlert(data.alerts[0])}
                  >
                    <span className="text-gray-600">{region}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: RISK_COLORS[data.maxRisk] || "#94a3b8" }}
                      />
                      <span className="font-medium">{data.count}건</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
