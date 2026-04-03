"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { MapMarker } from "@/components/korea-map";
import "leaflet/dist/leaflet.css";

const RISK_COLORS: Record<string, string> = {
  Level1: "#ef4444",
  Level2: "#f59e0b",
  Level3: "#14b8a6",
};

const RISK_LABELS: Record<string, string> = {
  Level1: "즉시 대응",
  Level2: "주의 관찰",
  Level3: "참고",
};

/* ── 지역명+건수를 지도 위에 항상 표시하는 DivIcon 마커 ── */

function RegionLabels({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    const labelMarkers: L.Marker[] = [];

    for (const m of markers) {
      const color = RISK_COLORS[m.maxRisk] || "#14b8a6";
      const isNational = m.region === "전국";
      const nameFontSize = isNational ? "13px" : "11px";
      const countFontSize = isNational ? "12px" : "10px";
      const countPadding = isNational ? "2px 8px" : "1px 5px";
      const iconW = isNational ? 80 : 60;
      const iconH = isNational ? 44 : 36;

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            display:flex;flex-direction:column;align-items:center;
            pointer-events:none;transform:translateY(-28px);
          ">
            <span style="
              font-size:${nameFontSize};font-weight:${isNational ? 800 : 700};color:${isNational ? "#0f766e" : "#1e293b"};
              text-shadow:0 0 3px white,0 0 3px white,0 0 3px white;
              white-space:nowrap;
            ">${m.region}</span>
            <span style="
              font-size:${countFontSize};font-weight:800;color:${isNational ? "white" : color};
              background:${isNational ? "#0f766e" : "white"};border-radius:8px;padding:${countPadding};
              box-shadow:0 1px 3px rgba(0,0,0,0.15);
              margin-top:1px;white-space:nowrap;
            ">${m.count}건</span>
          </div>
        `,
        iconSize: [iconW, iconH],
        iconAnchor: [iconW / 2, iconH / 2],
      });

      const marker = L.marker([m.lat, m.lng], { icon, interactive: false });
      marker.addTo(map);
      labelMarkers.push(marker);
    }

    return () => {
      for (const lm of labelMarkers) {
        map.removeLayer(lm);
      }
    };
  }, [map, markers]);

  return null;
}

/* ── 범례 컨트롤 ── */

function LegendControl() {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: "bottomleft" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.innerHTML = `
        <div style="
          background:white;padding:8px 12px;border-radius:8px;
          box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;
          line-height:1.6;
        ">
          <div style="font-weight:700;margin-bottom:4px;color:#334155;">위험등급</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
            <span style="color:#334155;">Level1 즉시 대응</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
            <span style="color:#334155;">Level2 주의 관찰</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#14b8a6;display:inline-block;"></span>
            <span style="color:#334155;">Level3 참고</span>
          </div>
          <div style="margin-top:4px;color:#94a3b8;font-size:10px;">원 크기 = 단속 건수</div>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

/* ── 식중독 예측 마커 ── */

interface PoisonMarker {
  lat: number;
  lng: number;
  region: string;
  score: number;
  label: string;
}

const POISON_COLORS: Record<string, string> = {
  "위험": "#ef4444",
  "경고": "#f97316",
  "주의": "#f59e0b",
  "관심": "#eab308",
  "안전": "#22c55e",
};

function PoisonLabels({ markers }: { markers: PoisonMarker[] }) {
  const map = useMap();

  useEffect(() => {
    const labelMarkers: L.Marker[] = [];

    for (const m of markers) {
      const color = POISON_COLORS[m.label] || "#22c55e";
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            display:flex;flex-direction:column;align-items:center;
            pointer-events:none;transform:translateY(-28px);
          ">
            <span style="
              font-size:11px;font-weight:700;color:#1e293b;
              text-shadow:0 0 3px white,0 0 3px white;
              white-space:nowrap;
            ">${m.region}</span>
            <span style="
              font-size:11px;font-weight:800;color:white;
              background:${color};border-radius:8px;padding:1px 6px;
              box-shadow:0 1px 3px rgba(0,0,0,0.2);
              margin-top:1px;white-space:nowrap;
            ">${m.score}</span>
          </div>
        `,
        iconSize: [60, 36],
        iconAnchor: [30, 18],
      });

      const marker = L.marker([m.lat, m.lng], { icon, interactive: false });
      marker.addTo(map);
      labelMarkers.push(marker);
    }

    return () => {
      for (const lm of labelMarkers) map.removeLayer(lm);
    };
  }, [map, markers]);

  return null;
}

function PoisonLegend() {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.innerHTML = `
        <div style="background:white;padding:8px 12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;line-height:1.6;">
          <div style="font-weight:700;margin-bottom:4px;color:#334155;">식중독 예측지수</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>86+ 위험</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#f97316;display:inline-block;"></span>71-85 경고</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>51-70 주의</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#eab308;display:inline-block;"></span>36-50 관심</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span>0-35 안전</div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);
    return () => { legend.remove(); };
  }, [map]);

  return null;
}

/* ── 메인 컴포넌트 ── */

interface LeafletMapProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  poisonMarkers?: PoisonMarker[];
  mode?: "crackdown" | "poison";
}

export default function LeafletMapComponent({
  markers,
  onMarkerClick,
  poisonMarkers = [],
  mode = "crackdown",
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[36.5, 127.8]}
      zoom={7}
      style={{ width: "100%", height: "450px" }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        attribution="&copy; CartoDB"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {mode === "crackdown" ? (
        <>
          {markers.map((marker) => {
            const color = RISK_COLORS[marker.maxRisk] || "#14b8a6";
            const radius = Math.min(8 + marker.count * 2, 24);
            return (
              <CircleMarker
                key={marker.region}
                center={[marker.lat, marker.lng]}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
                eventHandlers={{ click: () => onMarkerClick(marker) }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                  <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700 }}>{marker.region} — {marker.count}건</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      최고 위험: {RISK_LABELS[marker.maxRisk] || marker.maxRisk}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
          <RegionLabels markers={markers} />
          <LegendControl />
        </>
      ) : (
        <>
          {poisonMarkers.map((pm) => {
            const color = POISON_COLORS[pm.label] || "#22c55e";
            const radius = Math.max(12, Math.min(pm.score / 4, 25));
            return (
              <CircleMarker
                key={pm.region}
                center={[pm.lat, pm.lng]}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                  <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700 }}>{pm.region} — {pm.score}점</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>{pm.label}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
          <PoisonLabels markers={poisonMarkers} />
          <PoisonLegend />
        </>
      )}
    </MapContainer>
  );
}
