/**
 * Returns the best display date for an event.
 * The API stores `event_date` as the prediction-lock date and `close_date` as
 * the actual resolution date for season-long events. We pick whichever is later
 * so that long-running events (e.g. AFL H&A season) show their end date, not
 * the round-1 lock date.
 */
export function getEventDisplayDate(
  event_date: string | null | undefined,
  close_date: string | null | undefined
): string | null {
  if (!event_date && !close_date) return null;
  if (!event_date) return close_date!;
  if (!close_date) return event_date;
  return event_date > close_date ? event_date : close_date;
}

export function formatEventDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
