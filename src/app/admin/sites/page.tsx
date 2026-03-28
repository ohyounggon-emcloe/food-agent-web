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
import type { Site } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "활성", variant: "default" },
  error: { label: "에러", variant: "destructive" },
  inactive: { label: "비활성", variant: "secondary" },
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  const [sortKey, setSortKey] = useState<keyof Site>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: keyof Site) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedSites = [...sites].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedSites.length / pageSize);
  const pagedSites = sortedSites.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fetchSites = useCallback(async () => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/sites?${params}`);
    const data = await res.json();
    setSites(data);
    setLoading(false);
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    fetchSites();
    fetch("/api/sites/suggestions")
      .then((r) => r.json())
      .then((d) => setSuggestionsCount(Array.isArray(d) ? d.length : 0));
  }, [fetchSites]);

  const handleDelete = async (id: number) => {
    if (!confirm("이 사이트를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("사이트 삭제 완료");
      fetchSites();
    } else {
      toast.error("삭제 실패");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`상태 변경: ${status}`);
      fetchSites();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">사이트 관리</h2>
          <p className="text-gray-500 text-sm mt-1">
            수집 대상 사이트 관리 ({sites.length}건)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {suggestionsCount > 0 && (
            <Link href="/admin/sites/suggestions">
              <Badge variant="destructive" className="cursor-pointer">
                추천 사이트 {suggestionsCount}건
              </Badge>
            </Link>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button onClick={() => setEditSite(null)}>+ 사이트 추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editSite ? "사이트 수정" : "사이트 추가"}
                </DialogTitle>
              </DialogHeader>
              <SiteForm
                site={editSite}
                onSave={() => {
                  setDialogOpen(false);
                  fetchSites();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="사이트명 또는 URL 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="법규">법규</SelectItem>
            <SelectItem value="위생">위생</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="error">에러</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="id" label="ID" onClick={handleSort} className="w-12" />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="site_name" label="기관명" onClick={handleSort} />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="board_name" label="게시판" onClick={handleSort} />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="category" label="카테고리" onClick={handleSort} />
                <SortableHead sortKey={sortKey} sortAsc={sortAsc} column="status" label="상태" onClick={handleSort} />
                <TableHead>URL</TableHead>
                <TableHead className="w-32">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="text-xs text-gray-400">
                    {site.id}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {site.site_name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {site.board_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {site.category || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        STATUS_BADGE[site.status || "active"]?.variant ||
                        "outline"
                      }
                      className="text-xs"
                    >
                      {STATUS_BADGE[site.status || "active"]?.label ||
                        site.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-blue-600 max-w-xs truncate">
                    <a
                      href={site.target_url}
                      target="_blank"
                      rel="noreferrer"
                      title={site.target_url}
                    >
                      {site.target_url.slice(0, 50)}...
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setEditSite(site);
                          setDialogOpen(true);
                        }}
                      >
                        수정
                      </Button>
                      {site.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-orange-600"
                          onClick={() =>
                            handleStatusChange(site.id, "inactive")
                          }
                        >
                          비활성
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-green-600"
                          onClick={() =>
                            handleStatusChange(site.id, "active")
                          }
                        >
                          활성
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-red-600"
                        onClick={() => handleDelete(site.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination
          total={sortedSites.length}
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

function SiteForm({
  site,
  onSave,
}: {
  site: Site | null;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    site_name: site?.site_name || "",
    target_url: site?.target_url || "",
    category: site?.category || "",
    board_name: site?.board_name || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = site ? `/api/sites/${site.id}` : "/api/sites";
    const method = site ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(site ? "사이트 수정 완료" : "사이트 추가 완료");
      onSave();
    } else {
      toast.error("저장 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">기관명 *</label>
        <Input
          value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">URL *</label>
        <Input
          value={form.target_url}
          onChange={(e) => setForm({ ...form, target_url: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">카테고리</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v || "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="법규">법규</SelectItem>
              <SelectItem value="위생">위생</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">게시판명</label>
          <Input
            value={form.board_name}
            onChange={(e) => setForm({ ...form, board_name: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        {site ? "수정" : "추가"}
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
  column: keyof Site;
  label: string;
  onClick: (key: keyof Site) => void;
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
          <span className="text-xs">{sortAsc ? " ▲" : " ▼"}</span>
        )}
      </span>
    </TableHead>
  );
}
