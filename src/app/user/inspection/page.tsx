"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsListSkeleton } from "@/components/skeleton-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Printer } from "lucide-react";

interface InspectionItem {
  id: number;
  seq: number;
  category: string;
  criteria: string;
  method: string;
  content: string;
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "단식", label: "단식 (배달·간편음식점)" },
  { value: "복식", label: "복식 (일반음식점)" },
  { value: "제조사", label: "제조사 (식품제조가공)" },
  { value: "공통", label: "공통" },
];

export default function InspectionPage() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [checks, setChecks] = useState<Record<number, string>>({});
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const printRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);

    try {
      const res = await fetch(`/api/inspection?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setChecks({});
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCheck = (id: number, value: string) => {
    setChecks((prev) => ({
      ...prev,
      [id]: prev[id] === value ? "" : value,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // 점검기준별 그룹핑
  const grouped: Record<string, InspectionItem[]> = {};
  for (const item of items) {
    if (!grouped[item.criteria]) grouped[item.criteria] = [];
    grouped[item.criteria].push(item);
  }

  const categoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label || "전체";

  return (
    <>
      {/* 인쇄용 스타일 */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, .sidebar,
          [class*="sidebar"], [class*="aside"] {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11px;
          }
          .print-area {
            padding: 0 !important;
          }
          .print-table {
            page-break-inside: auto;
          }
          .print-table tr {
            page-break-inside: avoid;
          }
          .check-cell {
            text-align: center;
            font-size: 14px;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      <div className="space-y-6 print-area" ref={printRef}>
        {/* 헤더 (화면용) */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h2 className="text-2xl font-bold">위생자율점검지</h2>
            <p className="text-gray-500 text-sm mt-1">
              업종별 위생 자율점검 항목을 조회하고 출력할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v ?? "all")}
            >
              <SelectTrigger className="w-52">
                <span>{categoryLabel}</span>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              인쇄
            </Button>
          </div>
        </div>

        {loading ? (
          <NewsListSkeleton />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>점검항목이 없습니다.</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg">
                {category === "all"
                  ? "위생 자율점검표"
                  : `${categoryLabel} 자율 위생관리 점검표`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 업소 정보 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border rounded-lg p-4 bg-gray-50">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    상호 (업소명)
                  </label>
                  <Input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="업소명 입력"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    주소
                  </label>
                  <Input
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="주소 입력"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    점검일자
                  </label>
                  <Input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* 점검표 테이블 */}
              <table className="w-full border-collapse print-table text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left w-28">
                      구분
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left">
                      점검사항
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">
                      적합
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">
                      부적합
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([criteria, groupItems]) => (
                    groupItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {idx === 0 && (
                          <td
                            className="border border-gray-300 px-3 py-2 font-medium text-gray-700 bg-gray-50 align-top text-xs"
                            rowSpan={groupItems.length}
                          >
                            {criteria}
                          </td>
                        )}
                        <td className="border border-gray-300 px-3 py-2 text-gray-600">
                          <span className="text-gray-400 mr-1 text-xs">
                            {item.seq ? `${item.seq}.` : ""}
                          </span>
                          {item.content}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center check-cell">
                          <button
                            onClick={() => handleCheck(item.id, "O")}
                            className={`w-7 h-7 rounded border-2 text-sm font-bold transition-colors ${
                              checks[item.id] === "O"
                                ? "bg-teal-500 border-teal-500 text-white"
                                : "border-gray-300 text-gray-300 hover:border-teal-400"
                            }`}
                          >
                            O
                          </button>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center check-cell">
                          <button
                            onClick={() => handleCheck(item.id, "X")}
                            className={`w-7 h-7 rounded border-2 text-sm font-bold transition-colors ${
                              checks[item.id] === "X"
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-gray-300 text-gray-300 hover:border-red-400"
                            }`}
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>

              {/* 하단 서명란 */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="border-t pt-2 text-center">
                  <p className="text-xs text-gray-400 mb-4">점검자</p>
                  <p className="text-gray-300">(서명)</p>
                </div>
                <div className="border-t pt-2 text-center">
                  <p className="text-xs text-gray-400 mb-4">확인자</p>
                  <p className="text-gray-300">(서명)</p>
                </div>
                <div className="border-t pt-2 text-center">
                  <p className="text-xs text-gray-400 mb-4">비고</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
