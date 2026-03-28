export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Food Safety Agent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {"식품 안전 지능형 에이전트 시스템"}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
