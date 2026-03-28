"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Site } from "@/lib/types";

export default function SiteSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = async () => {
    const res = await fetch("/api/sites/suggestions");
    const data = await res.json();
    setSuggestions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const res = await fetch("/api/sites/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });

    if (res.ok) {
      toast.success(action === "approve" ? "승인 완료" : "거부 완료");
      fetchSuggestions();
    } else {
      toast.error("처리 실패");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">추천 사이트</h2>
          <p className="text-gray-500 text-sm mt-1">
            Discovery Agent가 발견한 사이트 ({suggestions.length}건)
          </p>
        </div>
        <Link href="/admin/sites">
          <Button variant="outline">사이트 관리로 돌아가기</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">대기 중인 추천 사이트가 없습니다</p>
          <p className="text-sm mt-1">
            Discovery Agent 실행 시 자동으로 추천됩니다
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>기관명</TableHead>
                <TableHead>현재 URL</TableHead>
                <TableHead>추천 URL</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="w-40">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">
                    {site.site_name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {site.target_url.slice(0, 40)}...
                  </TableCell>
                  <TableCell className="text-xs text-blue-600 max-w-xs truncate">
                    <a
                      href={site.suggested_url || ""}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {site.suggested_url?.slice(0, 40)}...
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{site.category || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(site.id, "approve")}
                      >
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(site.id, "reject")}
                      >
                        거부
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
