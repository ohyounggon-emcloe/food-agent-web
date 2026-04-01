"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Settings {
  [key: string]: string | number | boolean;
}

const AGENTS = [
  { id: "orchestrate", label: "전체 실행", desc: "전체 파이프라인 자동 실행" },
  { id: "scout", label: "Scout", desc: "공공사이트 게시글 수집" },
  { id: "news_collector", label: "뉴스 수집", desc: "네이버 뉴스 검색 수집" },
  { id: "analyst", label: "Analyst", desc: "키워드 매칭 + AI 요약" },
  { id: "level_classifier", label: "LLM 분류", desc: "LLM 기반 위험등급 분류" },
  { id: "level_validator", label: "분류 검증", desc: "분류 결과 교차 검증" },
  { id: "level_criteria", label: "레벨 기준", desc: "위험등급 기준 정교화" },
  { id: "reclassifier", label: "재분류기", desc: "미분류 게시글 재분류" },
  { id: "data_quality", label: "데이터 정제", desc: "데이터 품질 검증" },
  { id: "site_recommender", label: "사이트 추천", desc: "신규 수집 사이트 추천" },
  { id: "keyword_recommender", label: "키워드 추천", desc: "신규 키워드 추천" },
  { id: "collection_strategy", label: "수집 전략", desc: "사이트별 수집 방식 최적화" },
  { id: "discovery", label: "게시판 탐색", desc: "신규 게시판 자동 발견" },
  { id: "health_monitor", label: "상태 점검", desc: "에이전트 시스템 모니터링" },
  { id: "improvement_planner", label: "개선 계획", desc: "주간 개선 방안 수립" },
  { id: "self_improvement", label: "자동 개선", desc: "안전 범위 내 자동 개선" },
  { id: "embeddings", label: "임베딩", desc: "검색용 벡터 임베딩 생성" },
  { id: "reporting", label: "보고서", desc: "일일 보고서 생성" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [testingSend, setTestingSend] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error("Save failed");
  };

  const updateField = (key: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleRunAgent = async (agent: string) => {
    setRunningAgent(agent);
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${agent} 실행 요청 완료 (대기 중)`);
      } else {
        toast.error(data.error || "요청 실패");
      }
    } catch {
      toast.error("요청 중 오류");
    }
    setRunningAgent(null);
  };

  const handleTelegramTest = async () => {
    setTestingSend(true);
    // 먼저 설정 저장
    if (settings) {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    }

    const res = await fetch("/api/settings/telegram-test", { method: "POST" });
    const data = await res.json();
    setTestingSend(false);

    if (res.ok) {
      toast.success("테스트 메시지 전송 완료");
    } else {
      toast.error(data.error || "전송 실패");
    }
  };

  if (loading || !settings) {
    return <p className="text-gray-500">{"로딩 중..."}</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"설정"}</h2>
          <p className="text-gray-500 text-sm mt-1">{"스케줄, 알림, 에이전트 설정 관리"}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* 스케줄 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"스케줄 관리"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"오전 수집"}</label>
              <Input value={String(settings.schedule_morning || "08:00")} onChange={(e) => updateField("schedule_morning", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{"오후 수집"}</label>
              <Input value={String(settings.schedule_afternoon || "16:00")} onChange={(e) => updateField("schedule_afternoon", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"Discovery 스케줄"}</label>
              <Input value={String(settings.schedule_discovery || "MON 06:00")} onChange={(e) => updateField("schedule_discovery", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{"Reclassifier 요일"}</label>
              <Select value={String(settings.schedule_reclassifier || "MON")} onValueChange={(v) => updateField("schedule_reclassifier", v || "MON")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MON">{"월요일"}</SelectItem>
                  <SelectItem value="TUE">{"화요일"}</SelectItem>
                  <SelectItem value="WED">{"수요일"}</SelectItem>
                  <SelectItem value="THU">{"목요일"}</SelectItem>
                  <SelectItem value="FRI">{"금요일"}</SelectItem>
                  <SelectItem value="DAILY">{"매일"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 텔레그램 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"텔레그램 알림"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{"알림 활성화"}</p>
              <p className="text-xs text-gray-500">{"보고서 생성 시 텔레그램 전송"}</p>
            </div>
            <Select value={String(settings.telegram_enabled || "true")} onValueChange={(v) => updateField("telegram_enabled", v || "true")}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">ON</SelectItem>
                <SelectItem value="false">OFF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">{"Bot Token"}</label>
            <Input
              type="password"
              value={String(settings.telegram_bot_token || "")}
              onChange={(e) => updateField("telegram_bot_token", e.target.value)}
              placeholder="8728696032:AAH..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">{"Chat ID"}</label>
            <Input
              value={String(settings.telegram_chat_id || "")}
              onChange={(e) => updateField("telegram_chat_id", e.target.value)}
              placeholder="6128271935"
            />
          </div>
          <Button variant="outline" onClick={handleTelegramTest} disabled={testingSend} className="w-full">
            {testingSend ? "전송 중..." : "테스트 메시지 전송"}
          </Button>
        </CardContent>
      </Card>

      {/* 에이전트 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"에이전트 설정"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"Reclassifier Confidence"}</label>
              <Input type="number" step="0.1" min="0" max="1" value={String(settings.reclassifier_confidence || "0.7")} onChange={(e) => updateField("reclassifier_confidence", e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{"0.7 = 70% 이상 확신 시 재분류"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">{"Scout 동시 수집"}</label>
              <Input type="number" min="1" max="20" value={String(settings.scout_concurrency || "5")} onChange={(e) => updateField("scout_concurrency", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{"Reclassifier 배치"}</label>
            <Input type="number" min="5" max="50" value={String(settings.reclassifier_batch_size || "20")} onChange={(e) => updateField("reclassifier_batch_size", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 수동 실행 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"수동 실행"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">{"에이전트 실행을 요청합니다. 로컬 PC가 실행 중일 때 처리됩니다."}</p>
          <div className="grid grid-cols-2 gap-2">
            {AGENTS.map((agent) => (
              <Button
                key={agent.id}
                variant="outline"
                size="sm"
                disabled={runningAgent === agent.id}
                onClick={() => handleRunAgent(agent.id)}
                className="justify-start h-auto py-2"
              >
                <div className="text-left">
                  <div className="font-medium">{agent.label}</div>
                  <div className="text-xs text-gray-400">{agent.desc}</div>
                </div>
                {runningAgent === agent.id && (
                  <Badge variant="secondary" className="ml-auto text-xs">{"요청 중..."}</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
