import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, addDays, setHours, setMinutes, format } from "date-fns";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface RecurringRuleInput {
  timeZone: string;
  intervalWeeks: number;
  referenceDate: string; // YYYY-MM-DD (a date in a B week)
  parentBStartWeekday: Weekday;
  parentBStartTime: string; // HH:mm
  parentBEndWeekday: Weekday;
  parentBEndTime: string; // HH:mm
  effectiveStart: string; // YYYY-MM-DD
  effectiveEnd?: string | null;
}

export interface GeneratedPeriod {
  responsible: "A" | "B";
  startAt: Date;
  endAt: Date;
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return { h: h || 0, m: m || 0 };
}

function weekStart(date: Date, tz: string): Date {
  const z = toZonedTime(date, tz);
  return startOfWeek(z, { weekStartsOn: 1 });
}

function weekIndex(date: Date, reference: Date, tz: string): number {
  const ws = weekStart(date, tz);
  const wr = weekStart(reference, tz);
  const diff = ws.getTime() - wr.getTime();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

function isBWeek(date: Date, rule: RecurringRuleInput): boolean {
  const ref = new Date(normalizeYMD(rule.referenceDate) + "T00:00:00Z");
  const idx = weekIndex(date, ref, rule.timeZone);
  const mod = ((idx % rule.intervalWeeks) + rule.intervalWeeks) % rule.intervalWeeks;
  return mod === 0;
}

function setTimeOnZonedDay(zonedDay: Date, time: string): Date {
  const { h, m } = parseTime(time);
  return setMinutes(setHours(zonedDay, h), m);
}

function dateFromYMD(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

function normalizeYMD(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function generateParentingPeriods(
  rule: RecurringRuleInput,
  fromInput: Date,
  toInput: Date,
): GeneratedPeriod[] {
  const tz = rule.timeZone;
  let from = fromInput;
  let to = toInput;

  // Clamp to the rule's effective range.
  if (rule.effectiveStart) {
    const es = fromZonedTime(`${normalizeYMD(rule.effectiveStart)}T00:00:00`, tz);
    if (es.getTime() > from.getTime()) from = es;
  }
  if (rule.effectiveEnd) {
    const ee = fromZonedTime(`${normalizeYMD(rule.effectiveEnd)}T23:59:59`, tz);
    if (ee.getTime() < to.getTime()) to = ee;
  }
  if (to.getTime() <= from.getTime()) return [];

  const bPeriods: { start: Date; end: Date }[] = [];

  // iterate candidate days (UTC midnight steps) across range, but check zoned weekday
  const dayMs = 24 * 60 * 60 * 1000;
  let cursor = new Date(from);
  // start slightly before range to capture period starting before 'from'
  cursor = new Date(from.getTime() - 7 * dayMs);

  while (cursor < to) {
    const z = toZonedTime(cursor, tz);
    if (z.getDay() === rule.parentBStartWeekday && isBWeek(cursor, rule)) {
      // construct start/end
      const zStart = setTimeOnZonedDay(new Date(z.getTime()), rule.parentBStartTime); // careful: z is date object with zoned fields
      // Re-derive zoned midnight for this cursor day to avoid mutation
      const zMid = toZonedTime(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate())), tz);
      // Actually use fromZonedTime with zoned wall; simpler approach below:
      const zDayStart = toZonedTime(cursor, tz);
      const y = zDayStart.getFullYear();
      const mo = zDayStart.getMonth();
      const d = zDayStart.getDate();
      const zonedDay = new Date(Date.UTC(y, mo, d)); // treat wall date as UTC for setHours? We then fromZonedTime would interpret UTC wall as? Need proper.

      // We'll instead construct ISO wall string and parse
      const dateStr = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const { h: sh, m: sm } = parseTime(rule.parentBStartTime);
      const { h: eh, m: em } = parseTime(rule.parentBEndTime);
      const startWall = `${dateStr}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`;
      const startUtc = fromZonedTime(startWall, tz);

      // end day
      const startDate = new Date(dateStr + "T00:00:00Z");
      const endOffsetDays = (() => {
        let diff = rule.parentBEndWeekday - rule.parentBStartWeekday;
        if (diff < 0) diff += 7;
        if (diff === 0) {
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          if (endMin <= startMin) diff = 7;
        }
        return diff;
      })();
      const endDateObj = new Date(startDate.getTime() + endOffsetDays * dayMs);
      const ey = endDateObj.getUTCFullYear();
      const emo = endDateObj.getUTCMonth();
      const ed = endDateObj.getUTCDate();
      const endDateStr = `${ey}-${String(emo + 1).padStart(2, "0")}-${String(ed).padStart(2, "0")}`;
      const endWall = `${endDateStr}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
      const endUtc = fromZonedTime(endWall, tz);

      if (endUtc > from && startUtc < to) {
        bPeriods.push({ start: startUtc, end: endUtc });
      }
    }
    cursor = new Date(cursor.getTime() + dayMs);
  }

  // Convert B periods to A-filled gaps
  const result: GeneratedPeriod[] = [];
  let cursorTime = from.getTime();
  const sorted = bPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const bp of sorted) {
    const bStart = Math.max(bp.start.getTime(), from.getTime());
    const bEnd = Math.min(bp.end.getTime(), to.getTime());
    if (bp.start.getTime() > cursorTime) {
      result.push({ responsible: "A", startAt: new Date(cursorTime), endAt: new Date(Math.min(bp.start.getTime(), to.getTime())) });
    }
    if (bStart < bEnd) {
      result.push({ responsible: "B", startAt: new Date(bStart), endAt: new Date(bEnd) });
    }
    cursorTime = Math.max(cursorTime, bp.end.getTime());
    if (cursorTime >= to.getTime()) break;
  }
  if (cursorTime < to.getTime()) {
    result.push({ responsible: "A", startAt: new Date(cursorTime), endAt: new Date(to.getTime()) });
  }
  // filter empty
  return result.filter((p) => p.endAt.getTime() > p.startAt.getTime());
}

export const INITIAL_RULE: RecurringRuleInput = {
  timeZone: "UTC",
  intervalWeeks: 2,
  referenceDate: "2026-01-05", // a Monday in a B week? We'll define separately in tests
  parentBStartWeekday: 3, // Wednesday
  parentBStartTime: "16:00",
  parentBEndWeekday: 1, // Monday
  parentBEndTime: "08:00",
  effectiveStart: "2026-01-01",
  effectiveEnd: null,
};
