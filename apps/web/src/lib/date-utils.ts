/**
 * Converts a `<input type="date">` value ("YYYY-MM-DD") to an ISO string.
 *
 * `new Date("YYYY-MM-DD")` parses as UTC midnight. Once that instant is
 * displayed with `toLocaleDateString` in a timezone behind UTC (e.g. Brazil,
 * UTC-3), it rolls back to the previous calendar day — a picked date of
 * "14/08" would save and then redisplay as "13/08". Anchoring to noon UTC
 * instead keeps the same calendar day in every real-world timezone (UTC-12
 * to UTC+14), so this must be used for every date-only input in the module.
 */
export function dateInputToISO(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

/**
 * Today's date as a `<input type="date">` value, using the browser's LOCAL
 * calendar date. `new Date().toISOString().slice(0, 10)` would use UTC
 * instead, which shows tomorrow's date near midnight in timezones ahead of
 * UTC (e.g. late evening in Brazil, UTC-3) — wrong "today" default.
 */
export function todayInputValue(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
