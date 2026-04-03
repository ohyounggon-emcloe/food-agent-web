"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Lightbulb,
  Newspaper,
  FileText,
  Search,
  ShieldAlert,
  ClipboardCheck,
  Store,
  CheckSquare,
  BarChart3,
  FolderOpen,
  Heart,
  Receipt,
  ShieldCheck,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "AI 식품안전 모니터링",
    description:
      "위험등급별 현황, 수집 추이, 최신 고위험 알림을 한눈에 확인하는 통합 대시보드",
    image: "/images/landing/dashboard.png",
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "insights",
    icon: Lightbulb,
    title: "AI 식품 인사이트",
    description:
      "AI가 분석한 핵심 이슈, 업종별 체크포인트, 법규 변경사항을 실무 관점에서 정리",
    image: "/images/landing/insights.png",
    gradient: "from-violet-600 to-purple-700",
  },
  {
    id: "news",
    icon: Newspaper,
    title: "뉴스 피드",
    description:
      "식품안전 관련 최신 뉴스를 AI가 자동 수집하고 위험도별로 분류하여 제공",
    image: "/images/landing/news.png",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    id: "reports",
    icon: FileText,
    title: "식품안전 리포트",
    description:
      "일일·주간 자동 생성 보고서로 식품안전 트렌드와 주요 이슈를 한눈에 파악",
    image: "/images/landing/reports.png",
    gradient: "from-cyan-600 to-blue-700",
  },
  {
    id: "search",
    icon: Search,
    title: "AI 통합 정보검색",
    description:
      "수집된 모든 식품안전 정보를 AI 벡터 검색으로 빠르고 정확하게 탐색",
    image: "/images/landing/search.png",
    gradient: "from-teal-600 to-emerald-700",
  },
  {
    id: "crackdown",
    icon: ShieldAlert,
    title: "식품단속정보",
    description:
      "전국 식품 단속·점검·행정처분 현황을 지도와 캘린더로 실시간 모니터링",
    image: "/images/landing/crackdown.png",
    gradient: "from-amber-600 to-orange-700",
  },
  {
    id: "inspection",
    icon: ClipboardCheck,
    title: "위생자율점검지",
    description:
      "법적 기준에 맞는 위생 점검 체크리스트를 디지털로 관리하고 이력 보관",
    image: "/images/landing/inspection.png",
    gradient: "from-rose-600 to-pink-700",
  },
];

const storeMenuItems = [
  {
    icon: Store,
    title: "가게 현황",
    description: "우리 가게 위생 현황을 한눈에 확인",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: CheckSquare,
    title: "일일 점검",
    description: "매일 체크해야 할 위생 항목을 간편하게",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: BarChart3,
    title: "점검 현황",
    description: "점검 이력과 통계를 한눈에 파악",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: FolderOpen,
    title: "서류함",
    description: "영업 관련 서류를 디지털로 보관·관리",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Heart,
    title: "직원 보건증",
    description: "직원 보건증 만료일 자동 알림",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: Receipt,
    title: "식재료 증빙",
    description: "식재료 입고 내역과 증빙 자료 관리",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: ShieldCheck,
    title: "점검 대응",
    description: "갑작스런 점검에도 빠르게 대응",
    gradient: "from-slate-500 to-slate-700",
  },
];

function MenuCard({
  item,
  index,
}: {
  item: (typeof menuItems)[number];
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`flex flex-col ${
        isEven ? "lg:flex-row" : "lg:flex-row-reverse"
      } gap-8 lg:gap-12 items-center`}
    >
      {/* 이미지 영역 */}
      <div className="w-full lg:w-3/5">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 aspect-[16/10]">
          <ImageWithFallback item={item} />
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="w-full lg:w-2/5 text-center lg:text-left">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} mb-4`}
        >
          <item.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          {item.title}
        </h3>
        <p className="text-lg text-slate-600 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function ImageWithFallback({ item }: { item: (typeof menuItems)[number] }) {
  const [error, setError] = useState(false);

  return (
    <>
      {/* 플레이스홀더 (항상 바닥에 깔림) */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${item.gradient} flex flex-col items-center justify-center gap-4`}
      >
        <item.icon className="w-16 h-16 text-white/40" />
        <span className="text-white/50 text-sm font-medium">
          {item.title} 화면
        </span>
      </div>
      {/* 실제 이미지 (플레이스홀더 위에 표시) */}
      {!error && (
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover object-top relative z-10"
          sizes="(max-width: 768px) 100vw, 60vw"
          onError={() => setError(true)}
        />
      )}
    </>
  );
}

export function MenuShowcase() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            주요 서비스
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            식품업에 꼭 필요한 핵심 기능을 제공합니다
          </p>
        </div>

        {/* AI-FX 정보서비스 */}
        <h3 className="text-2xl font-bold text-slate-800 mb-12 text-center">
          AI-FX 정보서비스
        </h3>
        <div className="flex flex-col gap-20 sm:gap-28">
          {menuItems.map((item, index) => (
            <MenuCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* 우리가게 위생관리 */}
        <div className="mt-28 sm:mt-36">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
            🏠 우리가게 위생관리
          </h3>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            매장 위생을 체계적으로 관리하는 7가지 도구
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {storeMenuItems.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white border border-slate-100 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4`}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
