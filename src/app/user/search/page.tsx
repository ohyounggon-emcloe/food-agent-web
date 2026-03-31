"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: number;
  title: string;
  url: string;
  site_name: string;
  publish_date: string;
  risk_level: string | null;
  summary: string | null;
  region: string | null;
}

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-500 text-white",
  Level2: "bg-amber-500 text-white",
  Level3: "bg-blue-100 text-blue-700",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (p = 1) => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setPage(p);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${p}&pageSize=20&days=365`);
    if (res.ok) {
      const result = await res.json();
      setArticles(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    }
    setLoading(false);
    setSearched(true);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(1);
  };

  const highlightText = (text: string, q: string) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"AI 식품안전 검색"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {"수집된 모든 식품안전 정보를 검색합니다."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요 (2자 이상)"
            className="pl-10"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={loading || query.length < 2}>
          {loading ? "검색 중..." : "검색"}
        </Button>
      </form>

      {searched && (
        <p className="text-sm text-gray-400">
          {loading ? "검색 중..." : `"${query}" 검색 결과: ${total}건`}
        </p>
      )}

      {/* 초기 상태: 검색 전 */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-12 overflow-hidden">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              {"식품안전 정보를 검색해 보세요"}
            </p>

            {/* 추천 검색어 */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["식중독", "행정처분", "회수판매중지", "HACCP", "위생점검", "수입식품", "원산지", "잔류농약"].map((keyword) => (
                <button
                  key={keyword}
                  onClick={async () => {
                    setQuery(keyword);
                    setLoading(true);
                    setSearched(true);
                    const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&page=1&pageSize=20&days=365`);
                    if (res.ok) {
                      const result = await res.json();
                      setArticles(result.data || []);
                      setTotal(result.total || 0);
                      setTotalPages(result.totalPages || 0);
                    }
                    setLoading(false);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 rounded-full text-xs text-gray-500 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>

            {/* 카테고리 아이콘 */}
            <div className="flex justify-center gap-8 text-gray-300">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <span className="text-red-300 text-lg">!</span>
                </div>
                <span className="text-[10px]">위험알림</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-300 text-lg">&sect;</span>
                </div>
                <span className="text-[10px]">법규</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <span className="text-amber-300 text-lg">&#9888;</span>
                </div>
                <span className="text-[10px]">단속</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <span className="text-teal-300 text-lg">&#10003;</span>
                </div>
                <span className="text-[10px]">위생</span>
              </div>
            </div>

            {/* AI-FX 워터마크 (하단) */}
            <div className="mt-12 pointer-events-none select-none">
              <span className="text-[100px] font-extrabold tracking-tight opacity-[0.03] leading-none">
                AI-FX
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id} className="py-0 hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-xs ${RISK_COLORS[article.risk_level || ""] || "bg-gray-100 text-gray-500"}`}>
                  {article.risk_level || "미분류"}
                </Badge>
                {article.region && (
                  <Badge variant="secondary" className="text-xs">{article.region}</Badge>
                )}
                <span className="text-xs text-gray-400">
                  {article.site_name} | {article.publish_date}
                </span>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium hover:text-teal-600 inline-flex items-center gap-1"
              >
                {highlightText(article.title, query)}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              {article.summary && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {highlightText(article.summary, query)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && searched && articles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {"검색 결과가 없습니다."}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => doSearch(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button
            variant="outline" size="sm"
            onClick={() => doSearch(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
