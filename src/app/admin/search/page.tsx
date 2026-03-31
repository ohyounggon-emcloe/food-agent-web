"use client";

import { useCallback, useState } from "react";
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
  "해당없음": "bg-gray-200 text-gray-500",
  "미분류": "bg-gray-100 text-gray-400",
};

export default function AdminSearchPage() {
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

    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&page=${p}&pageSize=20&days=365&includeAll=true`
    );
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"AI 식품안전 검색"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {"전체 수집 데이터를 검색합니다 (해당없음/미분류 포함)."}
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

      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id} className="py-0 hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-xs ${RISK_COLORS[article.risk_level || "미분류"] || "bg-gray-100 text-gray-500"}`}>
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
                {article.title}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              {article.summary && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && searched && articles.length === 0 && (
        <div className="text-center py-12 text-gray-400">{"검색 결과가 없습니다."}</div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => doSearch(page - 1)} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => doSearch(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
