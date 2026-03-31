"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "article" | "crackdown";
  title: string;
  risk_level: string;
  source: string;
  date: string;
  url: string;
}

const RISK_STYLE: Record<string, string> = {
  Level1: "bg-red-500 text-white",
  Level2: "bg-amber-500 text-white",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const params = lastChecked ? `?since=${lastChecked}&limit=20` : "?limit=20";
      const res = await fetch(`/api/notifications${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications?.length > 0) {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = data.notifications.filter(
            (n: Notification) => !existingIds.has(n.id)
          );
          return [...newItems, ...prev].slice(0, 50);
        });
      }
    } catch {
      // 무시
    }
  }, [lastChecked]);

  // 30초마다 폴링
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // 모두 읽음 처리
      setReadIds(new Set(notifications.map((n) => n.id)));
      setLastChecked(new Date().toISOString());
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* 벨 버튼 */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 패널 */}
      {isOpen && (
        <div className="fixed right-2 top-14 w-[calc(100vw-1rem)] max-w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto sm:absolute sm:right-0 sm:top-10 sm:w-80">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">위험 알림</h3>
            <p className="text-xs text-gray-400">Level1/Level2 위험 정보</p>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              새로운 위험 알림이 없습니다
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 15).map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  target={n.type === "article" ? "_blank" : undefined}
                  rel="noreferrer"
                  className={cn(
                    "block p-3 hover:bg-gray-50 transition-colors",
                    !readIds.has(n.id) && "bg-red-50/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", RISK_STYLE[n.risk_level] || "bg-gray-500 text-white")}>
                      {n.risk_level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {n.source} | {n.date?.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
