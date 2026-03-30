export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />

      {/* 정적 그리드 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 큰 정적 글로우 — 좌상 */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-3xl" />
      {/* 큰 정적 글로우 — 우하 */}
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-teal-600/12 rounded-full blur-3xl" />
      {/* 큰 정적 글로우 — 중앙 상단 */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl" />

      {/* 정적 대형 원형 링 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-emerald-500/10 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-emerald-500/5 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-emerald-500/[0.03] rounded-full" />

      {/* 정적 십자 라인 (HUD 느낌) */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />

      {/* 컨텐츠 */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* 브랜드 */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="text-white">AI</span>
            <span className="text-emerald-400">-</span>
            <span className="text-emerald-400">FX</span>
          </h1>
          <p className="text-sm text-slate-300 tracking-[0.25em] uppercase mt-3 font-medium">
            Food Intelligence Platform
          </p>
          <p className="text-slate-300 text-sm mt-2 font-light">
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
