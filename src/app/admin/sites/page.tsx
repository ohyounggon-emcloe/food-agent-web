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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Site } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "활성", variant: "default" },
  error: { label: "에러", variant: "destructive" },
  inactive: { label: "비활성", variant: "secondary" },
};

interface ApiSource {
  id: number;
  name: string;
  provider: string;
  endpoint: string;
  api_key_env: string | null;
  auth_type: string;
  category: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  error_message: string | null;
  rate_limit_per_min: number;
  created_at: string;
}

export default function SitesPage() {
  const [activeTab, setActiveTab] = useState("crawling");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">수집 사이트 관리</h2>
        <p className="text-gray-500 text-sm mt-1">
          크롤링 사이트와 API 소스를 구분하여 관리합니다
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="crawling">크롤링 사이트</TabsTrigger>
          <TabsTrigger value="api">API 소스</TabsTrigger>
        </TabsList>

        <TabsContent value="crawling">
          <CrawlingSitesTab />
        </TabsContent>

        <TabsContent value="api">
          <ApiSourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
   크롤링 사이트 탭
   ============================================================ */

function CrawlingSitesTab() {
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
    params.set("collection_method", "scraping");
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/sites?${params}`);
    const data = await res.json();
    setSites(Array.isArray(data) ? data : []);
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
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          웹 크롤링 수집 대상 사이트 ({sites.length}건)
        </p>
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
              <Button onClick={() => setEditSite(null)}>+ 크롤링 사이트 추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editSite ? "크롤링 사이트 수정" : "크롤링 사이트 추가"}
                </DialogTitle>
              </DialogHeader>
              <CrawlingSiteForm
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
          <div className="border rounded-lg overflow-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
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
                    <TableCell className="text-xs text-gray-400">{site.id}</TableCell>
                    <TableCell className="font-medium text-sm">{site.site_name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{site.board_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{site.category || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[site.status || "active"]?.variant || "outline"} className="text-xs">
                        {STATUS_BADGE[site.status || "active"]?.label || site.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-blue-600 max-w-xs truncate">
                      <a href={site.target_url} target="_blank" rel="noreferrer" title={site.target_url}>
                        {site.target_url.slice(0, 50)}...
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-7"
                          onClick={() => { setEditSite(site); setDialogOpen(true); }}>
                          수정
                        </Button>
                        {site.status === "active" ? (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-orange-600"
                            onClick={() => handleStatusChange(site.id, "inactive")}>
                            비활성
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-green-600"
                            onClick={() => handleStatusChange(site.id, "active")}>
                            활성
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-red-600"
                          onClick={() => handleDelete(site.id)}>
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

/* ============================================================
   API 소스 탭
   ============================================================ */

function ApiSourcesTab() {
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/api-sources");
    const data = await res.json();
    setSources(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleToggle = async (id: number, isActive: boolean) => {
    const res = await fetch(`/api/api-sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (res.ok) {
      toast.success(isActive ? "비활성화 완료" : "활성화 완료");
      fetchSources();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 API 소스를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/api-sources/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제 완료");
      fetchSources();
    }
  };

  const active = sources.filter((s) => s.is_active);
  const pending = sources.filter((s) => !s.is_active);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-gray-500">
          <span>전체 {sources.length}개</span>
          <span>활성 {active.length}개</span>
          <span>대기 {pending.length}개</span>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>+ API 소스 추가</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>API 소스 추가</DialogTitle>
            </DialogHeader>
            <ApiSourceForm onSave={() => { setDialogOpen(false); fetchSources(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>등록된 API 소스가 없습니다</p>
          <p className="text-xs mt-1">서버에서 python main.py api-discover 를 실행하여 식약처 API를 자동 등록할 수 있습니다</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>API명</TableHead>
                <TableHead>제공기관</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>인증</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>마지막 수집</TableHead>
                <TableHead className="w-36">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs text-gray-400">{s.id}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{s.provider}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{s.category || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.api_key_env ? (
                      <span className="text-amber-600">{s.api_key_env}</span>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={s.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {s.is_active ? "활성" : "대기"}
                    </Badge>
                    {s.error_message && (
                      <span className="text-xs text-red-500 ml-1" title={s.error_message}>!</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {s.last_synced_at
                      ? new Date(s.last_synced_at).toLocaleDateString("ko-KR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("text-xs h-7", s.is_active ? "text-orange-600" : "text-green-600")}
                        onClick={() => handleToggle(s.id, s.is_active)}
                      >
                        {s.is_active ? "비활성" : "활성화"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-red-600"
                        onClick={() => handleDelete(s.id)}>
                        삭제
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

/* ============================================================
   폼 컴포넌트
   ============================================================ */

function CrawlingSiteForm({ site, onSave }: { site: Site | null; onSave: () => void }) {
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
      body: JSON.stringify({ ...form, collection_method: "scraping" }),
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
        <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium">URL *</label>
        <Input value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} required placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">카테고리</label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v || "" })}>
            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="법규">법규</SelectItem>
              <SelectItem value="위생">위생</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">게시판명</label>
          <Input value={form.board_name} onChange={(e) => setForm({ ...form, board_name: e.target.value })} />
        </div>
      </div>
      <Button type="submit" className="w-full">{site ? "수정" : "추가"}</Button>
    </form>
  );
}

function ApiSourceForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    name: "",
    provider: "",
    endpoint: "",
    api_key_env: "",
    auth_type: "query_param",
    category: "food_safety",
    rate_limit_per_min: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/api-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("API 소스 추가 완료");
      onSave();
    } else {
      toast.error("저장 실패");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">API명 *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="식약처 - 행정처분 현황" />
      </div>
      <div>
        <label className="text-sm font-medium">제공기관 *</label>
        <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} required placeholder="식품의약품안전처" />
      </div>
      <div>
        <label className="text-sm font-medium">엔드포인트 URL *</label>
        <Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} required placeholder="http://openapi.foodsafetykorea.go.kr/api/..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">API 키 환경변수</label>
          <Input value={form.api_key_env} onChange={(e) => setForm({ ...form, api_key_env: e.target.value })} placeholder="MFDS_API_KEY" />
          <p className="text-xs text-gray-400 mt-1">서버 .env에 설정된 변수명</p>
        </div>
        <div>
          <label className="text-sm font-medium">인증 방식</label>
          <Select value={form.auth_type} onValueChange={(v) => setForm({ ...form, auth_type: v ?? "query_param" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="query_param">Query Parameter</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="none">없음</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">카테고리</label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Rate Limit (분당)</label>
          <Input type="number" value={form.rate_limit_per_min} onChange={(e) => setForm({ ...form, rate_limit_per_min: parseInt(e.target.value) || 30 })} />
        </div>
      </div>
      <Button type="submit" className="w-full">추가 (승인 대기)</Button>
    </form>
  );
}

/* ============================================================
   유틸리티
   ============================================================ */

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
        {isActive && <span className="text-xs">{sortAsc ? " ▲" : " ▼"}</span>}
      </span>
    </TableHead>
  );
}
