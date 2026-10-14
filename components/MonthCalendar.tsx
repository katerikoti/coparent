import { getDaysInMonth, startOfMonth, addDays, format } from "date-fns";
import { formatDate } from "@/lib/format";

export const parentColors = ["#7c3aed", "#10b981", "#f59e0b"];
export const eventColor = "#f59e0b";

export type CalendarPeriod = {
  responsibleUserId: string;
  startAt: Date;
  endAt: Date;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  startAt: Date;
  endAt: Date;
};

export type CalendarParent = {
  id: string;
  name: string;
};

export default function MonthCalendar({
  month,
  periods,
  events,
  parents,
  weekdays,
}: {
  month: Date;
  periods: CalendarPeriod[];
  events: CalendarEvent[];
  parents: CalendarParent[];
  weekdays: string[];
}) {
  const firstDay = startOfMonth(month);
  const daysInMonth = getDaysInMonth(month);
  // pad start to Monday (1)
  const startWeekday = firstDay.getDay(); // 0 Sunday
  const offset = (startWeekday + 6) % 7; // Monday-based
  const colorFor = (id: string) => {
    const index = parents.findIndex((p) => p.id === id);
    return parentColors[index >= 0 ? index : 0];
  };

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(addDays(firstDay, d - 1));

  const dayPeriods = (day: Date) =>
    periods.filter((p) => p.startAt <= dayEnd(day) && p.endAt > dayStart(day));

  const dayEvents = (day: Date) =>
    events.filter((e) => e.startAt <= dayEnd(day) && e.endAt > dayStart(day));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
        {weekdays.map((d) => (
          <div key={d} className="px-2 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-28 border-b border-r border-slate-100 bg-slate-50/50" />;
          const ps = dayPeriods(day);
          const evs = dayEvents(day);
          const uniqueParents = Array.from(new Set(ps.map((p) => p.responsibleUserId)));
          const bg =
            uniqueParents.length >= 2
              ? `linear-gradient(90deg, ${colorFor(uniqueParents[0])} 50%, ${colorFor(uniqueParents[1])} 50%)`
              : uniqueParents.length === 1
              ? colorFor(uniqueParents[0])
              : "#f8fafc";
          return (
            <div key={day.toISOString()} className="h-28 border-b border-r border-slate-100 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{day.getDate()}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: bg }} />
              <div className="mt-2 space-y-1">
                {evs.slice(0, 2).map((e) => (
                  <div key={e.id} className="truncate rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    {e.title}
                  </div>
                ))}
                {evs.length > 2 && <div className="text-[10px] text-slate-500">+{evs.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
