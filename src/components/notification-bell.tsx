"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
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

const TYPE_LABEL: Record<string, string> = {
  article: "위험정보",
  crackdown: "단속정보",
};

const RISK_LABEL: Record<string, string> = {
  Level1: "즉시대응",
  Level2: "주의관찰",
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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    setLastChecked(new Date().toISOString());
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}-${dd} ${hh}:${mi}`;
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
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 패널 — 벨 오른쪽으로 펼침 */}
      {isOpen && (
        <div className="fixed inset-x-2 top-14 bg-white rounded-lg shadow-xl border border-gray-200 z-50 sm:fixed sm:inset-auto sm:left-auto sm:right-2 sm:top-14 sm:w-96">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md px-2.5 py-1 hover:bg-gray-50 transition-colors"
              >
                모두읽음으로표시
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const isUnread = !readIds.has(n.id);
                const category =
                  RISK_LABEL[n.risk_level] || TYPE_LABEL[n.type] || "정보";

                return (
                  <Link
                    key={n.id}
                    href={n.url}
                    target={n.type === "article" ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={() => {
                      setReadIds((prev) => new Set([...prev, n.id]));
                    }}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">{category}</p>
                        <p
                          className={cn(
                            "text-sm leading-snug line-clamp-2",
                            isUnread
                              ? "font-semibold text-gray-900"
                              : "font-normal text-gray-600"
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {n.source} | {formatDate(n.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-1">
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {formatDate(n.date).slice(0, 5)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* 푸터 */}
          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <Link
              href="/user/news"
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              전체보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
