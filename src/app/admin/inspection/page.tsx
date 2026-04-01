"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NewsListSkeleton } from "@/components/skeleton-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

interface InspectionItem {
  id: number;
  category: string;
  criteria: string;
  method: string;
  content: string;
}

const DEFAULT_CATEGORIES = [
  "일반음식점",
  "단체급식",
  "식자재납품",
  "식품공장",
  "배달_간편음식점",
  "공통",
];

const CRITERIA_OPTIONS = [
  "시설관리",
  "개인위생",
  "식품관리",
  "식품관리(업체)",
  "식품관리(공급)",
  "세척/소독관리",
  "방충/방서관리",
  "환경관리",
];

export default function AdminInspectionPage() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ category: "", criteria: "", method: "O/X", content: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category: "일반음식점", criteria: "시설관리", method: "O/X", content: "" });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("category", filter);

    try {
      const res = await fetch(`/api/inspection/admin?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCategories(data.categories || []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    if (!addForm.content.trim()) return;
    const res = await fetch("/api/inspection/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ category: "일반음식점", criteria: "시설관리", method: "O/X", content: "" });
      fetchItems();
    }
  };

  const handleEdit = (item: InspectionItem) => {
    setEditingId(item.id);
    setEditForm({ category: item.category, criteria: item.criteria, method: item.method, content: item.content });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const res = await fetch("/api/inspection/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/inspection/admin?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
  };

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];
  const filterLabel = filter === "all" ? "전체" : filter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">점검항목 관리</h2>
          <p className="text-gray-500 text-sm mt-1">
            위생 자율점검 항목을 등록/수정/삭제합니다. ({items.length}건)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-40">
              <span>{filterLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-1">
            <Plus className="w-4 h-4" />
            항목 추가
          </Button>
        </div>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">새 점검항목 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Select value={addForm.category} onValueChange={(v) => v && setAddForm({ ...addForm, category: v })}>
                <SelectTrigger><span>{addForm.category}</span></SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={addForm.criteria} onValueChange={(v) => v && setAddForm({ ...addForm, criteria: v })}>
                <SelectTrigger><span>{addForm.criteria}</span></SelectTrigger>
                <SelectContent>
                  {CRITERIA_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={addForm.method} onValueChange={(v) => v && setAddForm({ ...addForm, method: v })}>
                <SelectTrigger><span>{addForm.method}</span></SelectTrigger>
                <SelectContent>
                  <SelectItem value="O/X">O/X</SelectItem>
                  <SelectItem value="기록">기록</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={addForm.content}
              onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
              placeholder="점검내용을 입력하세요"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!addForm.content.trim()}>
                <Save className="w-3 h-3 mr-1" />
                저장
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <NewsListSkeleton />
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>점검항목이 없습니다.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left w-28">카테고리</th>
                  <th className="px-3 py-2 text-left w-28">점검기준</th>
                  <th className="px-3 py-2 text-left w-16">방법</th>
                  <th className="px-3 py-2 text-left">점검내용</th>
                  <th className="px-3 py-2 text-center w-20">관리</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    {editingId === item.id ? (
                      <>
                        <td className="px-3 py-2">
                          <Select value={editForm.category} onValueChange={(v) => v && setEditForm({ ...editForm, category: v })}>
                            <SelectTrigger className="h-8 text-xs"><span>{editForm.category}</span></SelectTrigger>
                            <SelectContent>
                              {allCategories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Select value={editForm.criteria} onValueChange={(v) => v && setEditForm({ ...editForm, criteria: v })}>
                            <SelectTrigger className="h-8 text-xs"><span>{editForm.criteria}</span></SelectTrigger>
                            <SelectContent>
                              {CRITERIA_OPTIONS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Select value={editForm.method} onValueChange={(v) => v && setEditForm({ ...editForm, method: v })}>
                            <SelectTrigger className="h-8 text-xs"><span>{editForm.method}</span></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="O/X">O/X</SelectItem>
                              <SelectItem value="기록">기록</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}>
                              <Save className="w-3 h-3 text-teal-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                              <X className="w-3 h-3 text-gray-400" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{item.criteria}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{item.method}</td>
                        <td className="px-3 py-2 text-xs">{item.content}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                              <Pencil className="w-3 h-3 text-gray-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
