import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { education, experience, profile, projects, skills, type Category } from "@my-portfolio/content";
import CopyEmail from "../components/CopyEmail";
import Cta from "../components/Cta";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { HAS_RESUME, RESUME_URL, formatMonth, yearsSince } from "../lib/site";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type Filter = "All" | Category;
const FILTERS: Filter[] = ["All", "Backend", "AI", "Mobile"];
function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const driftA = useTransform(scrollY, [0, 600], [0, 150]);
  const driftB = useTransform(scrollY, [0, 600], [0, 300]);

  const since = experience[0]?.start;
  const years = since ? yearsSince(since) : 0;
  // A real figure from the resume: the user roles RentEasify serves (owners to association users).
  const roles = projects.find((p) => p.id === "renteasify")?.userRoles?.length ?? 0;

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
          Full-stack engineer. I build the <em>payments, permissions and AI</em> behind multi-tenant SaaS.
        </motion.h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.16 }}>
          {years > 0 ? `${years} years` : "Recent experience"} in production with Node.js, TypeScript and PostgreSQL, with Gemini, Vertex AI and
          Pinecone behind the AI features. {profile.location}.
        </motion.p>
        <motion.div className="actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.24 }}>
          <Cta kind="section" to="work" variant="primary">
            View work
          </Cta>
          {HAS_RESUME && (
            <Cta kind="download" href={RESUME_URL} fileName="Chandra_Moorthy_Resume.pdf">
              Download résumé (PDF)
            </Cta>
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
            {roles > 0 && (
              <div className="card">
                <dt>User roles in RentEasify</dt>
                <dd>{roles}</dd>
              </div>
            )}
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
          <h2>Looking for a backend or full-stack role.</h2>
          <p className="lead">
            {profile.location}. Open to relocation and visa sponsorship. The quickest way to reach me is email.
          </p>
          <div className="actions">
            <Cta kind="mail" email={profile.email} variant="primary">
              Email me
            </Cta>
            <CopyEmail email={profile.email} />
            {HAS_RESUME && (
              <Cta kind="download" href={RESUME_URL} fileName="Chandra_Moorthy_Resume.pdf">
                Download résumé (PDF)
              </Cta>
            )}
          </div>
          <p className="contact-address">{profile.email}</p>
          <div className="actions actions-links">
            <Cta kind="external" href={profile.linkedin} label={`${profile.name} on LinkedIn`} variant="link">
              LinkedIn
            </Cta>
            <Cta kind="external" href={profile.github} label={`${profile.name} on GitHub`} variant="link">
              GitHub
            </Cta>
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
