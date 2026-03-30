"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Article {
  id: number;
  title: string;
  url: string;
  site_name: string;
  publish_date: string;
  risk_level: string;
  summary: string | null;
  has_attachments: boolean;
}

// 위험 근거 핵심 키워드
const HIGHLIGHT_KEYWORDS = [
  "식중독", "이물", "부적합", "회수", "판매중지", "행정처분", "영업정지",
  "과징금", "과태료", "위반", "단속", "적발", "시정명령", "불시점검",
  "원산지", "유통기한", "알러젠", "살모넬라", "노로바이러스", "대장균",
  "리스테리아", "곰팡이", "중금속", "잔류농약", "항생제",
];

function highlightText(text: string): React.ReactNode {
  if (!text) return text;
  const regex = new RegExp(`(${HIGHLIGHT_KEYWORDS.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    HIGHLIGHT_KEYWORDS.some((kw) => kw.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-red-100 text-red-700 px-0.5 rounded font-medium">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const RISK_STYLE: Record<string, string> = {
  Level1: "bg-red-500 text-white border-red-500",
  Level2: "bg-amber-500 text-white border-amber-500",
  Level3: "bg-blue-100 text-blue-700 border-blue-200",
  "해당없음": "bg-gray-100 text-gray-500 border-gray-200",
  "미분류": "bg-gray-50 text-gray-400 border-gray-200",
};

const RISK_ICON: Record<string, string> = {
  Level1: "🚨",
  Level2: "⚠️",
  Level3: "ℹ️",
};

const CARD_BORDER: Record<string, string> = {
  Level1: "border-l-4 border-l-red-500 bg-red-50/30",
  Level2: "border-l-4 border-l-amber-400 bg-amber-50/20",
};

export default function NewsPage() {
  return (
    <Suspense>
      <NewsFeed />
    </Suspense>
  );
}

function NewsFeed() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState(
    searchParams.get("risk_level") || "전체"
  );
  const [daysFilter, setDaysFilter] = useState("3일");

  const RISK_VALUE_MAP: Record<string, string> = {
    "전체": "all",
    "Level1 (긴급)": "Level1",
    "Level2 (주의)": "Level2",
    "Level3 (참고)": "Level3",
  };
  const DAYS_VALUE_MAP: Record<string, string> = {
    "오늘": "1",
    "3일": "3",
    "7일": "7",
    "30일": "30",
  };
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNews = useCallback(async () => {
    const params = new URLSearchParams();
    const riskValue = RISK_VALUE_MAP[riskFilter] || "all";
    const daysValue = DAYS_VALUE_MAP[daysFilter] || "3";
    if (riskValue !== "all") params.set("risk_level", riskValue);
    if (search) params.set("search", search);
    params.set("days", daysValue);
    params.set("limit", "500");

    const res = await fetch(`/api/news?${params}`);
    const data = await res.json();
    setArticles(Array.isArray(data) ? data : []);
    setLoading(false);
    setCurrentPage(1);
  }, [riskFilter, search, daysFilter]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 클라이언트 검색 필터 (제목 + 사이트명)
  const filtered = articles.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.site_name || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"뉴스 피드"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`${riskFilter} · ${daysFilter === "오늘" ? "오늘" : `최근 ${daysFilter}`} · ${filtered.length}건${search ? ` (검색: "${search}")` : ""}`}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="제목 또는 기관명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v || "전체")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="위험등급" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            <SelectItem value="Level1 (긴급)">Level1 (긴급)</SelectItem>
            <SelectItem value="Level2 (주의)">Level2 (주의)</SelectItem>
            <SelectItem value="Level3 (참고)">Level3 (참고)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={daysFilter} onValueChange={(v) => setDaysFilter(v || "3일")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="오늘">오늘</SelectItem>
            <SelectItem value="3일">3일</SelectItem>
            <SelectItem value="7일">7일</SelectItem>
            <SelectItem value="30일">30일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{"로딩 중..."}</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">{"조건에 맞는 게시글이 없습니다"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((article) => (
              <div
                key={article.id}
                className={`border rounded-xl p-4 hover:shadow-md transition-all ${
                  CARD_BORDER[article.risk_level] || "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">{RISK_ICON[article.risk_level] || ""}</span>
                  <Badge
                    className={`text-xs shrink-0 mt-0.5 ${RISK_STYLE[article.risk_level] || "bg-gray-100 text-gray-500"}`}
                  >
                    {article.risk_level || "-"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:text-emerald-600"
                    >
                      {highlightText(article.title)}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {article.site_name}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {article.publish_date}
                      </span>
                      {article.has_attachments && (
                        <span className="text-xs text-gray-400">{"📎"}</span>
                      )}
                    </div>
                    {article.summary && (
                      <details className="mt-2">
                        <summary className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-700">
                          AI 요약 보기
                        </summary>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {highlightText(article.summary || "")}
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            total={articles.length}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </>
      )}
    </div>
  );
}
