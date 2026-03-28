"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { KeywordSuggestion } from "@/lib/types";

export default function KeywordSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLevels, setEditLevels] = useState<Record<number, string>>({});

  const fetchSuggestions = async () => {
    const res = await fetch("/api/keywords/suggestions");
    const data = await res.json();
    setSuggestions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const riskLevel = editLevels[id];
    const res = await fetch(`/api/keywords/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, risk_level: riskLevel }),
    });

    if (res.ok) {
      toast.success(action === "approve" ? "승인 완료" : "거부 완료");
      fetchSuggestions();
    } else {
      toast.error("처리 실패");
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`${suggestions.length}건 전체 승인?`)) return;
    const res = await fetch("/api/keywords/suggestions/approve-all", {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.approved}건 승인 완료`);
      fetchSuggestions();
    } else {
      toast.error("일괄 승인 실패");
    }
  };

  const setLevel = (id: number, level: string) => {
    setEditLevels({ ...editLevels, [id]: level });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"추천 키워드"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {`Reclassifier Agent 제안 (${suggestions.length}건)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <Button variant="outline" onClick={handleApproveAll}>
              {"전체 승인"}
            </Button>
          )}
          <Link href="/admin/keywords">
            <Button variant="outline">{"키워드 관리로"}</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">{"로딩 중..."}</p>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">{"대기 중인 추천 키워드가 없습니다"}</p>
          <p className="text-sm mt-1">
            {"Reclassifier Agent 실행 시 자동으로 제안됩니다"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>{"키워드"}</TableHead>
                <TableHead>{"추천 등급"}</TableHead>
                <TableHead>{"등급 수정"}</TableHead>
                <TableHead>{"출처"}</TableHead>
                <TableHead className="w-40">{"액션"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs text-gray-400">
                    {s.id}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {s.keyword}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {s.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editLevels[s.id] || s.risk_level}
                      onValueChange={(v) => setLevel(s.id, v || s.risk_level)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Level1">Level1</SelectItem>
                        <SelectItem value="Level2">Level2</SelectItem>
                        <SelectItem value="Level3">Level3</SelectItem>
                        <SelectItem value="해당없음">{"해당없음"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-blue-600 max-w-xs truncate">
                    {s.source_url ? (
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="noreferrer"
                        title={s.source_url}
                      >
                        {s.source_url.slice(0, 40)}...
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "approve")}
                      >
                        {"승인"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAction(s.id, "reject")}
                      >
                        {"거부"}
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
