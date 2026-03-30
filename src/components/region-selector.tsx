"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RegionPref {
  sido: string;
  sigungu: string | null;
}

interface RegionSelectorProps {
  value: RegionPref[];
  onChange: (regions: RegionPref[]) => void;
}

export function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const [regions, setRegions] = useState<Record<string, string[]>>({});
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions)
      .catch(() => {});
  }, []);

  const addRegion = () => {
    if (!selectedSido) return;

    const newRegion: RegionPref = {
      sido: selectedSido,
      sigungu: selectedSigungu || null,
    };

    // 중복 체크
    const exists = value.some(
      (r) => r.sido === newRegion.sido && r.sigungu === newRegion.sigungu
    );
    if (exists) return;

    onChange([...value, newRegion]);
    setSelectedSido("");
    setSelectedSigungu("");
  };

  const removeRegion = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const sidos = Object.keys(regions);
  const sigungus = selectedSido ? regions[selectedSido] || [] : [];

  return (
    <div className="space-y-3">
      {/* 선택된 지역 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((region, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-200"
            >
              {region.sido}
              {region.sigungu && ` ${region.sigungu}`}
              <button
                type="button"
                onClick={() => removeRegion(i)}
                className="hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 선택 드롭다운 */}
      <div className="flex gap-2">
        <select
          value={selectedSido}
          onChange={(e) => {
            setSelectedSido(e.target.value);
            setSelectedSigungu("");
          }}
          className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-sm"
        >
          <option value="">{"시/도 선택"}</option>
          {sidos.map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>

        <select
          value={selectedSigungu}
          onChange={(e) => setSelectedSigungu(e.target.value)}
          className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-sm"
          disabled={!selectedSido || sigungus.length === 0}
        >
          <option value="">{"전체 (시/도)"}</option>
          {sigungus.map((sg) => (
            <option key={sg} value={sg}>
              {sg}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          onClick={addRegion}
          disabled={!selectedSido}
          className="h-9"
        >
          {"추가"}
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-gray-400">
          {"지역을 선택하지 않으면 전국 정보가 제공됩니다."}
        </p>
      )}
    </div>
  );
}
