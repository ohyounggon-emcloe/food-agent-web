"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsListSkeleton } from "@/components/skeleton-loader";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── 타입 ── */

interface CrackdownAlert {
  id: number;
  title: string;
  alert_type: string;
  source: string;
  source_url: string;
  region: string | null;
  target_industry: string | null;
  enforcement_date: string | null;
  violation_law: string | null;
  disposition: string | null;
  summary: string;
  checklist: string | object[];
  risk_level: string;
  created_at: string;
}

/* ── 상수 ── */

const TYPE_LABELS: Record<string, string> = {
  "단속예고": "단속예고",
  "점검공지": "점검공지",
  "행정처분": "행정처분",
  "회수명령": "회수명령",
  "판매중지": "판매중지",
};

const TYPE_COLORS: Record<string, string> = {
  "단속예고": "bg-red-500 text-white",
  "점검공지": "bg-amber-500 text-white",
  "행정처분": "bg-purple-500 text-white",
  "회수명령": "bg-rose-600 text-white",
  "판매중지": "bg-red-700 text-white",
};

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-100 text-red-700",
  Level2: "bg-amber-100 text-amber-700",
  Level3: "bg-blue-100 text-blue-700",
};

const REGIONS = [
  "전체", "서울", "경기", "인천", "부산", "대구", "광주",
  "대전", "울산", "세종", "강원", "충북", "충남",
  "전북", "전남", "경북", "경남", "제주",
];

/* ── 페이지 ── */

export default function CrackdownPage() {
  return (
    <Suspense>
      <CrackdownContent />
    </Suspense>
  );
}

function CrackdownContent() {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<CrackdownAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("전체 유형");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [selectedAlert, setSelectedAlert] = useState<CrackdownAlert | null>(null);

  const fetchAlerts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("days", "30");
    if (typeFilter !== "전체 유형") params.set("alert_type", typeFilter);
    if (regionFilter !== "전체") params.set("region", regionFilter);

    try {
      const res = await fetch(`/api/crackdown?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setAlerts(list);

        // URL에 id가 있으면 해당 글 자동 선택
        const targetId = searchParams.get("id");
        if (targetId) {
          const found = list.find((a: CrackdownAlert) => a.id === Number(targetId));
          if (found) setSelectedAlert(found);
        }
      }
    } catch (err) {
      console.error("단속 정보 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, regionFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const parseChecklist = (checklist: string | object[]): object[] => {
    if (Array.isArray(checklist)) return checklist;
    try {
      return JSON.parse(checklist as string);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold">식품 단속정보</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`${typeFilter} · ${regionFilter} · ${alerts.length}건`}
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-3 flex-wrap items-center">
        <span className="text-sm text-gray-500">유형</span>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "전체 유형")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체 유형">전체 유형</SelectItem>
            <SelectItem value="단속예고">단속예고</SelectItem>
            <SelectItem value="점검공지">점검공지</SelectItem>
            <SelectItem value="행정처분">행정처분</SelectItem>
            <SelectItem value="회수명령">회수명령</SelectItem>
            <SelectItem value="판매중지">판매중지</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-gray-500">지역</span>
        <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v || "전체")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <NewsListSkeleton />
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">조건에 맞는 단속 정보가 없습니다</p>
          <p className="text-sm mt-1">데이터 수집 후 표시됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 알림 리스트 */}
          <div className="lg:col-span-2 space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`cursor-pointer transition hover:shadow-md ${
                  selectedAlert?.id === alert.id ? "ring-2 ring-teal-500" : ""
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge className={TYPE_COLORS[alert.alert_type] || "bg-gray-500 text-white"}>
                      {alert.alert_type}
                    </Badge>
                    <Badge className={RISK_COLORS[alert.risk_level] || ""} variant="outline">
                      {alert.risk_level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{alert.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{alert.source}</span>
                        {alert.region && <><span>·</span><span>{alert.region}</span></>}
                        {alert.enforcement_date && (
                          <><span>·</span><span>예정: {alert.enforcement_date}</span></>
                        )}
                      </div>
                      {alert.summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.summary}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 우측: 상세 + 체크리스트 (스크롤 따라감) */}
          <div className="space-y-4 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
            {selectedAlert ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">상세 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">제목: </span>
                      <span className="font-medium">{selectedAlert.title}</span>
                    </div>
                    {selectedAlert.violation_law && (
                      <div>
                        <span className="text-gray-400">위반 법규: </span>
                        <span className="text-red-600">{selectedAlert.violation_law}</span>
                      </div>
                    )}
                    {selectedAlert.disposition && (
                      <div>
                        <span className="text-gray-400">처분 내용: </span>
                        <span>{selectedAlert.disposition}</span>
                      </div>
                    )}
                    {selectedAlert.target_industry && (
                      <div>
                        <span className="text-gray-400">대상 업종: </span>
                        <span>{selectedAlert.target_industry}</span>
                      </div>
                    )}
                    {selectedAlert.source_url && (
                      <a
                        href={selectedAlert.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 text-xs hover:underline"
                      >
                        원문 보기 →
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      대비 체크리스트
                      <Badge variant="outline" className="ml-2">
                        {parseChecklist(selectedAlert.checklist).length}항목
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {parseChecklist(selectedAlert.checklist).length > 0 ? (
                      <div className="space-y-2">
                        {parseChecklist(selectedAlert.checklist).map((item: any, i: number) => (
                          <label
                            key={i}
                            className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input type="checkbox" className="mt-0.5 accent-teal-500" />
                            <div>
                              <p className="text-sm">{item.item}</p>
                              <span className="text-xs text-gray-400">{item.category}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">체크리스트 없음</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-400">
                  <p>알림을 선택하면 상세 정보와</p>
                  <p>대비 체크리스트가 표시됩니다</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
