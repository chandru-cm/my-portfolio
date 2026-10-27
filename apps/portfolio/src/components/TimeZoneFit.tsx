import { useEffect, useState } from "react";
import { profile } from "@my-portfolio/content";
import { clock, offsetMinutes, overlap, visitorTimeZone } from "../lib/timezone";

const IST_OFFSET = 330;

function useNow(everyMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

const labelOf = (hours: number) => (hours >= 3 ? "Strong" : hours > 0 ? "Limited" : "None");
const cityOf = (timeZone: string) => timeZone.split("/").pop()!.replace(/_/g, " ");

/**
 * One line that says how the working day fits the visitor's own: worked out from the visitor's time
 * zone and today's date, so it follows daylight-saving changes. Hidden for visitors in India, and
 * replaced by a general sentence when the browser reports no time zone.
 */
export default function TimeZoneFit() {
  const now = useNow();
  const zone = visitorTimeZone();
  const mine = zone && offsetMinutes(zone, now) !== IST_OFFSET ? overlap(zone, profile.workDayUtc, now) : undefined;
  const hours = mine ? mine.minutes / 60 : 0;

  return (
    <div className="tzfit">
      {zone && mine && (
        <p className="tzline" aria-live="polite">
          <span className={`pill${hours >= 3 ? "" : " lo"}`}>{labelOf(hours)} overlap</span>
          <span>
            In <b>{cityOf(zone)}</b> time my day is{" "}
            <b>
              {clock(mine.mineStart)}–{clock(mine.mineEnd)}
            </b>
            {hours > 0 ? (
              <>
                , <b>{hours.toFixed(1)} h</b> inside your 09:00–17:00.
              </>
            ) : (
              <>. That is outside your 09:00–17:00, so email and I will reply within {profile.replyTime}.</>
            )}
          </span>
        </p>
      )}
      {!zone && (
        <p className="tzline">
          <span className="pill">Overlap</span>
          <span>Strong with Europe and the UK, limited with US Eastern.</span>
        </p>
      )}
      <details className="more">
        <summary>Compare other regions</summary>
        <ul>
          {profile.overlapRegions.map((r) => {
            const o = overlap(r.timeZone, profile.workDayUtc, now);
            const h = o.minutes / 60;
            return (
              <li key={r.timeZone}>
                <span>{r.region}</span>
                <span className="num">
                  {clock(o.mineStart)}–{clock(o.mineEnd)}
                </span>
                <span>
                  {h ? `${h.toFixed(1)} h` : "None"} <span className={`pill${h >= 3 ? "" : " lo"}`}>{labelOf(h)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
