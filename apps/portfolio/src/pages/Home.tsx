import { useState } from "react";
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
import Cta from "../components/Cta";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { HAS_RESUME, RESUME_URL, formatMonth } from "../lib/site";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type Filter = "All" | Category;
type View = "cards" | "table";
const FILTERS: Filter[] = ["All", "Backend", "Mobile", "AI"];

function Intro() {
  const { availability: a } = profile;
  const availability = [
    a.relocation ? "Open to roles in the US and EU." : "",
    a.visaSponsorship ? "I need visa sponsorship." : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className="intro" id="top">
      <div className="wrap">
        <h1 className="in">{profile.name}</h1>
        <p className="role in">{profile.headline}</p>
        <p className="sum in d1">{profile.summary}</p>
        {availability && <p className="avail in d2">{availability}</p>}
        <div className="ctas in d3">
          <Cta kind="section" to="contact" variant="primary" focusForm>
            Get in touch{" "}
            <span className="arrow" aria-hidden="true">
              ↓
            </span>
          </Cta>
          <Cta kind="section" to="projects">
            See selected work
          </Cta>
          <div className="ctas-links">
            {HAS_RESUME && (
              <Cta
                kind="download"
                href={RESUME_URL}
                fileName="Chandra_Moorthy_Resume.pdf"
                variant="link"
              >
                Resume
              </Cta>
            )}
            <Cta
              kind="external"
              href={profile.github}
              label={`${profile.name} on GitHub`}
              variant="link"
              icon="github"
            >
              GitHub
            </Cta>
            <Cta
              kind="external"
              href={profile.linkedin}
              label={`${profile.name} on LinkedIn`}
              variant="link"
              icon="linkedin"
            >
              LinkedIn
            </Cta>
          </div>
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

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Intro />
      <Projects />
      <Skills />
      <Experience />
    </>
  );
}
