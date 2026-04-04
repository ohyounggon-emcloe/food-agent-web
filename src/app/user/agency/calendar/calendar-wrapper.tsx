"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: Record<string, unknown>;
}

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDatesSet: (start: string, end: string) => void;
}

export default function CalendarWrapper({ events, onEventClick, onDatesSet }: Props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ko"
      events={events}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek",
      }}
      height="auto"
      eventClick={(info) => {
        const event = events.find(e => e.id === info.event.id);
        if (event) onEventClick(event);
      }}
      datesSet={(dateInfo) => {
        const start = dateInfo.startStr.split("T")[0];
        const end = dateInfo.endStr.split("T")[0];
        onDatesSet(start, end);
      }}
      eventDisplay="block"
      dayMaxEvents={3}
    />
  );
}
