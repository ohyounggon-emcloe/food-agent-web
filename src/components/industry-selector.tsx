"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface IndustryPref {
  category: string;
  sub_type: string | null;
}

interface IndustrySelectorProps {
  value: IndustryPref[];
  onChange: (industries: IndustryPref[]) => void;
}

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  const [industries, setIndustries] = useState<Record<string, string[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/industries")
      .then((r) => r.json())
      .then(setIndustries)
      .catch(() => {});
  }, []);

  const isCategorySelected = (category: string) =>
    value.some((v) => v.category === category && v.sub_type === null);

  const isSubTypeSelected = (category: string, subType: string) =>
    value.some((v) => v.category === category && v.sub_type === subType);

  const toggleCategory = (category: string) => {
    if (isCategorySelected(category)) {
      // 대분류 해제 → 해당 대분류의 모든 선택 제거
      onChange(value.filter((v) => v.category !== category));
    } else {
      // 대분류 선택 → 해당 대분류의 세부 선택 제거 + 대분류 추가
      const filtered = value.filter((v) => v.category !== category);
      onChange([...filtered, { category, sub_type: null }]);
    }
  };

  const toggleSubType = (category: string, subType: string) => {
    if (isSubTypeSelected(category, subType)) {
      onChange(value.filter((v) => !(v.category === category && v.sub_type === subType)));
    } else {
      // 대분류 전체 선택이 있으면 제거하고 세부 선택으로 전환
      const filtered = value.filter(
        (v) => !(v.category === category && v.sub_type === null)
      );
      onChange([...filtered, { category, sub_type: subType }]);
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const categories = Object.keys(industries);

  return (
    <div className="space-y-3">
      {/* 선택된 업태 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
            >
              {item.category}
              {item.sub_type && ` > ${item.sub_type}`}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 업태 체크박스 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {categories.map((category) => {
          const subTypes = industries[category] || [];
          const isExpanded = expandedCategory === category;
          const selected = isCategorySelected(category);

          return (
            <div key={category} className="border rounded-md p-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected || value.some((v) => v.category === category)}
                  onChange={() => toggleCategory(category)}
                  className="rounded border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="text-sm font-medium text-left flex-1 hover:text-emerald-600"
                >
                  {category}
                  {subTypes.length > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </div>

              {isExpanded && subTypes.length > 0 && (
                <div className="mt-2 pl-5 space-y-1 border-t pt-2">
                  {subTypes.map((subType) => (
                    <label
                      key={subType}
                      className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={isSubTypeSelected(category, subType) || selected}
                        disabled={selected}
                        onChange={() => toggleSubType(category, subType)}
                        className="rounded border-gray-300"
                      />
                      {subType}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-gray-400">
          {"업태를 선택하지 않으면 전체 업태 정보가 제공됩니다."}
        </p>
      )}
    </div>
  );
}
