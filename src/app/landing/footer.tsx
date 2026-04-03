import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-white">AI</span>
              <span className="text-emerald-400">-</span>
              <span className="text-emerald-400">FX</span>
            </span>
            <span className="text-sm text-slate-500">
              Food Intelligence Platform
            </span>
          </div>

          {/* 링크 */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/auth/login"
              className="hover:text-white transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="hover:text-white transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} AI-FX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
