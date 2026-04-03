"use client";

import { useState } from "react";
import { Calculator, Building2, Users, TrendingDown, ShieldCheck } from "lucide-react";

const dataSources = [
  "식품의약품안전처", "농림축산식품부", "해양수산부", "환경부",
  "질병관리청", "국립농산물품질관리원", "축산물위생관리원",
  "한국식품안전관리인증원", "식품안전정보원", "소비자원",
  "서울시 식품안전", "경기도 보건환경연구원", "부산시 식품위생과",
  "대구시 보건환경연구원", "인천시 식품안전과", "광주시 보건환경연구원",
  "대전시 식품의약과", "울산시 보건위생과", "세종시 식약안전과",
  "제주도 보건위생과", "네이버 뉴스", "식품산업통계",
  "HACCP 인증현황", "수입식품 정보마루",
];

export function TrustSection() {
  const [stores, setStores] = useState(1);
  const [employees, setEmployees] = useState(5);

  // ROI 계산 로직
  const avgFinePerStore = 300; // 평균 과태료 (만원)
  const fineProb = 0.15; // 연간 적발 확률 15%
  const revenueLossMultiplier = 2; // 과태료 외 매출 손실 배수
  const preventionRate = 0.87; // AI-FX 예방율

  const annualRisk = stores * avgFinePerStore * fineProb;
  const totalLoss = annualRisk * (1 + revenueLossMultiplier);
  const savingAmount = Math.round(totalLoss * preventionRate);

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 데이터 소스 클라우드 */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            <span className="text-emerald-600">159개 기관</span>의 데이터를 연동합니다
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-8">
            정부·지자체·공공기관의 공식 데이터를 실시간으로 수집합니다
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
            {dataSources.map((source) => (
              <span
                key={source}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[11px] sm:text-xs font-medium border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
              >
                {source}
              </span>
            ))}
            <span className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-400 text-[11px] sm:text-xs font-medium border border-dashed border-slate-300">
              +135개 기관
            </span>
          </div>
        </div>

        {/* ROI 계산기 */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 text-xs font-bold">ROI 계산기</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              AI-FX가 예방할 수 있는 손실액
            </h3>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-8">
            {/* 입력 */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  매장 수
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={stores}
                  onChange={(e) => setStores(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="text-center text-2xl font-bold text-slate-900 mt-1">
                  {stores}개
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  총 직원 수
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="text-center text-2xl font-bold text-slate-900 mt-1">
                  {employees}명
                </div>
              </div>
            </div>

            {/* 결과 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                <div className="text-xs text-red-400 font-medium mb-1">연간 잠재 손실액</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {Math.round(totalLoss).toLocaleString()}만 원
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <div className="text-xs text-emerald-500 font-medium mb-1">AI-FX 예방 금액</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {savingAmount.toLocaleString()}만 원
                </div>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-slate-400 text-center mt-4">
              * 식품업 평균 과태료 및 적발 확률 기반 추정치이며, 실제 결과는 다를 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
