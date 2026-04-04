"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, ToggleLeft, ToggleRight } from "lucide-react";

interface CodeItem {
  id: number;
  group_code: string;
  code_value: string;
  code_label: string;
  sort_order: number;
  is_active: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  client_type: "업종 (고객사)",
  vendor_service_type: "서비스 유형 (공급사)",
  gender: "성별",
  job_type: "직무",
  region: "지역",
  service_category: "서비스 카테고리",
  service_status: "서비스 상태",
};

export default function CodesPage() {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("client_type");
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState({ code_value: "", code_label: "", sort_order: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editOrder, setEditOrder] = useState(0);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/codes?group=${selectedGroup}`);
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  // 전체 코드 (비활성 포함) 조회
  const fetchAllCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/codes");
      const data = await res.json();
      const filtered = (Array.isArray(data) ? data : []).filter(
        (c: CodeItem) => c.group_code === selectedGroup
      );
      setCodes(filtered);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => { fetchAllCodes(); }, [fetchAllCodes]);

  const addCode = async () => {
    if (!newCode.code_value || !newCode.code_label) return;
    await fetch("/api/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_code: selectedGroup,
        ...newCode,
        sort_order: newCode.sort_order || codes.length + 1,
      }),
    });
    setNewCode({ code_value: "", code_label: "", sort_order: 0 });
    fetchAllCodes();
  };

  const updateCode = async (id: number) => {
    await fetch(`/api/codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code_label: editLabel, sort_order: editOrder }),
    });
    setEditingId(null);
    fetchAllCodes();
  };

  const toggleActive = async (item: CodeItem) => {
    await fetch(`/api/codes/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    fetchAllCodes();
  };

  const deleteCode = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/codes/${id}`, { method: "DELETE" });
    fetchAllCodes();
  };

  const groups = Object.entries(GROUP_LABELS);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">코드 마스터 관리</h1>

      {/* 그룹 선택 탭 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {groups.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedGroup(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 코드 추가 */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3">새 코드 추가</h2>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-slate-400">코드 값</label>
            <input
              type="text"
              value={newCode.code_value}
              onChange={(e) => setNewCode({ ...newCode, code_value: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="코드 값"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-slate-400">표시명</label>
            <input
              type="text"
              value={newCode.code_label}
              onChange={(e) => setNewCode({ ...newCode, code_label: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="표시명"
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-slate-400">순서</label>
            <input
              type="number"
              value={newCode.sort_order}
              onChange={(e) => setNewCode({ ...newCode, sort_order: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={addCode}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> 추가
          </button>
        </div>
      </div>

      {/* 코드 목록 */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-bold text-slate-800">
            {GROUP_LABELS[selectedGroup]} 코드 목록
            <span className="text-sm font-normal text-slate-400 ml-2">({codes.length}개)</span>
          </h2>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">로딩 중...</div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">등록된 코드가 없습니다</div>
          ) : (
            codes.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${!item.is_active ? "opacity-50" : ""}`}>
                {editingId === item.id ? (
                  <>
                    <span className="text-sm text-slate-400 w-24 shrink-0">{item.code_value}</span>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      value={editOrder}
                      onChange={(e) => setEditOrder(Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-sm"
                    />
                    <button onClick={() => updateCode(item.id)} className="p-1.5 rounded hover:bg-emerald-100">
                      <Save className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:text-slate-600">
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-400 w-24 shrink-0">{item.code_value}</span>
                    <span className="flex-1 text-sm font-medium text-slate-800">{item.code_label}</span>
                    <span className="text-xs text-slate-400 w-10 text-center">{item.sort_order}</span>
                    <button
                      onClick={() => toggleActive(item)}
                      className="p-1"
                      title={item.is_active ? "비활성화" : "활성화"}
                    >
                      {item.is_active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                    <button
                      onClick={() => { setEditingId(item.id); setEditLabel(item.code_label); setEditOrder(item.sort_order); }}
                      className="text-xs text-slate-400 hover:text-emerald-600"
                    >
                      수정
                    </button>
                    <button onClick={() => deleteCode(item.id)} className="p-1 rounded hover:bg-red-100">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
