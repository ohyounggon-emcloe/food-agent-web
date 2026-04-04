"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";

interface Agency {
  id: number;
  agency_name: string;
  representative: string;
  phone: string;
  is_active: boolean;
}

interface AgencyContextType {
  agencies: Agency[];
  selectedAgencyId: number | null;
  setSelectedAgencyId: (id: number | null) => void;
  isAdmin: boolean;
  agencyFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AgencyContext = createContext<AgencyContextType>({
  agencies: [],
  selectedAgencyId: null,
  setSelectedAgencyId: () => {},
  isAdmin: false,
  agencyFetch: fetch,
});

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(role);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);

  // 관리자면 대리점 목록 로드
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/agencies")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setAgencies(Array.isArray(data) ? data : []);
        // 첫 번째 대리점 자동 선택
        if (Array.isArray(data) && data.length > 0 && !selectedAgencyId) {
          setSelectedAgencyId(data[0].id);
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  // 글로벌 fetch 인터셉트: /api/agency/* 호출 시 X-Agency-Id 헤더 자동 추가
  useEffect(() => {
    if (!isAdmin || !selectedAgencyId) return;

    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("/api/agency/")) {
        const headers = new Headers(init?.headers);
        headers.set("X-Agency-Id", String(selectedAgencyId));
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isAdmin, selectedAgencyId]);

  // agencyFetch (명시적 사용용)
  const agencyFetch = (url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers);
    if (isAdmin && selectedAgencyId) {
      headers.set("X-Agency-Id", String(selectedAgencyId));
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AgencyContext.Provider value={{ agencies, selectedAgencyId, setSelectedAgencyId, isAdmin, agencyFetch }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgencyContext() {
  return useContext(AgencyContext);
}
