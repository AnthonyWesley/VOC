import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ListEventsOutput } from "../types/eventTypes";

const EVENT_COLORS: Record<string, string> = {
  SUNDAY_SERVICE: "bg-emerald-500",
  HOUSE_SERVICE: "bg-cyan-500",
  PRAYER_MEETING: "bg-indigo-500",
  BIBLE_STUDY: "bg-amber-500",
  YOUTH_NIGHT: "bg-pink-500",
  SPECIAL_EVENT: "bg-purple-500",
};

type Props = {
  currentMonth: Date;
  events: ListEventsOutput[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function EventCalendar({
  currentMonth,
  events,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ListEventsOutput[]>();
    for (const event of events) {
      const key = format(new Date(event.startsAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="card-premium p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-white capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>

        <button
          onClick={onNextMonth}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-gray-500 uppercase">
        {dayLabels.map((label) => (
          <div key={label} className="py-1">{label}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 text-center">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={`relative p-2 text-sm transition-colors
                ${!isCurrentMonth ? "text-gray-700" : "text-gray-300"}
                ${isSelected ? "rounded-lg bg-indigo-600/30 text-indigo-300" : "hover:bg-gray-800/50"}
                ${today ? "font-bold" : ""}
              `}
            >
              <span className={`${today ? "text-emerald-400" : ""}`}>
                {format(day, "d")}
              </span>

              {dayEvents.length > 0 && (
                <div className="mt-1 flex justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className={`size-1.5 rounded-full ${EVENT_COLORS[ev.type] ?? "bg-gray-500"}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-gray-500">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
