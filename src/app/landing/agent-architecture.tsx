"use client";

import { useState } from "react";
import {
  Radar,
  Newspaper,
  Database,
  ShieldAlert,
  Compass,
  Globe,
  Key,
  Settings,
  FileSearch,
  Layers,
  CheckCircle2,
  Scale,
  RefreshCw,
  BarChart3,
  Brain,
  FileText,
  Lightbulb,
  TrendingUp,
  Activity,
  Wrench,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";

interface AgentInfo {
  name: string;
  icon: React.ElementType;
  description: string;
}

interface Stage {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  agents: AgentInfo[];
}

const stages: Stage[] = [
  {
    id: "collect",
    title: "수집",
    subtitle: "데이터 확보",
    count: 8,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
    agents: [
      { name: "Scout", icon: Radar, description: "114개 공공기관 사이트를 크롤링하여 최신 식품안전 게시글을 수집합니다" },
      { name: "News Collector", icon: Newspaper, description: "네이버 뉴스 25개 검색 쿼리로 식품안전 관련 뉴스를 수집합니다" },
      { name: "API Collector", icon: Database, description: "식약처 공공API 37개에서 회수·행정처분·식중독 데이터를 수집합니다" },
      { name: "Crackdown", icon: ShieldAlert, description: "단속·점검·행정처분 정보를 감지하고 체크리스트를 생성합니다" },
      { name: "Discovery", icon: Compass, description: "기관 도메인에서 아직 등록되지 않은 신규 게시판을 자동 발견합니다" },
      { name: "Site Recommender", icon: Globe, description: "Claude AI가 현재 모니터링에서 누락된 사이트를 추천합니다" },
      { name: "Keyword Recommender", icon: Key, description: "수집된 데이터를 분석하여 새로운 모니터링 키워드를 추천합니다" },
      { name: "Collection Strategy", icon: Settings, description: "사이트별 수집 방식을 최적화하여 효율을 높입니다" },
    ],
  },
  {
    id: "verify",
    title: "검증·분류",
    subtitle: "정확도 극대화",
    count: 5,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    agents: [
      { name: "Analyst", icon: FileSearch, description: "본문을 추출하고 OCR, 키워드 매칭, AI 요약을 수행합니다" },
      { name: "Level Classifier", icon: Layers, description: "Claude Sonnet이 4단계 위험등급(Level1~3, 해당없음)을 판정합니다" },
      { name: "Level Validator", icon: CheckCircle2, description: "분류 결과를 교차 검증하고 오분류를 자동으로 수정합니다" },
      { name: "Level Criteria", icon: Scale, description: "관리자 교정 이력을 학습하여 분류 기준을 자동으로 정교화합니다" },
      { name: "Reclassifier", icon: RefreshCw, description: "미분류 항목을 재분류하고 새 키워드를 자동 제안합니다" },
    ],
  },
  {
    id: "insight",
    title: "통찰·출력",
    subtitle: "실무 가치 전달",
    count: 10,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    agents: [
      { name: "Data Quality", icon: CheckCircle2, description: "비식품 필터, 지역·업태 추출 등 데이터 품질을 검증합니다" },
      { name: "Embeddings", icon: Brain, description: "Voyage AI 벡터 임베딩을 생성하여 RAG 검색을 지원합니다" },
      { name: "Reporting", icon: FileText, description: "일일 보고서를 생성하고 텔레그램으로 전송합니다" },
      { name: "Insight", icon: Lightbulb, description: "핵심 이슈, 업종별 체크포인트, 법규 변경 인사이트를 생성합니다" },
      { name: "Daily Report", icon: BarChart3, description: "카테고리별 일일 요약 리포트를 자동 작성합니다" },
      { name: "Weekly Report", icon: TrendingUp, description: "업종별 주간 심층 분석 리포트를 작성합니다" },
      { name: "Health Monitor", icon: Activity, description: "에이전트 성공률과 이상 징후를 실시간 감시합니다" },
      { name: "Data Integrity", icon: CheckCircle2, description: "단속·식중독·수집 데이터의 정합성을 검증합니다" },
      { name: "Improvement Planner", icon: Wrench, description: "주간 개선 보고서를 작성하고 우선순위를 제안합니다" },
      { name: "Self-Improvement", icon: Zap, description: "비식품 패턴을 학습하고 키워드를 자동 승인합니다" },
    ],
  },
];

function AgentModal({
  stage,
  onClose,
}: {
  stage: Stage;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`flex items-center justify-between p-5 border-b ${stage.borderColor}`}>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {stage.title} 에이전트 ({stage.count}개)
            </h3>
            <p className="text-sm text-slate-500">{stage.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 에이전트 목록 */}
        <div className="p-5 space-y-3">
          {stage.agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className={`w-9 h-9 rounded-lg ${stage.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                <agent.icon className={`w-4.5 h-4.5 ${stage.color}`} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{agent.name}</div>
                <div className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  {agent.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgentArchitecture() {
  const [activeStage, setActiveStage] = useState<Stage | null>(null);

  return (
    <section className="py-16 sm:py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
            23개 AI 에이전트가{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              자율적으로
            </span>{" "}
            운영됩니다
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            수집부터 검증, 인사이트 생성까지 — 사람의 개입 없이 AI가 스스로 진화합니다
          </p>
        </div>

        {/* 3단계 파이프라인 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-0 relative">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative flex flex-col items-center">
              {/* 연결 화살표 (데스크톱) */}
              {index < stages.length - 1 && (
                <div className="hidden lg:flex absolute top-1/3 -right-3 z-10">
                  <ArrowRight className="w-6 h-6 text-slate-600" />
                </div>
              )}

              {/* 스테이지 카드 */}
              <button
                onClick={() => setActiveStage(stage)}
                className={`w-full p-6 sm:p-8 rounded-2xl border ${stage.borderColor} ${stage.bgColor} hover:scale-[1.02] transition-all duration-300 cursor-pointer text-left group`}
              >
                {/* 상단: 단계 + 개수 */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                    STEP {index + 1}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${stage.bgColor} ${stage.color}`}>
                    {stage.count}개
                  </span>
                </div>

                {/* 제목 */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {stage.title}
                </h3>
                <p className="text-sm text-slate-400 mb-5">{stage.subtitle}</p>

                {/* 에이전트 아이콘 그리드 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {stage.agents.map((agent) => (
                    <div
                      key={agent.name}
                      className={`w-9 h-9 rounded-lg ${stage.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      title={agent.name}
                    >
                      <agent.icon className={`w-4 h-4 ${stage.color}`} />
                    </div>
                  ))}
                </div>

                {/* 클릭 안내 */}
                <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                  클릭하여 상세 보기 →
                </p>

                {/* Validator 강조 (검증 단계만) */}
                {stage.id === "verify" && (
                  <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">Validator 교차검증</span>
                    </div>
                    {/* 정확도 게이지 애니메이션 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1차 분류</span>
                        <span>92%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500/60 animate-[grow_2s_ease-out_forwards]" style={{ width: "92%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>교차검증 후</span>
                        <span className="text-emerald-400 font-bold">99.2%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 animate-[grow_2.5s_ease-out_0.5s_forwards]" style={{ width: "99.2%" }} />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* 하단 요약 */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            모든 에이전트는 매일 08:00 / 16:00에 자동 실행되며, 피드백을 학습하여 스스로 진화합니다
          </p>
        </div>
      </div>

      {/* 모달 */}
      {activeStage && (
        <AgentModal stage={activeStage} onClose={() => setActiveStage(null)} />
      )}

      {/* 게이지 애니메이션 키프레임 */}
      <style jsx>{`
        @keyframes grow {
          from { width: 0%; }
        }
      `}</style>
    </section>
  );
}
