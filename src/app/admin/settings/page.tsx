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
import { toast } from "sonner";

interface Settings {
  schedule_morning: string;
  schedule_afternoon: string;
  schedule_discovery: string;
  schedule_reclassifier: string;
  telegram_enabled: boolean | string;
  reclassifier_confidence: number | string;
  scout_concurrency: number | string;
  reclassifier_batch_size: number | string;
  [key: string]: string | number | boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
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
    if (res.ok) {
      toast.success("Settings saved");
    } else {
      toast.error("Save failed");
    }
  };

  const updateField = (key: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading || !settings) {
    return <p className="text-gray-500">{"로딩 중..."}</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{"설정"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {"스케줄, 알림, 에이전트 설정 관리"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"스케줄 관리"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"오전 수집 시간"}</label>
              <Input
                value={String(settings.schedule_morning)}
                onChange={(e) => updateField("schedule_morning", e.target.value)}
                placeholder="08:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{"오후 수집 시간"}</label>
              <Input
                value={String(settings.schedule_afternoon)}
                onChange={(e) => updateField("schedule_afternoon", e.target.value)}
                placeholder="16:00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"Discovery 스케줄"}</label>
              <Input
                value={String(settings.schedule_discovery)}
                onChange={(e) => updateField("schedule_discovery", e.target.value)}
                placeholder="MON 06:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{"Reclassifier 요일"}</label>
              <Select
                value={String(settings.schedule_reclassifier)}
                onValueChange={(v) => updateField("schedule_reclassifier", v || "MON")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"알림 설정"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{"텔레그램 알림"}</p>
              <p className="text-xs text-gray-500">
                {"보고서 생성 시 텔레그램으로 전송"}
              </p>
            </div>
            <Select
              value={String(settings.telegram_enabled)}
              onValueChange={(v) => updateField("telegram_enabled", v || "true")}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">ON</SelectItem>
                <SelectItem value="false">OFF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"에이전트 설정"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{"Reclassifier Confidence"}</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={String(settings.reclassifier_confidence)}
                onChange={(e) => updateField("reclassifier_confidence", e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                {"0.7 = 70% 이상 확신 시 재분류"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{"Scout 동시 수집 수"}</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={String(settings.scout_concurrency)}
                onChange={(e) => updateField("scout_concurrency", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{"Reclassifier 배치 크기"}</label>
            <Input
              type="number"
              min="5"
              max="50"
              value={String(settings.reclassifier_batch_size)}
              onChange={(e) => updateField("reclassifier_batch_size", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              {"1회 실행 시 재분류할 게시글 수"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"수동 실행"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">
            {"에이전트를 즉시 실행합니다. 현재는 로컬 PC에서만 동작합니다."}
          </p>
          <div className="flex flex-wrap gap-2">
            {["scout", "analyst", "reclassifier", "discovery", "reporting", "orchestrate"].map(
              (agent) => (
                <Button
                  key={agent}
                  variant="outline"
                  size="sm"
                  disabled
                  title="로컬 PC에서 python main.py 로 실행"
                >
                  {agent}
                </Button>
              )
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {"* 프로덕션 배포 후 API 연동 시 활성화 예정"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
