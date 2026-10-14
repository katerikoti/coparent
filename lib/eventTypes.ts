// Fixed set of event types a parent can add. Keep in sync with the
// `events.types.*` message keys so labels stay localized.
export const EVENT_TYPES = [
  "birthday",
  "business_trip",
  "travel_with_kids",
  "travel_without_kids",
  "doctor",
  "school",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Resolve a localized label for an event type, falling back to the raw value. */
export function eventTypeLabel(type: string, labels: Record<string, string>): string {
  return labels[type] ?? type.replace(/_/g, " ");
}
