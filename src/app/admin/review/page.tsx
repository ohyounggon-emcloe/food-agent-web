"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
  id: number;
  title: string;
  url: string;
  site_name: string;
  publish_date: string;
  risk_level: string | null;
  summary: string | null;
  region: string | null;
  industry_tags: string[];
}

const RISK_OPTIONS = [
  { value: "Level1", label: "Level1 (긴급)", color: "bg-red-500 text-white" },
  { value: "Level2", label: "Level2 (주의)", color: "bg-amber-500 text-white" },
  { value: "Level3", label: "Level3 (참고)", color: "bg-blue-500 text-white" },
  { value: "해당없음", label: "해당없음", color: "bg-gray-300 text-gray-700" },
];

const FILTER_OPTIONS = [
  { value: "pending", label: "미분류 + 해당없음" },
  { value: "미분류", label: "미분류만" },
  { value: "해당없음", label: "해당없음만" },
  { value: "Level1", label: "Level1 (긴급)" },
  { value: "Level2", label: "Level2 (주의)" },
  { value: "Level3", label: "Level3 (참고)" },
  { value: "all", label: "전체" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ReviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/review?filter=${filter}&page=${page}&pageSize=${pageSize}`);
    if (res.ok) {
      const result = await res.json();
      setArticles(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 0);
    }
    setLoading(false);
  }, [filter, page, pageSize]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  const handleReclassify = async (id: number, risk_level: string) => {
    const res = await fetch("/api/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, risk_level }),
    });

    if (res.ok) {
      toast.success(`ID ${id}: ${risk_level}로 변경`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      toast.error("변경 실패");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;

    const res = await fetch("/api/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete" }),
    });

    if (res.ok) {
      toast.success("삭제 완료");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);
    } else {
      toast.error("삭제 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"게시글 검토"}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {"자동 분류 결과를 확인하고 위험등급을 조정합니다."}
          </p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{"L1: 즉시 대응 (식중독, 긴급회수)"}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />{"L2: 주의 관찰 (행정처분, 부적합)"}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{"L3: 참고 정보 (법규개정, 공지)"}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />{"제외: 식품안전 무관"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-300 text-sm"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 px-3 rounded-md border border-gray-300 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}건
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchArticles}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {"새로고침"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {loading ? "로딩 중..." : `총 ${total}건 (${page}/${totalPages} 페이지)`}
        </p>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="h-8 px-2"
            >
              {"처음"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* 페이지 번호 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="h-8 w-8 px-0"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="h-8 px-2"
            >
              {"끝"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id} className="py-0">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {article.risk_level || "미분류"}
                    </Badge>
                    {article.region && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {article.region}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {article.site_name} | {article.publish_date}
                    </span>
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium hover:text-teal-600 line-clamp-1 inline-flex items-center gap-1"
                  >
                    {article.title}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  {article.summary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {RISK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleReclassify(article.id, opt.value)}
                      className={`px-2 py-1 text-xs rounded ${
                        article.risk_level === opt.value
                          ? opt.color
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={opt.label}
                    >
                      {opt.value === "해당없음" ? "제외" : opt.value.replace("Level", "L")}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="px-2 py-1 text-xs rounded bg-gray-100 text-red-500 hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && articles.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-sm text-gray-400 font-normal">
                {"검토할 게시글이 없습니다."}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* 하단 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {"이전"}
            </Button>
            <span className="text-sm text-gray-500 px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-2"
            >
              {"다음"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
