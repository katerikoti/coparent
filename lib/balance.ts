import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function countHalfDays(start: Date, end: Date, timeZone: string): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  let t = start.getTime() - 3 * dayMs;
  const dates: string[] = [];
  while (t < end.getTime() + 3 * dayMs) {
    const z = toZonedTime(new Date(t), timeZone);
    const ds = `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
    if (!seen.has(ds)) { seen.add(ds); dates.push(ds); }
    t += dayMs;
  }
  let count = 0;
  for (const ds of dates) {
    // noon midpoint of 08-16 segment
    const noon = fromZonedTime(`${ds}T12:00:00`, timeZone);
    if (noon.getTime() >= start.getTime() && noon.getTime() < end.getTime()) count += 1;
    // night midpoint 00:00 of following day (segment 16:00-08:00)
    const [y, m, d] = ds.split("-").map((x) => parseInt(x, 10));
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    const ns = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
    const midnight = fromZonedTime(`${ns}T00:00:00`, timeZone);
    if (midnight.getTime() >= start.getTime() && midnight.getTime() < end.getTime()) count += 1;
  }
  return count;
}

export function computeAdjustmentHalfDays(params: {
  baselineStart: Date;
  baselineEnd: Date;
  proposedStart: Date;
  proposedEnd: Date;
  timeZone: string;
}): number {
  const base = countHalfDays(params.baselineStart, params.baselineEnd, params.timeZone);
  const proposed = countHalfDays(params.proposedStart, params.proposedEnd, params.timeZone);
  return Math.round((proposed - base) * 2) / 2;
}
