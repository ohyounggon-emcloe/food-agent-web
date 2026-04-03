"use client";

import { useState } from "react";
import {
  ShieldAlert,
  FileCheck,
  Users,
  ClipboardCheck,
  Thermometer,
  ArrowRight,
} from "lucide-react";

const reportItems = [
  { icon: FileCheck, label: "영업신고증", status: "유효", color: "text-emerald-500" },
  { icon: Users, label: "직원 보건증 (3명)", status: "전원 유효", color: "text-emerald-500" },
  { icon: ClipboardCheck, label: "위생교육 이수증", status: "완료", color: "text-emerald-500" },
  { icon: Thermometer, label: "냉장고 온도기록부", status: "최근 7일 정상", color: "text-emerald-500" },
  { icon: FileCheck, label: "일일 위생점검일지", status: "30일 연속 기록", color: "text-emerald-500" },
];

export function ShieldSection() {
  const [activated, setActivated] = useState(false);

  return (
    <section className="py-16 sm:py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* 좌측: 텍스트 */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs font-bold">점검 대응 모드</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-5">
              구청 위생과 점검반이
              <br />
              들이닥쳐도{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                당황하지 마세요.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-6 max-w-lg lg:mx-0 mx-auto">
              버튼 하나로 모든 증빙 서류가 완벽히 정렬됩니다.
              직원 보건증, 위생교육 이수증, 온도기록부, 점검일지까지
              즉시 제출 가능한 형태로 정리됩니다.
            </p>

            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold transition-all hover:shadow-lg hover:shadow-red-500/20"
            >
              점검 대응 모드 체험하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 우측: 스마트폰 목업 */}
          <div className="flex-1 flex justify-center w-full max-w-xs sm:max-w-sm">
            <div className="relative w-[280px] sm:w-[300px]">
              {/* 폰 프레임 */}
              <div className="bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl border border-slate-700">
                {/* 노치 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-10" />

                {/* 스크린 */}
                <div className="bg-slate-900 rounded-[2rem] overflow-hidden min-h-[480px] sm:min-h-[520px] relative">
                  {/* 상태바 */}
                  <div className="flex items-center justify-between px-5 py-2 text-[10px] text-slate-500">
                    <span>9:41</span>
                    <span>AI-FX</span>
                    <span>100%</span>
                  </div>

                  {!activated ? (
                    /* 패닉 버튼 화면 */
                    <div className="flex flex-col items-center justify-center px-6 py-12">
                      <p className="text-slate-400 text-xs mb-8 text-center">
                        점검관이 방문했나요?<br />아래 버튼을 누르세요
                      </p>
                      <button
                        onClick={() => setActivated(true)}
                        className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                      >
                        <ShieldAlert className="w-10 h-10 text-white mb-2" />
                        <span className="text-white font-bold text-sm">점검 대응</span>
                        <span className="text-red-200 text-[10px]">TAP TO ACTIVATE</span>
                      </button>
                      <p className="text-slate-600 text-[10px] mt-8 text-center">
                        모든 증빙 서류를 즉시 정리합니다
                      </p>
                    </div>
                  ) : (
                    /* 서류 정리 완료 화면 */
                    <div className="px-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-xs font-bold">서류 정리 완료</span>
                      </div>

                      <div className="space-y-2.5">
                        {reportItems.map((item, i) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-300 truncate">{item.label}</div>
                            </div>
                            <span className={`text-[10px] font-bold ${item.color} shrink-0`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setActivated(false)}
                        className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                      >
                        PDF 리포트 다운로드
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Link import */
import Link from "next/link";
