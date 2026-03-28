"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/pagination";
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
import type { SystemLog } from "@/lib/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  failed: "destructive",
  partial: "secondary",
  running: "outline",
  skipped: "outline",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (agentFilter !== "all") params.set("agent_name", agentFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "500");

    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [agentFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(logs.length / pageSize);
  const pagedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatTime = (ts: string | null) => {
    if (!ts) return "-";
    return ts.replace("T", " ").slice(0, 19);
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"시스템 로그"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`에이전트 실행 이력 (${logs.length}건)`}
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v || "all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="에이전트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"전체"}</SelectItem>
            <SelectItem value="scout">Scout</SelectItem>
            <SelectItem value="analyst">Analyst</SelectItem>
            <SelectItem value="reclassifier">Reclassifier</SelectItem>
            <SelectItem value="discovery">Discovery</SelectItem>
            <SelectItem value="reporting">Reporting</SelectItem>
            <SelectItem value="meta_director">Meta Director</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || "all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"전체"}</SelectItem>
            <SelectItem value="success">{"성공"}</SelectItem>
            <SelectItem value="failed">{"실패"}</SelectItem>
            <SelectItem value="partial">{"부분"}</SelectItem>
            <SelectItem value="running">{"실행중"}</SelectItem>
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
                <TableHead className="w-12">ID</TableHead>
                <TableHead>{"에이전트"}</TableHead>
                <TableHead>{"상태"}</TableHead>
                <TableHead>{"실행 시간"}</TableHead>
                <TableHead>{"소요 시간"}</TableHead>
                <TableHead>{"수집 건수"}</TableHead>
                <TableHead>{"에러 메시지"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedLogs.map((log) => (
                <TableRow key={log.id} className={cn(
                  log.status === "failed" && "bg-red-50"
                )}>
                  <TableCell className="text-xs text-gray-400">
                    {log.id}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {log.agent_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[log.status] || "outline"}
                      className="text-xs"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatTime(log.started_at || log.created_at)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDuration(log.duration_ms)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.articles_count || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-red-600 max-w-xs truncate">
                    {log.error_message || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          total={logs.length}
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
