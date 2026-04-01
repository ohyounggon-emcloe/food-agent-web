"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/skeleton-loader";
import { ArrowLeft, ExternalLink, FileText, Paperclip } from "lucide-react";

interface ArticleDetail {
  id: number;
  title: string;
  url: string;
  site_name: string;
  board_name: string | null;
  publish_date: string;
  risk_level: string | null;
  summary: string | null;
  content: string | null;
  region: string | null;
  source_type: string | null;
  has_attachments: boolean;
  matched_keywords: string[] | null;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  Level1: "bg-red-500 text-white",
  Level2: "bg-amber-500 text-white",
  Level3: "bg-blue-100 text-blue-700",
  "해당없음": "bg-gray-200 text-gray-500",
};

const RISK_LABELS: Record<string, string> = {
  Level1: "즉시 대응",
  Level2: "주의 관찰",
  Level3: "참고",
  "해당없음": "해당없음",
};

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/news/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        } else {
          setError("게시글을 찾을 수 없습니다.");
        }
      } catch {
        setError("조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [params.id]);

  if (loading) return <DashboardSkeleton />;

  if (error || !article) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>
        <div className="text-center py-16 text-gray-400">
          <p>{error || "게시글을 찾을 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch { return d; }
  };
  const publishDate = formatDate(article.publish_date);
  const collectDate = formatDate(article.created_at);

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Button>
        <a href={article.url} target="_blank" rel="noreferrer">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            원문 바로가기
          </Button>
        </a>
      </div>

      {/* 출처 섹션 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-bold text-gray-800">출처</h3>
          </div>
          <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-sm">
            <div>
              <span className="text-xs text-gray-400">공고일</span>
              <p className="font-medium">{publishDate}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">수집일</span>
              <p className="font-medium">{collectDate}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">출처기관</span>
              <p className="font-medium">{article.site_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 본문 정보 섹션 */}
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-500 w-28">수집대응분류</td>
                <td className="py-2">
                  <Badge className={RISK_COLORS[article.risk_level || ""] || "bg-gray-100 text-gray-500"}>
                    {article.risk_level
                      ? `${article.risk_level} ${RISK_LABELS[article.risk_level] || ""}`
                      : "미분류"}
                  </Badge>
                </td>
                <td className="py-2 pr-4 font-medium text-gray-500 w-20">키워드</td>
                <td className="py-2">
                  {article.matched_keywords && article.matched_keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {article.matched_keywords.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-500">제목</td>
                <td className="py-2 font-medium" colSpan={3}>
                  {article.title}
                </td>
              </tr>
              {article.region && (
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-500">지역</td>
                  <td className="py-2" colSpan={3}>
                    <Badge variant="outline">{article.region}</Badge>
                  </td>
                </tr>
              )}
              {article.summary && (
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-500 align-top">AI 요약</td>
                  <td className="py-2 text-emerald-700" colSpan={3}>
                    {article.summary}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 본문 내용 */}
      {article.content && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              본문 내용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {article.content}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 첨부파일 */}
      {article.has_attachments && article.attachment_names && article.attachment_names.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              첨부파일 ({article.attachment_names.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {article.attachment_names.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600 py-1"
                >
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  {name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
