"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";

/* ── 상수 ── */

const RISK_COLORS: Record<string, string> = {
  Level1: "#ef4444",
  Level2: "#f59e0b",
  Level3: "#3b82f6",
  "해당없음": "#94a3b8",
  "미분류": "#cbd5e1",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-blue-500",
  partial: "bg-amber-500",
  skipped: "bg-slate-400",
};

/* ── 타입 ── */

interface MonitoringData {
  totalArticles: number;
  todayArticles: number;
  highRiskAlerts: Array<{
    id: number;
    title: string;
    url: string;
    site_name: string;
    risk_level: string;
    summary: string;
    publish_date: string;
    has_attachments: boolean;
  }>;
  riskDistribution: Array<{ risk_level: string; count: number }>;
  collectionTrend: Array<{ date: string; count: number }>;
  agentStats: Array<{
    agent_name: string;
    total_runs: number;
    success_rate: number;
    avg_duration_ms: number;
    last_run_at: string;
  }>;
  recentLogs: Array<{
    agent_name: string;
    status: string;
    started_at: string;
    duration_ms: number;
    articles_count: number;
    error_message: string;
  }>;
}

/* ── 페이지 ── */

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(() => {
    fetch("/api/monitoring")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/auth/login";
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (d && !d.error) {
          setData(d);
          setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
        }
      })
      .catch((err) => {
        console.error("모니터링 데이터 로드 실패:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3" />
        데이터 로딩 중...
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-500 p-4">데이터 로드 실패</div>;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">모니터링</h2>
          <p className="text-gray-500 text-sm mt-1">
            실시간 식품 안전 모니터링 · 위험 알림 · 에이전트 상태
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            마지막 갱신: {lastUpdated}
          </span>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              위험 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {data.highRiskAlerts.length}건
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Level1/Level2 (최근 7일)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              전체 수집
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.totalArticles.toLocaleString()}건
            </div>
            <p className="text-xs text-gray-400 mt-1">
              오늘: {data.todayArticles}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              시스템 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.agentStats.length > 0 ? (() => {
              const avgRate = data.agentStats.reduce((s, a) => s + a.success_rate, 0) / data.agentStats.length;
              return (
                <>
                  <div className={`text-3xl font-bold ${avgRate >= 90 ? "text-emerald-500" : avgRate >= 70 ? "text-amber-500" : "text-red-500"}`}>
                    {avgRate.toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    평균 성공률 ({data.agentStats.length}개 에이전트)
                  </p>
                </>
              );
            })() : (
              <div className="text-3xl font-bold text-gray-400">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 위험도 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">위험도 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  dataKey="count"
                  nameKey="risk_level"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {data.riskDistribution.map((entry) => (
                    <Cell
                      key={entry.risk_level}
                      fill={RISK_COLORS[entry.risk_level] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 수집 추이 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">수집 추이 (최근 7일)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 에이전트 성공률 */}
      {data.agentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">에이전트 성공률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.agentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="agent_name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "성공률"]}
                />
                <Bar dataKey="success_rate" radius={[4, 4, 0, 0]}>
                  {data.agentStats.map((entry) => (
                    <Cell
                      key={entry.agent_name}
                      fill={
                        entry.success_rate >= 90
                          ? "#10b981"
                          : entry.success_rate >= 70
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 최근 위험 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            최근 위험 알림
            {data.highRiskAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.highRiskAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.highRiskAlerts.length > 0 ? (
            <div className="space-y-3">
              {data.highRiskAlerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                >
                  <Badge
                    className={`shrink-0 ${
                      alert.risk_level === "Level1"
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {alert.risk_level}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-emerald-500 transition line-clamp-1"
                    >
                      {alert.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{alert.site_name}</span>
                      <span>·</span>
                      <span>{alert.publish_date}</span>
                      {alert.has_attachments && <span>📎</span>}
                    </div>
                    {alert.summary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {alert.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">
              최근 위험 알림이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 시스템 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">시스템 로그 (최근 10건)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">시각</th>
                  <th className="pb-2 pr-4">에이전트</th>
                  <th className="pb-2 pr-4">상태</th>
                  <th className="pb-2 pr-4">수집</th>
                  <th className="pb-2 pr-4">소요시간</th>
                  <th className="pb-2">에러</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogs.map((log, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-4 text-xs text-gray-400">
                      {log.started_at
                        ? new Date(log.started_at).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-2 pr-4 font-medium">{log.agent_name}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          STATUS_COLORS[log.status] || "bg-gray-400"
                        }`}
                      />
                      {log.status}
                    </td>
                    <td className="py-2 pr-4">{log.articles_count || 0}건</td>
                    <td className="py-2 pr-4 text-gray-400">
                      {log.duration_ms
                        ? `${(log.duration_ms / 1000).toFixed(1)}s`
                        : "-"}
                    </td>
                    <td className="py-2 text-xs text-red-400 max-w-48 truncate">
                      {log.error_message || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
