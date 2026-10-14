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
