import { Building2, Bell, Brain } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "159개 기관 실시간 모니터링",
    description:
      "식약처, 지자체, 공공기관 등 159개 기관의 식품 위생·안전 정보를 자동으로 수집합니다.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Bell,
    title: "위험 즉시 알림",
    description:
      "회수·폐기, 행정처분, 식중독 발생 등 고위험 정보를 실시간으로 감지하여 즉시 알려드립니다.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Brain,
    title: "AI 자동 분류·분석",
    description:
      "Claude AI가 수집된 정보의 위험등급을 자동 판정하고, 업종별 맞춤 인사이트를 생성합니다.",
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            왜 <span className="text-emerald-600">AI-FX</span>인가요?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            식품업 종사자에게 꼭 필요한 정보를 AI가 자동으로 찾아 분석합니다
          </p>
        </div>

        {/* 기능 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative group p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300"
            >
              {/* 아이콘 */}
              <div
                className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}
              >
                <feature.icon
                  className={`w-7 h-7 bg-gradient-to-r ${feature.color} bg-clip-text`}
                  style={{ color: feature.color.includes("emerald") ? "#10b981" : feature.color.includes("amber") ? "#f59e0b" : "#3b82f6" }}
                />
              </div>

              {/* 텍스트 */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
