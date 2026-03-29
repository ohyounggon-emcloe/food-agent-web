export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-teal-400">
            AI-FX
          </h1>
          <p className="text-xs text-slate-400 tracking-[0.15em] mt-1">
            {"차세대 식품AI 서비스"}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {"위생법규 정보서비스"}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
