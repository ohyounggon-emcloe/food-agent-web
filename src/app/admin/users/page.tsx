"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/pagination";
import { RoleBadge } from "@/components/role-badge";
import { useAuth } from "@/providers/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const { role: myRole } = useAuth();

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === "super_admin" && myRole !== "super_admin") {
      toast.error("SA 권한은 슈퍼관리자만 부여 가능");
      return;
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      toast.success("역할 변경 완료");
      fetchUsers();
    } else {
      toast.error("변경 실패");
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.nickname || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (ts: string) => ts?.slice(0, 10) || "-";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{"사용자 관리"}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {`${users.length}명`}
        </p>
      </div>

      <Input
        placeholder="이메일 또는 닉네임 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {loading ? (
        <p className="text-gray-500">{"로딩 중..."}</p>
      ) : (
        <>
          <div
            className="border rounded-lg overflow-auto"
            style={{ maxHeight: "calc(100vh - 220px)" }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>{"이메일"}</TableHead>
                  <TableHead>{"닉네임"}</TableHead>
                  <TableHead>{"역할"}</TableHead>
                  <TableHead>{"역할 변경"}</TableHead>
                  <TableHead>{"가입일"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {u.nickname || "-"}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          handleRoleChange(u.id, v || u.role)
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">{"일반"}</SelectItem>
                          <SelectItem value="premium">{"PRO"}</SelectItem>
                          <SelectItem value="admin">{"관리자"}</SelectItem>
                          {myRole === "super_admin" && (
                            <SelectItem value="super_admin">SA</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {formatDate(u.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            total={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
