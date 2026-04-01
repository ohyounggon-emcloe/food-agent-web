"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Keyword } from "@/lib/types";

const RISK_BADGE: Record<string, { label: string; color: string }> = {
  Level1: { label: "Level1", color: "bg-red-100 text-red-800" },
  Level2: { label: "Level2", color: "bg-orange-100 text-orange-800" },
  Level3: { label: "Level3", color: "bg-yellow-100 text-yellow-800" },
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKeyword, setEditKeyword] = useState<Keyword | null>(null);
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  const [sortKey, setSortKey] = useState<keyof Keyword>("risk_level");
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: keyof Keyword) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedKeywords.length / pageSize);
  const pagedKeywords = sortedKeywords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fetchKeywords = useCallback(async () => {
    const params = new URLSearchParams();
    if (riskFilter !== "all") params.set("risk_level", riskFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/keywords?${params}`);
    const data = await res.json();
    setKeywords(data);
    setLoading(false);
  }, [riskFilter, search]);

  useEffect(() => {
    fetchKeywords();
    fetch("/api/keywords/suggestions")
      .then((r) => r.json())
      .then((d) => setSuggestionsCount(Array.isArray(d) ? d.length : 0));
  }, [fetchKeywords]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this keyword?")) return;
    const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      fetchKeywords();
    } else {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"키워드 관리"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {`${keywords.length}건`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {suggestionsCount > 0 && (
            <Link href="/admin/keywords/suggestions">
              <Badge variant="destructive" className="cursor-pointer">
                {`추천 ${suggestionsCount}건`}
              </Badge>
            </Link>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button onClick={() => setEditKeyword(null)}>{"+ 추가"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editKeyword ? "키워드 수정" : "키워드 추가"}
                </DialogTitle>
              </DialogHeader>
              <KeywordForm
                keyword={editKeyword}
                onSave={() => {
                  setDialogOpen(false);
                  fetchKeywords();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="키워드 검색..."
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
            <SelectItem value="Level1">Level1</SelectItem>
            <SelectItem value="Level2">Level2</SelectItem>
            <SelectItem value="Level3">Level3</SelectItem>
            <SelectItem value="해당없음">{"해당없음"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">{"로딩 중..."}</p>
      ) : (
        <>
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="id" label="ID" onClick={handleSort} className="w-12" />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="keyword" label="키워드" onClick={handleSort} />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="risk_level" label="위험등급" onClick={handleSort} />
                <TableHead>{"식품전용"}</TableHead>
                <TableHead>{"대응 가이드"}</TableHead>
                <TableHead className="w-24">{"액션"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedKeywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="text-xs text-gray-400">
                    {kw.id}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {kw.keyword}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      RISK_BADGE[kw.risk_level || ""]?.color || "bg-gray-100 text-gray-600"
                    )}>
                      {kw.risk_level || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${kw.is_food_specific ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {kw.is_food_specific ? "Y" : "N"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {kw.action_guide || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setEditKeyword(kw);
                          setDialogOpen(true);
                        }}
                      >
                        {"수정"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-red-600"
                        onClick={() => handleDelete(kw.id)}
                      >
                        {"삭제"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          total={sortedKeywords.length}
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

function KeywordForm({
  keyword,
  onSave,
}: {
  keyword: Keyword | null;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    keyword: keyword?.keyword || "",
    risk_level: keyword?.risk_level || "Level3",
    action_guide: keyword?.action_guide || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = keyword ? `/api/keywords/${keyword.id}` : "/api/keywords";
    const method = keyword ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(keyword ? "수정 완료" : "추가 완료");
      onSave();
    } else {
      toast.error("저장 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">{"키워드 *"}</label>
        <Input
          value={form.keyword}
          onChange={(e) => setForm({ ...form, keyword: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">{"위험등급"}</label>
        <Select
          value={form.risk_level}
          onValueChange={(v) => setForm({ ...form, risk_level: v || "Level3" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Level1">{"Level1 (즉시 대응)"}</SelectItem>
            <SelectItem value="Level2">{"Level2 (주의 관찰)"}</SelectItem>
            <SelectItem value="Level3">{"Level3 (참고)"}</SelectItem>
            <SelectItem value="해당없음">{"해당없음"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">{"대응 가이드"}</label>
        <Input
          value={form.action_guide}
          onChange={(e) => setForm({ ...form, action_guide: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full">
        {keyword ? "수정" : "추가"}
      </Button>
    </form>
  );
}

function SortableHead({
  sortKey,
  sortAsc,
  column,
  label,
  onClick,
  className,
}: {
  sortKey: string;
  sortAsc: boolean;
  column: keyof Keyword;
  label: string;
  onClick: (key: keyof Keyword) => void;
  className?: string;
}) {
  const isActive = sortKey === column;
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-gray-50", className)}
      onClick={() => onClick(column)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-xs">{sortAsc ? " \u25B2" : " \u25BC"}</span>
        )}
      </span>
    </TableHead>
  );
}
