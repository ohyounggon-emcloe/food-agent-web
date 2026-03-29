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
          <p className="text-xs text-slate-500 tracking-[0.2em] mt-1">
            {"식품위생법규서비스"}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
