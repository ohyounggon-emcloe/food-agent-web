import {
  Building2,
  Bell,
  Brain,
  Newspaper,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "159개 기관 실시간 모니터링",
    description:
      "식약처, 지자체, 공공기관 등 159개 기관의 식품 위생·안전 정보를 매일 2회 자동으로 수집합니다.",
    details: ["식약처·농림부·지자체 공공사이트", "37개 공공 API 연동", "네이버 뉴스 25개 검색어 모니터링"],
    iconColor: "#10b981",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Bell,
    title: "위험 즉시 알림",
    description:
      "회수·폐기, 행정처분, 식중독 발생 등 고위험 정보를 실시간으로 감지하여 즉시 알려드립니다.",
    details: ["Level1(즉시 대응) 자동 감지", "텔레그램 실시간 알림", "단속·점검 일정 사전 안내"],
    iconColor: "#f59e0b",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Brain,
    title: "AI 자동 분류·분석",
    description:
      "Claude AI가 수집된 정보의 위험등급을 자동 판정하고, 업종별 맞춤 인사이트를 생성합니다.",
    details: ["4단계 위험등급 자동 분류", "비식품 정보 자동 필터링", "AI 교차검증으로 정확도 향상"],
    iconColor: "#3b82f6",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Newspaper,
    title: "식품안전 뉴스·리포트",
    description:
      "식품안전 관련 뉴스를 자동 수집하고, 일일·주간 보고서를 AI가 작성하여 트렌드를 알려줍니다.",
    details: ["일일 카테고리별 요약 보고서", "주간 업종별 심층 분석", "핵심 이슈 자동 선별"],
    iconColor: "#8b5cf6",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: ShieldCheck,
    title: "매장 위생관리 올인원",
    description:
      "일일 점검, 직원 보건증, 식재료 증빙, 서류 관리까지 매장 위생을 체계적으로 관리합니다.",
    details: ["디지털 위생 점검 체크리스트", "보건증 만료일 자동 알림", "점검 대응 가이드 제공"],
    iconColor: "#ec4899",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: TrendingUp,
    title: "AI 실무 인사이트",
    description:
      "수집된 데이터를 기반으로 업종별 체크포인트, 법규 변경사항, 단속 동향 등 실무 인사이트를 제공합니다.",
    details: ["업종별 맞춤 체크포인트", "법규·고시 변경 알림", "단속 트렌드 분석"],
    iconColor: "#06b6d4",
    bgColor: "bg-cyan-500/10",
  },
];

const processSteps = [
  {
    step: "01",
    title: "자동 수집",
    description: "159개 기관 + 뉴스 + 공공API에서 매일 2회 식품안전 정보를 자동 수집",
  },
  {
    step: "02",
    title: "AI 필터링",
    description: "AI 게이트키퍼가 비식품 정보를 걸러내고 식품업 관련 정보만 선별",
  },
  {
    step: "03",
    title: "위험도 분류",
    description: "Claude AI가 4단계 위험등급을 자동 판정하고 교차검증으로 정확도 확보",
  },
  {
    step: "04",
    title: "인사이트 전달",
    description: "업종별 맞춤 인사이트와 알림을 실시간으로 전달",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2 sm:mb-4">
            왜 <span className="text-emerald-600">AI-FX</span>인가요?
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto">
            식품업 종사자에게 꼭 필요한 정보를 AI가 자동으로 찾아 분석합니다
          </p>
        </div>

        {/* 기능 카드 6개 — 모바일: 2열 콤팩트 / 데스크톱: 3열 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative group p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300"
            >
              {/* 아이콘 */}
              <div
                className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2 sm:mb-4`}
              >
                <feature.icon
                  className="w-4 h-4 sm:w-6 sm:h-6"
                  style={{ color: feature.iconColor }}
                />
              </div>

              {/* 텍스트 */}
              <h3 className="text-xs sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">
                {feature.title}
              </h3>
              <p className="hidden sm:block text-sm text-slate-600 leading-relaxed mb-3">
                {feature.description}
              </p>
              {/* 모바일: 짧은 설명 */}
              <p className="sm:hidden text-[11px] text-slate-500 leading-snug">
                {feature.description.split('.')[0]}.
              </p>

              {/* 세부 항목 — 모바일 숨김 */}
              <ul className="hidden sm:block space-y-1.5 mt-3">
                {feature.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-1.5 text-xs text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* AI-FX 작동 프로세스 */}
        <div className="mt-24">
          <div className="text-center mb-14">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              AI-FX는 이렇게 작동합니다
            </h3>
            <p className="text-slate-600">
              수집부터 인사이트 전달까지, 23개 AI 에이전트가 자율적으로 운영됩니다
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((item, index) => (
              <div key={item.step} className="relative">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 h-full">
                  <div className="text-3xl font-extrabold text-emerald-500/20 mb-3">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {/* 화살표 (마지막 항목 제외) */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-emerald-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
