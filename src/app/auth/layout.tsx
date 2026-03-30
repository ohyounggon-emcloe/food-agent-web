export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />

      {/* 애니메이션 그리드 */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 글로우 원 — 좌상 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      {/* 글로우 원 — 우하 */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      {/* 글로우 원 — 중앙 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

      {/* 플로팅 데이터 포인트 (CSS 애니메이션) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float 8s ease-in-out infinite 1s; }
        .float-3 { animation: float 7s ease-in-out infinite 2s; }
        .float-4 { animation: float 9s ease-in-out infinite 0.5s; }
        .float-5 { animation: float 5s ease-in-out infinite 1.5s; }
        .pulse-ring { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>

      {/* 플로팅 아이콘들 */}
      <div className="absolute top-[15%] left-[10%] text-2xl float-1">🛡️</div>
      <div className="absolute top-[25%] right-[12%] text-2xl float-2">📊</div>
      <div className="absolute bottom-[20%] left-[15%] text-2xl float-3">🔬</div>
      <div className="absolute top-[60%] right-[8%] text-xl float-4">⚠️</div>
      <div className="absolute bottom-[35%] left-[8%] text-xl float-5">📋</div>

      {/* 중앙 링 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-emerald-500/10 rounded-full pulse-ring" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-teal-500/5 rounded-full pulse-ring" style={{ animationDelay: "2s" }} />

      {/* 컨텐츠 */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* 브랜드 */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="text-white">AI</span>
            <span className="text-emerald-400">-</span>
            <span className="text-emerald-400">FX</span>
          </h1>
          <p className="text-sm text-slate-400 tracking-[0.25em] uppercase mt-3 font-medium">
            Food Intelligence Platform
          </p>
          <p className="text-slate-500 text-xs mt-2">
            식품 안전, AI가 24시간 감시합니다
          </p>
        </div>

        {/* 로그인 폼 */}
        {children}

        {/* 하단 기능 요약 */}
        <div className="flex justify-center gap-8 mt-10 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>159개 기관 모니터링</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>실시간 위험 알림</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AI 자동 분류</span>
          </div>
        </div>
      </div>
    </div>
  );
}
