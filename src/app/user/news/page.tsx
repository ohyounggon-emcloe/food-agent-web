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

const RISK_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Level1: "destructive",
  Level2: "secondary",
  Level3: "outline",
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
    searchParams.get("risk_level") || "all"
  );
  const [daysFilter, setDaysFilter] = useState("3");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNews = useCallback(async () => {
    const params = new URLSearchParams();
    if (riskFilter !== "all") params.set("risk_level", riskFilter);
    if (search) params.set("search", search);
    params.set("days", daysFilter);
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

  const totalPages = Math.ceil(articles.length / pageSize);
  const paged = articles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"뉴스 피드"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`${riskFilter === "all" ? "전체" : riskFilter} · 최근 ${daysFilter}일 · ${articles.length}건`}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="제목 또는 기관명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v || "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="위험등급" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"전체"}</SelectItem>
            <SelectItem value="Level1">{"Level1 (긴급)"}</SelectItem>
            <SelectItem value="Level2">{"Level2 (주의)"}</SelectItem>
            <SelectItem value="Level3">{"Level3 (참고)"}</SelectItem>
            <SelectItem value="해당없음">{"해당없음"}</SelectItem>
            <SelectItem value="미분류">{"미분류"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={daysFilter} onValueChange={(v) => setDaysFilter(v || "7")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{"오늘"}</SelectItem>
            <SelectItem value="3">{"3일"}</SelectItem>
            <SelectItem value="7">{"7일"}</SelectItem>
            <SelectItem value="30">{"30일"}</SelectItem>
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
                className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Badge
                    variant={RISK_VARIANT[article.risk_level] || "outline"}
                    className="text-xs shrink-0 mt-0.5"
                  >
                    {article.risk_level || "-"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:text-teal-600"
                    >
                      {article.title}
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
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {article.summary}
                      </p>
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
