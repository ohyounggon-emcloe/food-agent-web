"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, CheckCircle, XCircle, Printer } from "lucide-react";

interface Store { id: number; store_name: string; store_type: string; address: string; }
interface Doc { id: number; doc_type: string; doc_name: string; file_url: string; expiry_date: string | null; }
interface Check { id: number; check_date: string; check_type: string; score: number; passed_items: number; total_items: number; status: string; checker_name: string; }

const DOC_LABELS: Record<string, string> = {
  business_license: "사업자등록증", business_permit: "영업신고증",
  hygiene_training: "위생교육수료증", health_cert: "보건증",
  water_test: "수질검사 성적서", origin_cert: "원산지 증명",
};

export default function StoreShieldPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const s = data[0] as Store;
          setStore(s);

          // 병렬 로드
          Promise.all([
            fetch(`/api/store-documents?storeId=${s.id}`).then((r) => r.json()),
            fetch(`/api/hygiene-checks?storeId=${s.id}&days=90`).then((r) => r.json()),
          ]).then(([docData, checkData]) => {
            setDocs(Array.isArray(docData) ? docData : []);
            setChecks(Array.isArray(checkData) ? checkData : []);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-16 text-gray-400">로딩 중...</div>;
  if (!store) return <div className="text-center py-16 text-gray-400">매장을 먼저 등록해주세요.</div>;

  const today = new Date();
  const healthCerts = docs.filter((d) => d.doc_type === "health_cert");
  const validCerts = healthCerts.filter((d) => !d.expiry_date || new Date(d.expiry_date) >= today);
  const otherDocs = docs.filter((d) => d.doc_type !== "health_cert");

  return (
    <>
      <style>{`
        @media print {
          nav, aside, header, .no-print, .sidebar,
          [class*="sidebar"], [class*="aside"],
          .fixed, [class*="fixed"] { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-600">점검 대응 모드</h2>
              <p className="text-gray-500 text-sm">{store.store_name} · {store.address || store.store_type}</p>
            </div>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2 no-print">
            <Printer className="w-4 h-4" />
            PDF 출력
          </Button>
        </div>

        {/* 인쇄용 제목 */}
        <div className="hidden print:block text-center mb-4">
          <h1 style={{ fontSize: "18pt", fontWeight: "bold" }}>{store.store_name} 위생관리 통합 리포트</h1>
          <p style={{ fontSize: "10pt", color: "#666" }}>출력일: {today.toLocaleDateString("ko-KR")} · AI-FX</p>
        </div>

        {/* 1. 필수 서류 현황 */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              필수 서류 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {otherDocs.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 서류가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {otherDocs.map((doc) => {
                  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < today;
                  return (
                    <div key={doc.id} className="flex items-center justify-between py-1 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {isExpired ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                        <span className="text-sm">{DOC_LABELS[doc.doc_type] || doc.doc_type}</span>
                        {doc.doc_name && <span className="text-xs text-gray-400">({doc.doc_name})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.expiry_date && (
                          <span className={`text-xs ${isExpired ? "text-red-500" : "text-gray-400"}`}>
                            만료: {doc.expiry_date}
                          </span>
                        )}
                        <Badge variant={isExpired ? "destructive" : "secondary"} className="text-[10px]">
                          {isExpired ? "만료" : "유효"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 직원 보건증 현황 */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              💳 직원 보건증 현황
              <Badge variant="secondary" className="text-[10px]">
                유효 {validCerts.length}/{healthCerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthCerts.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 보건증이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {healthCerts.map((cert) => {
                  const isExpired = cert.expiry_date && new Date(cert.expiry_date) < today;
                  const isExpiring = cert.expiry_date && !isExpired &&
                    Math.ceil((new Date(cert.expiry_date).getTime() - today.getTime()) / 86400000) <= 30;

                  return (
                    <div
                      key={cert.id}
                      className={`p-2 rounded-lg border text-center ${
                        isExpired ? "bg-red-50 border-red-200" :
                        isExpiring ? "bg-amber-50 border-amber-200" :
                        "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        isExpired ? "bg-red-500" : isExpiring ? "bg-amber-500" : "bg-green-500"
                      }`} />
                      <p className="text-xs font-medium">{cert.doc_name || "직원"}</p>
                      <p className="text-[10px] text-gray-400">
                        {cert.expiry_date || "만료일 미등록"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. 최근 점검 이력 */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              📋 최근 3개월 점검 이력
              <Badge variant="secondary" className="text-[10px]">{checks.length}건</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checks.length === 0 ? (
              <p className="text-sm text-gray-400">점검 기록이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {checks.slice(0, 20).map((check) => (
                  <div key={check.id} className="flex items-center justify-between py-1 border-b border-gray-100 text-xs">
                    <span className="text-gray-600">
                      {check.check_date} · {check.check_type === "opening" ? "출근" : "마감"}
                    </span>
                    <span className="text-gray-400">{check.checker_name || "직원"}</span>
                    <span className={`font-medium ${check.score >= 80 ? "text-green-600" : "text-amber-600"}`}>
                      {Math.round(check.score)}점 ({check.passed_items}/{check.total_items})
                    </span>
                    <Badge className={`text-[10px] ${
                      check.status === "approved" ? "bg-green-100 text-green-700" :
                      check.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {check.status === "approved" ? "승인" : check.status === "rejected" ? "반려" : "대기"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-gray-400 text-right">
          AI-FX 식품안전 지능형 관제 플랫폼 · {today.toLocaleDateString("ko-KR")} 출력
        </p>
      </div>
    </>
  );
}
