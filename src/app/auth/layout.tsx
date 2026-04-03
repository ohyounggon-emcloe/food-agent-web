import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 */}
      <Image
        src="/images/login-bg.jpg"
        alt="AI Data Dashboard"
        fill
        priority
        className="object-cover"
        quality={85}
      />

      {/* 다크 오버레이 (이미지가 보이도록 50%) */}
      <div className="absolute inset-0 bg-slate-900/50" />

      {/* 에메랄드 그라데이션 오버레이 (가볍게) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-transparent to-emerald-950/20" />

      {/* 컨텐츠 */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* 브랜드 */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-5xl font-extrabold tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
              <span className="text-white">AI</span>
              <span className="text-emerald-400">-</span>
              <span className="text-emerald-400">FX</span>
            </h1>
          </Link>
          <p className="text-sm text-slate-200 tracking-[0.25em] uppercase mt-3 font-medium">
            Food Intelligence Platform
          </p>
          <p className="text-slate-300 text-sm mt-2">
            식품 안전, AI가 24시간 감시합니다
          </p>
        </div>

        {/* 로그인 폼 */}
        {children}

        {/* 하단 기능 요약 */}
        <div className="flex justify-center gap-8 mt-10 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>159개 기관 모니터링</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>실시간 위험 알림</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AI 자동 분류</span>
          </div>
        </div>
      </div>
    </div>
  );
}
