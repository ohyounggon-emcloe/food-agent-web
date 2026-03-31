"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Report {
  id: number;
  industry: string;
  week_start: string;
  week_end: string;
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
  const [industryFilter, setIndustryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = industryFilter !== "all" ? `?industry=${industryFilter}` : "";
    const res = await fetch(`/api/reports${params}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [industryFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"주간 리포트"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {"업종별 맞춤 식품안전 주간 리포트"}
          </p>
        </div>
        <Select value={industryFilter} onValueChange={(v) => setIndustryFilter(v ?? "all")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="업종" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 업종</SelectItem>
            <SelectItem value="general">전체 요약</SelectItem>
            <SelectItem value="catering">급식</SelectItem>
            <SelectItem value="restaurant">외식</SelectItem>
            <SelectItem value="manufacturing">제조</SelectItem>
            <SelectItem value="distribution">유통</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{"로딩 중..."}</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{"리포트가 없습니다"}</p>
          <p className="text-xs mt-1">{"매주 월요일에 자동 생성됩니다"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={INDUSTRY_COLORS[report.industry] || "bg-gray-100 text-gray-700"}>
                        {INDUSTRY_LABELS[report.industry] || report.industry}
                      </Badge>
                      <CardTitle className="text-sm font-medium">
                        {report.week_start} ~ {report.week_end}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {report.article_count}건
                        {report.high_risk_count > 0 && (
                          <span className="text-red-500 ml-1">
                            (고위험 {report.high_risk_count})
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
                      className="prose prose-sm max-w-none mt-4"
                      dangerouslySetInnerHTML={{
                        __html: report.content
                          .replace(/^### (.*)/gm, "<h3>$1</h3>")
                          .replace(/^## (.*)/gm, "<h2>$1</h2>")
                          .replace(/^# (.*)/gm, "<h1>$1</h1>")
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/^- (.*)/gm, "<li>$1</li>")
                          .replace(/\n/g, "<br/>"),
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
