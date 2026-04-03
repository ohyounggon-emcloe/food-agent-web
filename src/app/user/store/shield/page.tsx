"use client";

export default function StoreShieldPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-red-600">🚨 점검 대응 모드</h2>
      <p className="text-gray-500 text-sm">점검반 방문 시 즉시 제시할 수 있는 통합 리포트입니다.</p>
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-2">🔧 개발 중</p>
        <p className="text-sm">최근 3개월 점검표 + 전 직원 보건증 + 원산지 표시 + PDF 내보내기</p>
      </div>
    </div>
  );
}
