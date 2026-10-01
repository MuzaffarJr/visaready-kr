import type { IsoDate } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Today's calendar date in Korea, which is what effective dates refer to. */
export function seoulDate(now: Date): IsoDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True when `on` falls in [from, to). ISO dates compare lexicographically. */
export function isWithin(on: IsoDate, from: IsoDate, to?: IsoDate): boolean {
  return from <= on && (to === undefined || on < to);
}
