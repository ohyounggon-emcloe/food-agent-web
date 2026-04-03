"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const insightCards = [
  {
    riskLevel: "Level 1",
    riskColor: "bg-red-500",
    riskTextColor: "text-red-400",
    riskBg: "bg-red-500/10",
    title: "수도권 계란 단속 예보",
    flow: [
      "수도권 계란 유통 집중 단속 감지",
      "자율점검 가이드 자동 제공",
      "과태료 100만 원 사전 예방",
    ],
    estimatedLoss: "100만 원",
    recommendation:
      "계란 유통기한·보관온도 점검, 거래명세서 정비, HACCP 기록부 확인을 권장합니다.",
  },
  {
    riskLevel: "Level 2",
    riskColor: "bg-amber-500",
    riskTextColor: "text-amber-400",
    riskBg: "bg-amber-500/10",
    title: "배추 가격 급등 → 위생 리스크",
    flow: [
      "배추 원가 38% 급등 감지",
      "가공 업체 원료 대체 리스크 경고",
      "원료 수불부 정밀 점검 제안",
    ],
    estimatedLoss: "300만 원",
    recommendation:
      "원료 수불부·거래명세서 교차 검증, 대체 원료 사용 시 표시사항 변경 여부를 확인하세요.",
  },
  {
    riskLevel: "Level 1",
    riskColor: "bg-red-500",
    riskTextColor: "text-red-400",
    riskBg: "bg-red-500/10",
    title: "식중독 발생 지역 집중 단속",
    flow: [
      "인접 지역 식중독 3건 발생 감지",
      "관할 보건소 합동 점검 예측",
      "위생 서류 사전 정비 안내",
    ],
    estimatedLoss: "500만 원",
    recommendation:
      "냉장고 온도 기록, 조리원 건강진단서, 위생교육 이수증을 즉시 점검하세요.",
  },
];

export function InsightSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % insightCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const card = insightCards[current];

  const prev = () => setCurrent((c) => (c - 1 + insightCards.length) % insightCards.length);
  const next = () => setCurrent((c) => (c + 1) % insightCards.length);

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
            AI가 제안하는{" "}
            <span className="text-emerald-600">전략 인사이트</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            실제 서비스에서 제공되는 리스크 분석과 대응 전략을 미리 체험해보세요
          </p>
        </div>

        {/* 슬라이더 */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* 카드 */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-lg">
            {/* 상단: 위험등급 + 제목 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${card.riskBg} ${card.riskTextColor}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {card.riskLevel}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">{card.title}</h3>
            </div>

            {/* 3단계 흐름 */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 mb-6">
              {card.flow.map((step, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex-1 p-3 sm:p-4 rounded-xl bg-white border border-slate-200 text-center">
                    <div className="text-xs text-slate-400 mb-1">STEP {i + 1}</div>
                    <div className="text-sm font-medium text-slate-800">{step}</div>
                  </div>
                  {i < card.flow.length - 1 && (
                    <div className="hidden sm:block px-2 text-slate-300">→</div>
                  )}
                </div>
              ))}
            </div>

            {/* 하단: 예상 손실 + AI 권고 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 sm:w-48 shrink-0">
                <TrendingDown className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <div className="text-xs text-red-400 font-medium">예상 손실액</div>
                  <div className="text-lg font-bold text-red-600">{card.estimatedLoss}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-emerald-500 font-medium mb-1">AI 조치 권고</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{card.recommendation}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex gap-2">
              {insightCards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === current ? "bg-emerald-500 w-6" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <button onClick={next} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
