import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export const DISPLAY_TIME_ZONE = "Europe/Helsinki";

export function zonedDate(date: Date, timeZone = DISPLAY_TIME_ZONE): Date {
  return toZonedTime(date, timeZone);
}

export function formatDate(date: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return format(toZonedTime(date, timeZone), "dd.MM.yyyy");
}

export function formatTime(date: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return format(toZonedTime(date, timeZone), "HH:mm");
}

export function formatDateTime(date: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return format(toZonedTime(date, timeZone), "dd.MM.yyyy HH:mm");
}

// Balance is stored in half-days; display it as days with an explicit sign.
export function formatDays(halfDays: number, locale = "fi"): string {
  const days = halfDays / 2;
  const abs = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(days));
  const sign = days > 0 ? "+" : days < 0 ? "-" : "";
  return `${sign}${abs}`;
}
