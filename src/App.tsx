import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { profile, projects, skills, type Category, type Project } from "./data";

type Theme = "light" | "dark";
type Filter = "All" | Category;

const FILTERS: Filter[] = ["All", "Backend", "AI", "Mobile"];
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.18 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

function ProjectCard({ p, index }: { p: Project; index: number }) {
  return (
    <motion.article
      layout
      className={`project-card project-card-${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <div className="project-visual" aria-hidden="true">
        <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="visual-window">
          <div className="window-bar"><i /><i /><i /></div>
          <div className="visual-content">
            <span className="visual-kicker">{p.visualLabel}</span>
            <strong>{p.visualTitle}</strong>
            <div className="visual-lines"><i /><i /><i /></div>
            <div className="visual-pills"><i /><i /><i /></div>
          </div>
        </div>
      </div>
      <div className="project-body">
        <div className="card-meta">
          <span>{p.type}</span>
          <span className="project-index">PROJECT {String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3>{p.name}</h3>
        <p className="project-summary">{p.summary}</p>
        <h4>Selected contributions</h4>
        <ul className="highlights">
          {p.highlights.map((h) => <li key={h}>{h}</li>)}
        </ul>
        <div className="tags" aria-label="Technology stack">
          {p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}
        </div>
        <a className="project-link" href={p.url} target="_blank" rel="noreferrer">
          Explore live product <span aria-hidden="true">↗</span>
        </a>
      </div>
    </motion.article>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch { /* storage may be blocked */ }
  }, [theme]);

  const visible = projects.filter((p) => filter === "All" || p.categories.includes(filter));

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top" aria-label={`${profile.name}, home`}>{profile.name}<span>.</span></a>
          <nav aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#approach">Approach</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              {theme === "dark" ? "☼" : "☾"}
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        <div className="wrap">
          <motion.section className="hero" variants={group} initial="hidden" animate="show">
            <div className="hero-copy">
              <motion.div variants={rise} className="eyebrow"><span className="dot" /> SOFTWARE ENGINEER · CHENNAI, INDIA</motion.div>
              <motion.h1 variants={rise}>I build software that solves <em>real problems.</em></motion.h1>
              <motion.p variants={rise} className="lead">
                Full-stack engineer working across SaaS products, backend workflows and mobile experiences.
                I turn product requirements into practical features with TypeScript, APIs and data-driven systems.
              </motion.p>
              <motion.div variants={rise} className="actions">
                <a className="btn btn-primary" href="#work">Explore selected work <span aria-hidden="true">↘</span></a>
                <a className="btn" href={profile.resume} download>Download resume <span aria-hidden="true">↓</span></a>
              </motion.div>
              <motion.div variants={rise} className="hero-meta">
                <span>Backend & API development</span><span>Product engineering</span><span>Web & mobile</span>
              </motion.div>
            </div>
            <motion.aside variants={rise} className="hero-panel" aria-label="Engineering focus">
              <div className="panel-top"><span>ENGINEERING FOCUS</span><span className="panel-mark">CM/01</span></div>
              <div className="panel-main">
                <span className="panel-label">01 / BUILD</span>
                <strong>Useful product<br />experiences.</strong>
                <p>From user-facing workflows to the systems that support them.</p>
              </div>
              <div className="panel-bottom">
                <div><span>CORE STACK</span><strong>TypeScript · Node.js · SQL</strong></div>
                <div><span>WORKING ACROSS</span><strong>React · Angular · React Native</strong></div>
              </div>
            </motion.aside>
          </motion.section>

          <section className="proof-strip" aria-label="Areas of experience">
            <div><span>01</span><strong>Backend systems</strong><p>APIs, workflows and integrations</p></div>
            <div><span>02</span><strong>Business applications</strong><p>Multi-role SaaS product features</p></div>
            <div><span>03</span><strong>Web & mobile</strong><p>Interfaces across devices</p></div>
          </section>

          <section id="work" className="work-section">
            <div className="section-heading">
              <div><p className="eyebrow">SELECTED WORK / PRODUCT ENGINEERING</p><h2>Products, not just projects.</h2></div>
              <p className="section-intro">A selection of product work across rental management, community operations, digital identity and education.</p>
            </div>
            <div className="work-toolbar">
              <p>Explore by focus area</p>
              <div className="filters" role="group" aria-label="Filter projects">
                {FILTERS.map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
              </div>
            </div>
            <div className="project-grid">
              <AnimatePresence mode="popLayout">
                {visible.map((p) => <ProjectCard key={p.name} p={p} index={projects.indexOf(p)} />)}
              </AnimatePresence>
            </div>
            <p className="disclosure">Project summaries describe my contributions at a high level. Some products are employer-owned; implementation details and code are not reproduced here.</p>
          </section>

          <section id="approach" className="approach-section">
            <div className="section-heading">
              <div><p className="eyebrow">HOW I WORK</p><h2>Good engineering starts with the problem.</h2></div>
              <p className="section-intro">I aim to understand the user workflow first, then choose the simplest maintainable solution that meets it.</p>
            </div>
            <div className="approach-grid">
              <article><span>01 / UNDERSTAND</span><h3>Clarify the requirement</h3><p>Map the user journey, business rules, edge cases and access boundaries before changing code.</p></article>
              <article><span>02 / DESIGN</span><h3>Keep the solution focused</h3><p>Prefer clear responsibilities, reusable patterns and existing system conventions over unnecessary abstraction.</p></article>
              <article><span>03 / DELIVER</span><h3>Validate the behaviour</h3><p>Test important paths, permissions, failure states and responsive layouts—not only the happy path.</p></article>
            </div>
          </section>

          <section id="skills" className="skills-section">
            <div className="section-heading">
              <div><p className="eyebrow">TOOLS & TECHNOLOGIES</p><h2>The tools behind the work.</h2></div>
              <p className="section-intro">Grouped by the kind of work they support, rather than a wall of technology logos.</p>
            </div>
            <div className="skills">
              {skills.map((s) => <div className="skill-group" key={s.group}><h3>{s.group}</h3><p>{s.items.join(" · ")}</p></div>)}
            </div>
          </section>

          <section id="about" className="about-section">
            <div className="about-label"><p className="eyebrow">A LITTLE ABOUT ME</p><span>CHENNAI, IN</span></div>
            <div className="about-copy">
              <h2>Curious about how products work—from the interface to the data behind it.</h2>
              <p>My path into software engineering began with a background in Mechatronics and a practical interest in building useful systems. Since then, I have worked across backend services, web applications and mobile experiences.</p>
              <p>I enjoy untangling business rules, understanding existing codebases and making features easier to use and maintain.</p>
            </div>
          </section>

          <section id="contact" className="contact-section">
            <p className="eyebrow">HAVE A ROLE OR A PROBLEM TO SOLVE?</p>
            <div className="contact-layout">
              <h2>Let's build something<br /><em>useful.</em></h2>
              <div className="contact-details">
                <p>I’m interested in backend and full-stack software engineering opportunities where I can contribute to real product work and keep growing as an engineer.</p>
                <a className="contact-mail" href={`mailto:${profile.email}`}>{profile.email} <span aria-hidden="true">↗</span></a>
                <div className="contact-links">
                  <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
                  <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
                  <a href={profile.resume} download>Resume ↓</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="footer"><div className="wrap"><span>© {new Date().getFullYear()} {profile.name}</span><span>Designed with clarity. Built with React + TypeScript.</span><a href="#top">Back to top ↑</a></div></footer>
    </>
  );
}
