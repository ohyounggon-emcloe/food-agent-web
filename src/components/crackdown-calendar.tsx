"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarEvent {
  id: number;
  title: string;
  alert_type: string;
  region: string | null;
  enforcement_date: string;
  risk_level: string;
}

const RISK_DOT: Record<string, string> = {
  Level1: "bg-red-500",
  Level2: "bg-amber-500",
  Level3: "bg-blue-400",
};

const TYPE_BADGE: Record<string, string> = {
  "단속예고": "bg-red-500 text-white",
  "점검공지": "bg-amber-500 text-white",
  "행정처분": "bg-purple-500 text-white",
  "회수명령": "bg-rose-600 text-white",
  "판매중지": "bg-red-700 text-white",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CrackdownCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetch("/api/crackdown/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]));
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const d = e.enforcement_date;
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(e);
  }

  const goMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDate(null);
  };

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{"단속/점검 달력"}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goMonth(-1)}
              className="px-2 py-0.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            >
              {"◀"}
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={() => goMonth(1)}
              className="px-2 py-0.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            >
              {"▶"}
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                d === "일" ? "text-red-400" : d === "토" ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDate(day);
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday =
              dateStr ===
              new Date().toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = (firstDay + i) % 7;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`h-10 flex flex-col items-center justify-center rounded-md text-sm transition-colors relative ${
                  isSelected
                    ? "bg-teal-500 text-white"
                    : isToday
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "hover:bg-slate-100"
                } ${dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : ""}`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 absolute bottom-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[e.risk_level] || "bg-slate-300"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex gap-3 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {"긴급"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {"주의"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {"참고"}
          </span>
        </div>

        {/* 선택일 알림 */}
        {selectedDate && (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-medium text-slate-500 mb-2">
              {selectedDate} — {selectedEvents.length}건
            </p>
            {selectedEvents.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Badge
                      className={`shrink-0 text-[10px] px-1.5 py-0 ${
                        TYPE_BADGE[e.alert_type] || "bg-slate-500 text-white"
                      }`}
                    >
                      {e.alert_type}
                    </Badge>
                    <span className="line-clamp-1">{e.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">{"해당일 단속 정보 없음"}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
