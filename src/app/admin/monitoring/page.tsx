"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STREAMLIT_URL = "http://localhost:8501";

export default function MonitoringPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {"모니터링 대시보드"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {"식품 안전 모니터링 · 위험 알림 · 에이전트 상태"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const iframe = document.getElementById(
                "streamlit-frame"
              ) as HTMLIFrameElement;
              if (iframe) {
                setIsLoading(true);
                iframe.src = STREAMLIT_URL;
              }
            }}
          >
            {"새로고침"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(STREAMLIT_URL, "_blank")}
          >
            {"새 창에서 열기"}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-gray-500">
                  {"대시보드 로딩 중..."}
                </p>
              </div>
            </div>
          )}
          <iframe
            id="streamlit-frame"
            src={STREAMLIT_URL}
            className="w-full border-0"
            style={{ height: "calc(100vh - 160px)", minHeight: "600px" }}
            onLoad={() => setIsLoading(false)}
            title="Food Safety Monitoring Dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
