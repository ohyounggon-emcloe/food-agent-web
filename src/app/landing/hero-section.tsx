import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-slate-900/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/80" />

      {/* 콘텐츠 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-20">
        {/* 뱃지 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 text-sm font-medium">
            AI 기반 식품안전 인텔리전스
          </span>
        </div>

        {/* 메인 카피 */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          식품 안전,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            AI가 24시간
          </span>
          <br />
          감시합니다
        </h1>

        {/* 서브 카피 */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          159개 공공기관의 식품 위생·안전 정보를 실시간 수집하고,
          <br className="hidden sm:block" />
          AI가 위험도를 분석하여 즉시 알려드립니다.
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            무료로 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 hover:border-white/40 text-white font-medium text-lg transition-colors hover:bg-white/5"
          >
            서비스 둘러보기
          </Link>
        </div>

        {/* 통계 */}
        <div className="flex justify-center gap-8 sm:gap-16 mt-16">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">159+</div>
            <div className="text-sm text-slate-400 mt-1">모니터링 기관</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">24/7</div>
            <div className="text-sm text-slate-400 mt-1">실시간 감시</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">AI</div>
            <div className="text-sm text-slate-400 mt-1">자동 위험 분류</div>
          </div>
        </div>
      </div>

      {/* 하단 스크롤 유도 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}
