"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string; title: string; start: string; backgroundColor: string;
  extendedProps: Record<string, unknown>;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "요청", confirmed: "확정", completed: "완료",
};

export default function ConnectCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
    fetch(`/api/agency/calendar?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [year, month]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // 달력 그리드 생성
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getEventsForDate = (day: number) =>
    events.filter(e => e.start?.startsWith(getDateStr(day)));

  const selectedEvents = selectedDate
    ? events.filter(e => e.start?.startsWith(selectedDate))
    : [];

  return (
    <div className="space-y-3">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold">{year}년 {month + 1}월</h2>
        <button onClick={nextMonth} className="p-2"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* 달력 그리드 */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 border-b">
          {["일", "월", "화", "수", "목", "금", "토"].map(d => (
            <div key={d} className="py-2 font-medium">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="h-12 border-t" />;
              const dateStr = getDateStr(day);
              const dayEvents = getEventsForDate(day);
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              const isSelected = dateStr === selectedDate;
              return (
                <button key={di}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-12 border-t flex flex-col items-center justify-start pt-1 transition-colors
                    ${isSelected ? "bg-emerald-50" : ""}
                    ${isToday ? "font-bold" : ""}`}>
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-emerald-600 text-white" : ""}`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.backgroundColor }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 선택된 날짜 이벤트 */}
      {selectedDate && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">{selectedDate} 일정</h3>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400">등록된 일정이 없습니다</p>
          ) : (
            selectedEvents.map(e => (
              <Card key={e.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.backgroundColor }} />
                    <p className="text-sm font-medium flex-1 truncate">{e.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {STATUS_LABEL[String(e.extendedProps.status)] || String(e.extendedProps.status)}
                    </Badge>
                  </div>
                  {e.extendedProps.service_type ? (
                    <p className="text-xs text-gray-400 mt-1 ml-4">{String(e.extendedProps.service_type)}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
