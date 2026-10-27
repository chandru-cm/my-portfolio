const DAY = 24 * 60;
/** The other side's working day, in their local time. */
const THEIR_START = 9 * 60;
const THEIR_END = 17 * 60;

export type WorkDay = { start: number; end: number };
export type Overlap = {
  /** Minutes that both working days share on the given date. */
  minutes: number;
  /** My working day, written in their local time, as minutes after midnight. */
  mineStart: number;
  mineEnd: number;
};

/** Offset of a time zone from UTC on a given date, in minutes. Follows daylight-saving time. */
export function offsetMinutes(timeZone: string, date: Date): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part ?? "");
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/**
 * How much of my working day (in UTC) falls inside 09:00–17:00 in the given time zone on that date.
 * Their day is tried one day before, on and after, so zones far from UTC still line up.
 */
export function overlap(timeZone: string, workDay: WorkDay, date = new Date()): Overlap {
  const off = offsetMinutes(timeZone, date);
  let minutes = 0;
  for (const shift of [-DAY, 0, DAY]) {
    const start = THEIR_START - off + shift;
    const end = THEIR_END - off + shift;
    minutes = Math.max(minutes, Math.min(workDay.end, end) - Math.max(workDay.start, start));
  }
  return { minutes, mineStart: workDay.start + off, mineEnd: workDay.end + off };
}

/** Minutes after midnight as HH:MM, wrapping around the day. */
export function clock(totalMinutes: number): string {
  const t = ((totalMinutes % DAY) + DAY) % DAY;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** The visitor's own IANA time zone, when the browser reports one. */
export function visitorTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
