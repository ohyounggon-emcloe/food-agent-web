"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, AlertTriangle, Shield, ChevronRight } from "lucide-react";
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

interface SummaryGroup {
  label: string;
  icon: typeof AlertTriangle;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
  unread: number;
}

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
      setReadIds(new Set(notifications.map((n) => n.id)));
      setLastChecked(new Date().toISOString());
    }
  };

  // 분류별 요약 집계
  const summaryGroups: SummaryGroup[] = useMemo(() => {
    const countBy = (
      predicate: (n: Notification) => boolean
    ) => {
      const matched = notifications.filter(predicate);
      return {
        count: matched.length,
        unread: matched.filter((n) => !readIds.has(n.id)).length,
      };
    };

    const l1 = countBy((n) => n.risk_level === "Level1");
    const l2 = countBy((n) => n.risk_level === "Level2");
    const crackdown = countBy((n) => n.type === "crackdown");

    return [
      {
        label: "즉시 대응",
        icon: AlertTriangle,
        href: "/user/news?risk=Level1",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        ...l1,
      },
      {
        label: "주의 관찰",
        icon: Shield,
        href: "/user/news?risk=Level2",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        ...l2,
      },
      {
        label: "단속 정보",
        icon: Shield,
        href: "/user/crackdown",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        ...crackdown,
      },
    ];
  }, [notifications, readIds]);

  const totalCount = notifications.length;

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

      {/* 알림 요약 패널 */}
      {isOpen && (
        <div className="fixed right-2 top-14 w-[calc(100vw-1rem)] max-w-72 bg-white rounded-lg shadow-xl border z-50 sm:absolute sm:right-0 sm:top-10 sm:w-72">
          <div className="px-3 py-2.5 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">위험 알림</h3>
              <p className="text-[11px] text-gray-400">
                총 {totalCount}건 · 미확인 {unreadCount}건
              </p>
            </div>
          </div>

          {totalCount === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">
              새로운 위험 알림이 없습니다
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {summaryGroups.map((group) => (
                <Link
                  key={group.label}
                  href={group.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
                    group.bgColor,
                    group.borderColor,
                    "hover:opacity-80"
                  )}
                >
                  <group.icon className={cn("w-4 h-4 shrink-0", group.color)} />
                  <span className={cn("text-sm font-medium flex-1", group.color)}>
                    {group.label}
                  </span>
                  <span className={cn("text-lg font-bold tabular-nums", group.color)}>
                    {group.count}
                  </span>
                  {group.unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                      {group.unread > 9 ? "9+" : group.unread}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}

          <div className="px-3 py-2 border-t">
            <Link
              href="/user/news"
              onClick={() => setIsOpen(false)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              전체 게시글 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
