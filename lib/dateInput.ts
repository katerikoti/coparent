import { fromZonedTime } from "date-fns-tz";
import { DISPLAY_TIME_ZONE } from "./format";

export type DateFieldMode = "date" | "time" | "datetime";

const pad = (n: number) => String(n).padStart(2, "0");

/** Convert our display text (dd.MM.yyyy[ HH:mm]) to the native input value (yyyy-MM-dd[THH:mm]). */
export function textToNative(value: string, mode: DateFieldMode): string {
  if (!value) return "";
  if (mode === "time") {
    const m = value.match(/^(\d{1,2}):(\d{2})$/);
    return m ? `${pad(+m[1])}:${m[2]}` : "";
  }
  const m = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!m) return "";
  const datePart = `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  return mode === "date" ? datePart : `${datePart}T${pad(+(m[4] ?? "0"))}:${m[5] ?? "00"}`;
}

/** Convert the native input value to our display text (dd.MM.yyyy[ HH:mm]). */
export function nativeToText(value: string, mode: DateFieldMode): string {
  if (!value) return "";
  if (mode === "time") return value;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) return "";
  const datePart = `${m[3]}.${m[2]}.${m[1]}`;
  return mode === "date" ? datePart : `${datePart} ${m[4] ?? "00"}:${m[5] ?? "00"}`;
}

export function parseDateText(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const dt = new Date(+m[3], +m[2] - 1, +m[1]);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function parseDateTimeText(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})[ ,]+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const dt = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function parseTimeText(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
}

/** dd.MM.yyyy HH:mm -> ISO instant (interpreted in the display time zone). */
export function dateTimeTextToIso(value: string): string {
  const dt = parseDateTimeText(value);
  if (!dt) throw new Error("Invalid date/time");
  return fromZonedTime(dt, DISPLAY_TIME_ZONE).toISOString();
}

/** dd.MM.yyyy -> yyyy-MM-dd stored value. */
export function dateTextToYmd(value: string): string | null {
  const dt = parseDateText(value);
  if (!dt) return null;
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** yyyy-MM-dd stored value -> dd.MM.yyyy display text. */
export function ymdToDateText(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** ISO instant -> dd.MM.yyyy display text in the display time zone. */
export function isoToDateText(iso: string): string {
  const d = new Date(iso);
  const m = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => m.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}
