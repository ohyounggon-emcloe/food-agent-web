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

interface StoreItem {
  id: number;
  store_name: string;
  store_type: string;
  address: string;
  is_active: boolean;
}

interface AdminContextType {
  agencies: Agency[];
  stores: StoreItem[];
  selectedAgencyId: number | null;
  selectedStoreId: number | null;
  setSelectedAgencyId: (id: number | null) => void;
  setSelectedStoreId: (id: number | null) => void;
  isAdmin: boolean;
  agencyFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AgencyContext = createContext<AdminContextType>({
  agencies: [],
  stores: [],
  selectedAgencyId: null,
  selectedStoreId: null,
  setSelectedAgencyId: () => {},
  setSelectedStoreId: () => {},
  isAdmin: false,
  agencyFetch: fetch,
});

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(role);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("admin_agency_id");
    return saved ? Number(saved) : null;
  });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("admin_store_id");
    return saved ? Number(saved) : null;
  });

  // 관리자면 대리점 + 가게 목록 로드
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/agencies")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setAgencies(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selectedAgencyId) {
          setSelectedAgencyId(data[0].id);
        }
      })
      .catch(() => {});
    fetch("/api/admin/stores")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setStores(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data[0].id);
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  // 글로벌 fetch 인터셉트
  useEffect(() => {
    if (!isAdmin) return;

    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (url.includes("/api/agency/") && selectedAgencyId) {
        const headers = new Headers(init?.headers);
        headers.set("X-Agency-Id", String(selectedAgencyId));
        return originalFetch(input, { ...init, headers });
      }
      if (url.includes("/api/stores") && selectedStoreId) {
        const headers = new Headers(init?.headers);
        headers.set("X-Store-Id", String(selectedStoreId));
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    };

    return () => { window.fetch = originalFetch; };
  }, [isAdmin, selectedAgencyId, selectedStoreId]);

  const updateAgencyId = (id: number | null) => {
    setSelectedAgencyId(id);
    if (id) localStorage.setItem("admin_agency_id", String(id));
    else localStorage.removeItem("admin_agency_id");
  };

  const updateStoreId = (id: number | null) => {
    setSelectedStoreId(id);
    if (id) localStorage.setItem("admin_store_id", String(id));
    else localStorage.removeItem("admin_store_id");
  };

  const agencyFetch = (url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers);
    if (isAdmin && selectedAgencyId) {
      headers.set("X-Agency-Id", String(selectedAgencyId));
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AgencyContext.Provider value={{
      agencies, stores, selectedAgencyId, selectedStoreId,
      setSelectedAgencyId: updateAgencyId, setSelectedStoreId: updateStoreId,
      isAdmin, agencyFetch,
    }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgencyContext() {
  return useContext(AgencyContext);
}
