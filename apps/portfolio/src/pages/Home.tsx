import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { education, experience, profile, projects, skills, type Category } from "@my-portfolio/content";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { HAS_RESUME, RESUME_URL, formatMonth, yearsSince } from "../lib/site";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type Filter = "All" | Category;
const FILTERS: Filter[] = ["All", "Backend", "AI", "Mobile"];
const WORDS = ["AI-integrated", "multi-tenant", "payment-ready"];

function Hero() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const { scrollY } = useScroll();
  const driftA = useTransform(scrollY, [0, 600], [0, 150]);
  const driftB = useTransform(scrollY, [0, 600], [0, 300]);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, [reduce]);

  const since = experience[0]?.start;
  const years = since ? yearsSince(since) : 0;

  return (
    <section className="hero" id="top">
      {!reduce && (
        <>
          <motion.span className="blob blob-a" style={{ y: driftA }} aria-hidden="true" />
          <motion.span className="blob blob-b" style={{ y: driftB }} aria-hidden="true" />
        </>
      )}
      <div className="wrap hero-in">
        <motion.p className="pill" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Open to relocation and visa sponsorship
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }}>
          Full-stack engineer building{" "}
          <span className="rotator">
            <AnimatePresence mode="wait" initial={false}>
              <motion.em
                key={WORDS[i]}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {WORDS[i]}
              </motion.em>
            </AnimatePresence>
          </span>{" "}
          SaaS.
        </motion.h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.16 }}>
          {years > 0 ? `${years} years` : "Recent experience"} shipping multi-tenant products with Node.js, TypeScript and PostgreSQL, with
          Gemini, Vertex AI and Pinecone behind the AI features. Based in {profile.location}.
        </motion.p>
        <motion.div className="actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.24 }}>
          <a className="btn btn-primary" href="#work">
            View projects
          </a>
          {HAS_RESUME && (
            <a className="btn" href={RESUME_URL} download>
              Download resume
            </a>
          )}
        </motion.div>
        <Reveal delay={0.1}>
          <dl className="stats">
            <div className="card">
              <dt>Live products</dt>
              <dd>{projects.length}</dd>
            </div>
            <div className="card">
              <dt>In production since</dt>
              <dd>{since ? formatMonth(since) : "-"}</dd>
            </div>
            <div className="card">
              <dt>Focus</dt>
              <dd className="small">RBAC, payments, multi-tenant</dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Work() {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = projects.filter((p) => filter === "All" || p.categories.includes(filter));
  return (
    <section className="section" id="work">
      <div className="wrap">
        <Reveal>
          <p className="k">Selected work</p>
          <h2>Products I helped build</h2>
        </Reveal>
        <div className="chips" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button key={f} className="chip" type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="grid">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectCard project={p} index={projects.indexOf(p)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="muted small note">
          Summaries describe my contributions at a high level. Some products are employer-owned, so implementation details are not shown.
        </p>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section className="section" id="experience">
      <div className="wrap">
        <Reveal>
          <p className="k">Experience</p>
          <h2>Where I've worked</h2>
        </Reveal>
        <div className="timeline">
          {experience.map((e) => (
            <Reveal key={e.id}>
              <article className="tl-item">
                <p className="tl-date">
                  {formatMonth(e.start)} to {e.end ? formatMonth(e.end) : "present"}
                </p>
                <div>
                  <h3>
                    {e.role}, {e.company}
                  </h3>
                  <p className="muted small">{e.location}</p>
                  <ul className="bullets">
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
              <article className="tl-item">
                <p className="tl-date">
                  {ed.startYear} to {ed.endYear}
                </p>
                <div>
                  <h3>
                    {ed.degree}, {ed.field}
                  </h3>
                  <p className="muted small">
                    {ed.institution}, {ed.region} · CGPA {ed.cgpa}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="section" id="skills">
      <div className="wrap">
        <Reveal>
          <p className="k">Skills</p>
          <h2>The tools behind the work</h2>
        </Reveal>
        <div className="skills">
          {skills.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.04}>
              <div className="card">
                <h3>{s.group}</h3>
                <ul className="tags">
                  {s.items.map((it) => (
                    <li className="tag" key={it}>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="wrap">
        <Reveal>
          <p className="k">Contact</p>
          <h2>Let's build something useful.</h2>
          <p className="lead">
            I'm looking for backend or full-stack roles, and I'm open to relocation and visa sponsorship. The quickest way to reach me is email.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
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
      <Hero />
      <Work />
      <Experience />
      <Skills />
      <Contact />
    </>
  );
}
