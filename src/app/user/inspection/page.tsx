"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsListSkeleton } from "@/components/skeleton-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Printer, AlertCircle } from "lucide-react";

interface InspectionItem {
  id: number;
  category: string;
  criteria: string;
  method: string;
  content: string;
}

const CATEGORIES = [
  { value: "일반음식점", label: "일반음식점" },
  { value: "단체급식", label: "단체급식" },
  { value: "식자재납품", label: "식자재납품" },
  { value: "식품공장", label: "식품공장" },
  { value: "배달간편", label: "배달·간편음식점" },
];

export default function InspectionPage() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("일반음식점");
  const [checks, setChecks] = useState<Record<number, string>>({});
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [printError, setPrintError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("category", category);

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
    if (!shopName.trim()) {
      setPrintError("업소명을 입력해주세요.");
      return;
    }
    if (!shopAddress.trim()) {
      setPrintError("주소를 입력해주세요.");
      return;
    }
    setPrintError("");
    const originalTitle = document.title;
    document.title = `${shopName.trim()}_${inspectionDate}`;
    window.print();
    document.title = originalTitle;
  };

  // 점검기준별 그룹핑
  const grouped: Record<string, InspectionItem[]> = {};
  for (const item of items) {
    if (!grouped[item.criteria]) grouped[item.criteria] = [];
    grouped[item.criteria].push(item);
  }

  const categoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label || category;

  return (
    <>
      {/* 인쇄용 스타일 — A4 양식 최적화 */}
      <style>{`
        @media print {
          /* 사이드바, 헤더, 버튼 등 숨김 */
          nav, aside, header, .no-print, .sidebar,
          [class*="sidebar"], [class*="aside"],
          [class*="bg-slate-900"] {
            display: none !important;
          }
          /* 전체 레이아웃 리셋 */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10pt !important;
            font-family: "맑은 고딕", "Malgun Gothic", sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: #000 !important;
            background: #fff !important;
          }
          main, [class*="flex-1"], [class*="overflow"] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          /* 카드 스타일 제거 */
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          /* 인쇄 영역 */
          .print-area {
            padding: 0 !important;
            margin: 0 !important;
          }
          /* 테이블 스타일 */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
            font-size: 9pt;
          }
          .print-table th, .print-table td {
            border: 1px solid #333 !important;
            padding: 4px 6px !important;
            color: #000 !important;
          }
          .print-table th {
            background: #f0f0f0 !important;
            font-weight: bold !important;
          }
          .print-table tr {
            page-break-inside: avoid;
          }
          /* 체크 표시 */
          .print-check {
            width: 20px;
            height: 20px;
            display: inline-block;
            text-align: center;
            line-height: 20px;
            font-size: 14pt;
            font-weight: bold;
          }
          .print-check-o { color: #000; }
          .print-check-x { color: #cc0000; }
          .print-check-empty {
            border: 1px solid #999;
            border-radius: 2px;
            width: 16px;
            height: 16px;
            display: inline-block;
          }
          /* 서명란 */
          .print-signature {
            margin-top: 20px;
            page-break-inside: avoid;
          }
          /* 업소 정보 */
          .print-info {
            border: 1px solid #333;
            margin-bottom: 10px;
          }
          .print-info td {
            padding: 4px 8px !important;
            border: 1px solid #333 !important;
            font-size: 10pt;
          }
          .print-info .label {
            background: #f0f0f0 !important;
            font-weight: bold;
            width: 80px;
            text-align: center;
          }
          /* 페이지 설정 */
          /* 챗봇 아이콘 및 fixed 요소 숨김 */
          .floating-chat, [class*="floating"], [class*="chat-button"],
          button[aria-label*="chat"], [id*="chat"],
          .fixed, [style*="position: fixed"], [class*="fixed"] {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 8mm 10mm;
          }
          /* 브라우저 머리글/바닥글(URL) 영역 최소화 */
          @page :first { margin-top: 8mm; }
          @page { margin-top: 5mm; margin-bottom: 5mm; }
        }
      `}</style>

      <div className="space-y-6 print-area">
        {/* 화면용 헤더 */}
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
              onValueChange={(v) => v && setCategory(v)}
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

        {/* 인쇄 필수입력 에러 */}
        {printError && (
          <div className="flex items-center gap-2 text-red-500 text-sm no-print">
            <AlertCircle className="w-4 h-4" />
            {printError}
          </div>
        )}

        {loading ? (
          <NewsListSkeleton />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>점검항목이 없습니다.</p>
          </div>
        ) : (
          <Card className="print-card">
            <CardContent className="p-6">
              {/* 인쇄용 제목 (화면에서는 숨김) */}
              <div className="hidden print:block text-center mb-4">
                <h1 style={{ fontSize: "16pt", fontWeight: "bold", marginBottom: "4px" }}>
                  {categoryLabel} 자율 위생관리 점검표
                </h1>
                <p style={{ fontSize: "9pt", color: "#666" }}>AI-FX Food Intelligence Platform</p>
              </div>

              {/* 화면용 제목 */}
              <h3 className="text-center text-lg font-bold mb-4 print:hidden">
                {categoryLabel} 자율 위생관리 점검표
              </h3>

              {/* 업소 정보 — 화면용 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border rounded-lg p-4 bg-gray-50 no-print">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    상호 (업소명) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={shopName}
                    onChange={(e) => { setShopName(e.target.value); setPrintError(""); }}
                    placeholder="업소명 입력 (인쇄 필수)"
                    className={`bg-white ${!shopName.trim() && printError ? "border-red-400" : ""}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={shopAddress}
                    onChange={(e) => { setShopAddress(e.target.value); setPrintError(""); }}
                    placeholder="주소 입력 (인쇄 필수)"
                    className={`bg-white ${!shopAddress.trim() && printError ? "border-red-400" : ""}`}
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

              {/* 인쇄용 업소 정보 테이블 (화면에서 숨김) */}
              <table className="hidden print:table print-info w-full mb-3" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td className="label">상 호</td>
                    <td>{shopName || ""}</td>
                    <td className="label">점검일자</td>
                    <td>{inspectionDate}</td>
                  </tr>
                  <tr>
                    <td className="label">주 소</td>
                    <td colSpan={3}>{shopAddress || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* 점검표 테이블 */}
              <table className="w-full border-collapse print-table text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-center w-28">
                      구분
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center">
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
                  {(() => {
                    let globalSeq = 0;
                    return Object.entries(grouped).map(([criteria, groupItems]) =>
                      groupItems.map((item, idx) => {
                        globalSeq++;
                        return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                            {globalSeq}.
                          </span>
                          {item.content}
                        </td>
                        {/* 화면용 O/X 버튼 */}
                        <td className="border border-gray-300 px-2 py-2 text-center print:hidden">
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
                        <td className="border border-gray-300 px-2 py-2 text-center print:hidden">
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
                        {/* 인쇄용 O/X 표시 */}
                        <td className="hidden print:table-cell border border-gray-300 text-center">
                          {checks[item.id] === "O" ? (
                            <span className="print-check print-check-o">O</span>
                          ) : (
                            <span className="print-check-empty" />
                          )}
                        </td>
                        <td className="hidden print:table-cell border border-gray-300 text-center">
                          {checks[item.id] === "X" ? (
                            <span className="print-check print-check-x">X</span>
                          ) : (
                            <span className="print-check-empty" />
                          )}
                        </td>
                      </tr>
                        );
                      })
                    );
                  })()}
                </tbody>
              </table>

              {/* 서명란 */}
              <div className="mt-6 print-signature">
                <table className="w-full border-collapse hidden print:table" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #333", width: "33%", padding: "6px 12px", fontSize: "9pt" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>점검자</strong>
                          <span style={{ color: "#999" }}>(서명)</span>
                        </div>
                      </td>
                      <td style={{ border: "1px solid #333", width: "33%", padding: "6px 12px", fontSize: "9pt" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>확인자</strong>
                          <span style={{ color: "#999" }}>(서명)</span>
                        </div>
                      </td>
                      <td style={{ border: "1px solid #333", width: "34%", padding: "6px 12px", fontSize: "9pt" }}>
                        <strong>비고</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* 화면용 서명란 */}
                <div className="flex gap-4 text-sm text-gray-500 border-t pt-3 print:hidden">
                  <div className="flex-1 flex items-center justify-between px-3">
                    <span className="text-xs font-medium text-gray-400">점검자</span>
                    <span className="text-gray-300 text-xs">(서명)</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between px-3 border-l">
                    <span className="text-xs font-medium text-gray-400">확인자</span>
                    <span className="text-gray-300 text-xs">(서명)</span>
                  </div>
                  <div className="flex-1 flex items-center px-3 border-l">
                    <span className="text-xs font-medium text-gray-400">비고</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
