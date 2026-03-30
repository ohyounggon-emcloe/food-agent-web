"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

/* ── Props ── */

interface KoreaMapProps {
  className?: string;
}

/* ── 컴포넌트 ── */

export function KoreaMap({ className }: KoreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // 단속 데이터 로드
  useEffect(() => {
    fetch("/api/crackdown?days=30")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]));
  }, []);

  // 지역별 집계
  const regionCounts: Record<string, { count: number; maxRisk: string; alerts: any[] }> = {};
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
    if (!clientId) return;

    if (typeof window !== "undefined" && (window as any).naver?.maps) {
      setMapLoaded(true);
      return;
    }

    const existing = document.querySelector('script[src*="oapi.map.naver.com"]');
    if (existing) {
      existing.addEventListener("load", () => setMapLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || alerts.length === 0) return;
    const naver = (window as any).naver;
    if (!naver?.maps) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(36.0, 127.5),
      zoom: 7,
    });

    // 지역별 마커
    Object.entries(regionCounts).forEach(([region, data]) => {
      const coords = REGION_COORDS[region];
      if (!coords) return;
      const color = RISK_COLORS[data.maxRisk] || "#94a3b8";
      const size = Math.min(24 + data.count * 4, 48);

      // Heatmap 원형
      new naver.maps.Circle({
        map,
        center: new naver.maps.LatLng(coords.lat, coords.lng),
        radius: data.count * 3000 + 5000,
        fillColor: color,
        fillOpacity: 0.25,
        strokeWeight: 0,
      });

      // 숫자 마커
      const marker = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(coords.lat, coords.lng),
        icon: {
          content: `<div style="
            background:${color};color:white;border-radius:50%;
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;
            box-shadow:0 2px 8px ${color}80;cursor:pointer;
            border:2px solid white;
          ">${data.count}</div>`,
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
      });

      naver.maps.Event.addListener(marker, "click", () => {
        setSelectedAlert(data.alerts[0]);
      });
    });
  }, [mapLoaded, alerts]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>전국 단속 현황</span>
          <span className="text-xs text-gray-400 font-normal">{alerts.length}건</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        <div ref={mapRef} style={{ width: "100%", height: "320px" }} className="bg-gray-100">
          {!mapLoaded && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              지도 로딩 중...
            </div>
          )}
        </div>

        {/* 선택된 알림 팝업 */}
        {selectedAlert && (
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={
                selectedAlert.risk_level === "Level1" ? "bg-red-500 text-white" :
                selectedAlert.risk_level === "Level2" ? "bg-amber-500 text-white" :
                "bg-blue-100 text-blue-700"
              }>
                {selectedAlert.risk_level}
              </Badge>
              <span className="text-xs text-gray-400">{selectedAlert.alert_type}</span>
              {selectedAlert.region && <span className="text-xs text-gray-400">📍{selectedAlert.region}</span>}
            </div>
            <p className="text-sm font-medium line-clamp-2">{selectedAlert.title}</p>
            {selectedAlert.summary && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                <span className="text-emerald-600">AI: </span>{selectedAlert.summary}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
