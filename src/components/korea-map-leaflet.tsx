"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { MapMarker } from "@/components/korea-map";
import "leaflet/dist/leaflet.css";

const RISK_COLORS: Record<string, string> = {
  Level1: "#ef4444",
  Level2: "#f59e0b",
  Level3: "#14b8a6",
};

interface LeafletMapProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
}

export default function LeafletMapComponent({ markers, onMarkerClick }: LeafletMapProps) {
  return (
    <MapContainer
      center={[36.5, 127.8]}
      zoom={7}
      style={{ width: "100%", height: "400px" }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        attribution="&copy; CartoDB"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {markers.map((marker) => {
        const color = RISK_COLORS[marker.maxRisk] || "#14b8a6";
        const radius = Math.min(8 + marker.count * 2, 24);

        return (
          <CircleMarker
            key={marker.region}
            center={[marker.lat, marker.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onMarkerClick(marker),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div style={{ fontSize: "12px", fontWeight: 600 }}>
                {marker.region}: {marker.count}건
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
