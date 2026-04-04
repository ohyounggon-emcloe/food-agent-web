"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

const FullCalendarWrapper = dynamic(() => import("./calendar-wrapper"), { ssr: false });

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: Record<string, unknown>;
}

export default function AgencyCalendar() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const fetchEvents = (start: string, end: string) => {
    fetch(`/api/agency/calendar?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    fetchEvents(start, end);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">행사 달력</h2>
        <p className="text-gray-500 text-sm mt-1">부가서비스 일정 한눈에 보기</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" />요청</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" />확정</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" />완료</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400" />취소</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <FullCalendarWrapper
                events={events}
                onEventClick={(e: CalendarEvent) => setSelected(e)}
                onDatesSet={(start: string, end: string) => fetchEvents(start, end)}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">상세 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selected.title}</p>
                  <p className="text-xs text-gray-400">{selected.start}</p>
                  <Badge className={`text-[10px] ${
                    selected.extendedProps.status === "requested" ? "bg-amber-100 text-amber-700" :
                    selected.extendedProps.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {String(selected.extendedProps.status)}
                  </Badge>
                  {selected.extendedProps.service_type ? <p>유형: {String(selected.extendedProps.service_type)}</p> : null}
                  {selected.extendedProps.staff_name ? <p>인력: {String(selected.extendedProps.staff_name)}</p> : null}
                  {selected.extendedProps.item_name ? <p>품목: {String(selected.extendedProps.item_name)}</p> : null}
                  {selected.extendedProps.remarks ? <p className="text-gray-400">{String(selected.extendedProps.remarks)}</p> : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full text-xs"
                    onClick={() => router.push(`/user/agency/services?highlight=${selected.id}`)}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />서비스 상세 보기
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">일정을 클릭하면 상세 정보가 표시됩니다</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
