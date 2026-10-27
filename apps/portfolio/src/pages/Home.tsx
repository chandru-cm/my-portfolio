import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  education,
  experience,
  LEVEL_LABEL,
  profile,
  projectCount,
  projects,
  skills,
  type Category,
} from "@my-portfolio/content";
import CopyEmail from "../components/CopyEmail";
import Cta from "../components/Cta";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { HAS_RESUME, RESUME_URL, formatMonth, yearsSince } from "../lib/site";
import { clock, offsetMinutes, overlap, visitorTimeZone } from "../lib/timezone";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type Filter = "All" | Category;
type View = "cards" | "table";
const FILTERS: Filter[] = ["All", "Backend", "Mobile", "AI"];

function Intro() {
  const since = experience[0]?.start;
  const years = since ? yearsSince(since) : 0;
  const { availability: a } = profile;
  const facts: [string, string][] = [
    [
      "Experience",
      since
        ? `${years > 0 ? `${years} years, since` : "Since"} ${formatMonth(since)}`
        : "",
    ],
    ["Based in", `${profile.location} · ${profile.timezone}`],
    ["Looking for", a.lookingFor],
    ["Work setup", a.workSetup],
  ];
  return (
    <section className="intro" id="top">
      <div className="wrap">
        <h1 className="in">{profile.name}</h1>
        <p className="role in">{profile.headline}</p>
        <p className="sum in d1">{profile.summary}</p>
        <dl className="facts in d2">
          {facts
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        {a.relocation && (
          <div className="callout in d3" role="note">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <p>
              <b>Open to relocation</b> abroad.
              {a.visaSponsorship ? " I will need visa sponsorship." : ""}
            </p>
          </div>
        )}
        <div className="ctas in d4">
          <Cta kind="section" to="projects" variant="primary">
            See projects{" "}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </Cta>
          {HAS_RESUME && (
            <Cta
              kind="download"
              href={RESUME_URL}
              fileName="Chandra_Moorthy_Resume.pdf"
            >
              Resume (PDF)
            </Cta>
          )}
          <Cta
            kind="external"
            href={profile.github}
            label={`${profile.name} on GitHub`}
          >
            GitHub
          </Cta>
          <Cta
            kind="external"
            href={profile.linkedin}
            label={`${profile.name} on LinkedIn`}
          >
            LinkedIn
          </Cta>
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const [filter, setFilter] = useState<Filter>("All");
  const [view, setView] = useState<View>("cards");
  const visible = projects.filter(
    (p) => filter === "All" || p.categories.includes(filter),
  );
  const count = (f: Filter) =>
    f === "All"
      ? projects.length
      : projects.filter((p) => p.categories.includes(f)).length;
  return (
    <section className="blk" id="projects">
      <div className="wrap">
        <Reveal>
          <div className="sh">
            <div>
              <p className="lbl">Projects</p>
              <h2>Products I built features for</h2>
              <p>
                All {projects.length} are live. Open one for the case study: the
                problem, what I built, how it works and the numbers behind it.
              </p>
            </div>
          </div>
        </Reveal>
        <div className="ctl">
          <div className="seg" role="group" aria-label="Filter projects">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f} <small>{count(f)}</small>
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Project view">
            {(["cards", "table"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v === "cards" ? "Cards" : "Table"}
              </button>
            ))}
          </div>
        </div>
        {view === "cards" ? (
          <div className="grid">
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>What I built</th>
                  <th>Stack</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projects/${p.id}`}>{p.name}</Link>
                    </td>
                    <td>{p.type}</td>
                    <td>{p.tableSummary ?? p.myPart}</td>
                    <td>{p.stack.join(", ")}</td>
                    <td>{p.period ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small note">
          Summaries describe my own contributions. Some products are
          employer-owned, so the detail shown is limited to what is public.
        </p>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="blk" id="skills">
      <div className="wrap">
        <Reveal>
          <div className="sh">
            <div>
              <p className="lbl">Skills</p>
              <h2>Tech stack</h2>
              <p>
                Grouped by area. The number shows how many of the{" "}
                {projects.length} products above use it.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="skills">
            {skills.map((g) => (
              <div className="srow" key={g.group}>
                <h3>{g.group}</h3>
                <ul className="chips-row">
                  {g.items.map((it) => {
                    const n = projectCount(it, projects);
                    return (
                      <li
                        className={`skill l${it.level}`}
                        key={it.name}
                        title={LEVEL_LABEL[it.level]}
                      >
                        <i aria-hidden="true" />
                        {it.name}
                        {n ? (
                          <small aria-label={`used in ${n} products`}>
                            {n}
                          </small>
                        ) : null}
                        <span className="sr-only">
                          {" "}
                          ({LEVEL_LABEL[it.level]})
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
        <div className="legend" aria-hidden="true">
          {([3, 2, 1] as const).map((l) => (
            <span key={l}>
              <i className={`l${l}`} />
              {LEVEL_LABEL[l]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section className="blk" id="experience">
      <div className="wrap">
        <Reveal>
          <div className="sh">
            <div>
              <p className="lbl">Experience</p>
              <h2>Work and education</h2>
            </div>
          </div>
        </Reveal>
        {experience.map((e) => (
          <Reveal key={e.id}>
            <article className="xp">
              <time>
                {formatMonth(e.start)} –{" "}
                {e.end ? formatMonth(e.end) : "present"}
              </time>
              <div>
                <h3>{e.role}</h3>
                <p className="org">
                  {e.company} · {e.location}
                </p>
                <ul>
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>
        ))}
        {education.map((ed) => (
          <Reveal key={ed.institution}>
            <article className="xp">
              <time>
                {ed.startYear} – {ed.endYear}
              </time>
              <div>
                <h3>
                  {ed.degree
                    .replace(/ \(.*\)/, "")
                    .replace("Bachelor of Engineering", "B.E.")}{" "}
                  {ed.field}
                </h3>
                <p className="org">
                  {ed.institution}, {ed.region} · CGPA {ed.cgpa}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Remote() {
  // Worked out on the visitor's screen and refreshed each minute, so it follows daylight-saving time.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const mine = visitorTimeZone();
  const regions = [...profile.overlapRegions];
  if (mine && offsetMinutes(mine, now) !== 330 && !regions.some((r) => r.timeZone === mine)) regions.unshift({ region: `Your time zone (${mine})`, timeZone: mine });

  return (
    <section className="blk" id="remote">
      <div className="wrap">
        <Reveal>
          <div className="sh">
            <div>
              <p className="lbl">Remote work</p>
              <h2>Working across time zones</h2>
              <p>
                Based in {profile.location} ({profile.timezone}), working {profile.workingHours}. Overlap is counted against a 09:00–17:00 local day and
                follows each region's current daylight-saving time.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="tw">
            <table className="tz">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Their time now</th>
                  <th>My day in their time</th>
                  <th>Overlap today</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => {
                  const o = overlap(r.timeZone, profile.workDayUtc, now);
                  const hours = o.minutes / 60;
                  const local = new Intl.DateTimeFormat("en-GB", { timeZone: r.timeZone, hour: "2-digit", minute: "2-digit" }).format(now);
                  return (
                    <tr key={r.timeZone}>
                      <td>{r.region}</td>
                      <td className="num">{local}</td>
                      <td className="num">
                        {clock(o.mineStart)}–{clock(o.mineEnd)}
                      </td>
                      <td>
                        <span className="num">{hours ? `${hours.toFixed(1)} h` : "None"}</span>{" "}
                        <span className={`pill${hours >= 3 ? "" : " lo"}`}>{hours >= 3 ? "Strong" : hours > 0 ? "Limited" : "No overlap"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Intro />
      <Projects />
      <Skills />
      <Experience />
      <Remote />
    </>
  );
}
