export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 로고 + 회사정보 한 줄 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
          <span className="text-xl font-extrabold tracking-tight shrink-0">
            <span className="text-white">AI</span>
            <span className="text-emerald-400">-</span>
            <span className="text-emerald-400">FX</span>
          </span>
          <span className="hidden sm:block w-px h-5 bg-slate-700" />
          <div className="text-center sm:text-left text-slate-500 space-y-0.5">
            <p className="text-slate-400 font-medium">(주)엠에스링크앤솔루션</p>
            <p>서울시 성동구 아차산로17길 49 생각공장데시앙플렉스 1215호</p>
            <p>대표자명 : 박주호 &middot; TEL 02-6216-2130</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} AI-FX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
