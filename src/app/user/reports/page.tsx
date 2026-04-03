"use client";

import { useCallback, useEffect, useState } from "react";
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
import { FileText, ChevronDown, ChevronUp, Calendar, BarChart3 } from "lucide-react";

interface Report {
  id: number;
  report_type: "daily" | "weekly";
  // daily
  report_date?: string;
  // weekly
  industry?: string;
  week_start?: string;
  week_end?: string;
  // common
  title: string;
  summary: string;
  content: string;
  article_count: number;
  high_risk_count: number;
  created_at: string;
}

const INDUSTRY_LABELS: Record<string, string> = {
  general: "전체",
  catering: "급식",
  restaurant: "외식",
  manufacturing: "제조",
  distribution: "유통",
};

const INDUSTRY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700",
  catering: "bg-blue-100 text-blue-700",
  restaurant: "bg-amber-100 text-amber-700",
  manufacturing: "bg-purple-100 text-purple-700",
  distribution: "bg-teal-100 text-teal-700",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getReportKey = (r: Report) =>
    r.report_type === "daily" ? `daily-${r.report_date}` : `weekly-${r.industry}-${r.week_start}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"식품안전리포트"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {"AI가 매일/매주 자동 생성하는 식품안전 분석 리포트"}
          </p>
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <span>
              {typeFilter === "all" ? "전체" : typeFilter === "daily" ? "일일 리포트" : "주간 리포트"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="daily">일일 리포트</SelectItem>
            <SelectItem value="weekly">주간 리포트</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <NewsListSkeleton />
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{"리포트가 없습니다"}</p>
          <p className="text-xs mt-1">{"일일 리포트는 매일 자동 생성됩니다"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const key = getReportKey(report);
            const isExpanded = expandedId === key;
            const isDaily = report.report_type === "daily";

            return (
              <Card key={key} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isDaily ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Calendar className="w-3 h-3 mr-1" />
                          Daily
                        </Badge>
                      ) : (
                        <>
                          <Badge className="bg-indigo-100 text-indigo-700">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Weekly
                          </Badge>
                          <Badge className={INDUSTRY_COLORS[report.industry || "general"] || "bg-gray-100"}>
                            {INDUSTRY_LABELS[report.industry || "general"] || report.industry}
                          </Badge>
                        </>
                      )}
                      <CardTitle className="text-sm font-medium">
                        {report.title || (isDaily
                          ? report.report_date
                          : `${report.week_start} ~ ${report.week_end}`)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {report.article_count}건
                        {report.high_risk_count > 0 && (
                          <span className="text-red-500 ml-1">
                            (Level1·2 {report.high_risk_count}건)
                          </span>
                        )}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {!isExpanded && report.summary && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {report.summary}
                    </p>
                  )}
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    <div
                      className="mt-4 text-sm leading-relaxed text-gray-700 space-y-1"
                      dangerouslySetInnerHTML={{
                        __html: (report.content || "")
                          // 제목 스타일링
                          .replace(/^### (.*)/gm, '<h4 class="text-sm font-semibold text-gray-800 mt-4 mb-1">$1</h4>')
                          .replace(/^## (.*)/gm, '<h3 class="text-base font-bold text-gray-900 mt-5 mb-2 pb-1 border-b">$1</h3>')
                          .replace(/^# (.*)/gm, '<h2 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h2>')
                          // 강조
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                          // Level 아이콘
                          .replace(/🔴\s*/g, '<span class="inline-block w-3 h-3 bg-red-500 rounded-full mr-1 align-middle"></span>')
                          .replace(/🟡\s*/g, '<span class="inline-block w-3 h-3 bg-amber-400 rounded-full mr-1 align-middle"></span>')
                          .replace(/🔵\s*/g, '<span class="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1 align-middle"></span>')
                          .replace(/🟢\s*/g, '<span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-1 align-middle"></span>')
                          // 리스트
                          .replace(/^- (.*)/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-teal-500 mt-1 shrink-0">•</span><span>$1</span></div>')
                          .replace(/^• (.*)/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-teal-500 mt-1 shrink-0">•</span><span>$1</span></div>')
                          // 줄바꿈
                          .replace(/\n\n/g, '<div class="h-3"></div>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
