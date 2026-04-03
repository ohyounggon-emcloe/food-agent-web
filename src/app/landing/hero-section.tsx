import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldAlert, Bot, Building2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* 배경 이미지 */}
      <Image
        src="/images/login-bg.jpg"
        alt="AI Food Safety Dashboard"
        fill
        priority
        className="object-cover"
        quality={85}
      />

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-slate-900/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/30" />

      {/* 콘텐츠 — 좌측 텍스트 + 우측 대시보드 목업 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* 좌측: 텍스트 */}
          <div className="flex-1 text-center lg:text-left">
            {/* 경고 뱃지 */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/15 border border-red-500/25 mb-6">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">
                식품업 과태료 평균 500만 원
              </span>
            </div>

            {/* 메인 카피 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              과태료 500만 원의 공포,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                AI-FX가 24시간
              </span>
              <br />
              철통 방어합니다.
            </h1>

            {/* 서브 카피 */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mb-8 leading-relaxed lg:mx-0 mx-auto">
              국내 유일 23개 자율 진화형 에이전트가 159개 기관의 데이터를 실시간 분석하여,
              사장님께 딱 맞는 대응 전략을 제안합니다.
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-lg transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02]"
              >
                내 매장 리스크 무료 진단하기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-white/20 hover:border-white/40 text-white font-medium transition-colors hover:bg-white/5"
              >
                서비스 둘러보기
              </Link>
            </div>

            {/* 핵심 수치 */}
            <div className="flex justify-center lg:justify-start gap-6 sm:gap-10 mt-10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">159+</div>
                  <div className="text-xs text-slate-400">모니터링 기관</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">23개</div>
                  <div className="text-xs text-slate-400">AI 에이전트</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">24/7</div>
                  <div className="text-xs text-slate-400">실시간 방어</div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 대시보드 목업 */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl">
            <div className="relative">
              {/* 글로우 효과 */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />

              {/* 대시보드 스크린샷 */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/images/landing/dashboard.png"
                  alt="AI-FX 리스크 모니터링 대시보드"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  quality={90}
                />

                {/* 리스크 게이지 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    {/* 게이지 바 */}
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                        <span>리스크 방어 현황</span>
                        <span className="text-emerald-400 font-bold">안전</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ width: "87%" }}
                        />
                      </div>
                    </div>
                    {/* 수치 */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-emerald-400">87%</div>
                      <div className="text-[10px] text-slate-400">방어율</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 스크롤 유도 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}
