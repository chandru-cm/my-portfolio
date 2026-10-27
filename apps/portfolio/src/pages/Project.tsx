import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { projects } from "@my-portfolio/content";
import Carousel from "../components/Carousel";
import Cta from "../components/Cta";
import FlowDiagram from "../components/FlowDiagram";
import { caseStudyFor, hostOf } from "../lib/site";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import NotFound from "./NotFound";

type Section = { id: string; label: string; body: ReactNode };

/** Highlights the "On this page" entry for the section the reader is in. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(`cs-${id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.slice(3))),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

export default function Project() {
  const { id } = useParams();
  const index = projects.findIndex((p) => p.id === id);
  const p = projects[index];
  const study = p ? caseStudyFor(p.id) : undefined;
  useDocumentTitle(p?.name, p?.summary);

  const sections: Section[] = [];
  if (p) {
    if (p.overview) sections.push({ id: "overview", label: "Overview", body: <p>{p.overview}</p> });
    if (p.problem) sections.push({ id: "problem", label: "The problem", body: <p>{p.problem}</p> });
    if (p.contributions.length)
      sections.push({
        id: "role",
        label: "My role",
        body: (
          <ul className="bul">
            {p.contributions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ),
      });
    if (p.features?.length)
      sections.push({
        id: "built",
        label: "What I built",
        body: (
          <div className="feats">
            {p.features.map((f) => (
              <div className="feat" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {f.how && (
                  <p className="how">
                    <b>How:</b> {f.how}
                  </p>
                )}
              </div>
            ))}
          </div>
        ),
      });
    if (p.architecture?.layers.length || p.architecture?.notes?.length)
      sections.push({
        id: "arch",
        label: "How it works",
        body: (
          <>
            {p.architecture.layers.length > 0 && (
              <div className="layers">
                {p.architecture.layers.map(([a, b]) => (
                  <div key={a}>
                    <b>{a}</b>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
            {p.architecture.notes?.length ? (
              <ul className="bul arch-notes">
                {p.architecture.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}
          </>
        ),
      });
    if (p.challenges?.length)
      sections.push({
        id: "challenges",
        label: "Challenges",
        body: (
          <div className="chal">
            {p.challenges.map((c) => (
              <article key={c.title}>
                <h3>{c.title}</h3>
                <dl>
                  <dt>Problem</dt>
                  <dd>{c.problem}</dd>
                  <dt>Approach</dt>
                  <dd>{c.approach}</dd>
                  {c.result && (
                    <>
                      <dt>Result</dt>
                      <dd>{c.result}</dd>
                    </>
                  )}
                </dl>
              </article>
            ))}
          </div>
        ),
      });
    if (p.results?.length)
      sections.push({
        id: "results",
        label: "By the numbers",
        body: (
          <>
            <div className="res">
              {p.results.map((r) => (
                <div key={r.label}>
                  <b>{r.value}</b>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
            <p className="res-note">Counted from the product's codebase unless noted.</p>
          </>
        ),
      });
    if (study)
      sections.push({
        id: "case",
        label: study.title,
        body: (
          <>
            {!study.approved && <p className="draft">Draft: visible in development only</p>}
            <p>{study.problem}</p>
            <ul className="bul">
              {study.built.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <ul className="bul">
              {study.decisions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <FlowDiagram steps={study.flow} />
          </>
        ),
      });
    if (p.learned) sections.push({ id: "learned", label: "What I learned", body: <p>{p.learned}</p> });
  }

  const active = useActiveSection(sections.map((s) => s.id));
  if (!p) return <NotFound />;
  const next = projects[(index + 1) % projects.length];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const meta = [
    ["Role", p.role],
    ["Period", p.period],
    ["Team", p.team],
    ["Platform", p.platform],
  ].filter(([, v]) => v);

  return (
    <article className="project-page">
      <div className="wrap cs-top">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link to={{ pathname: "/", hash: "#projects" }}>← All projects</Link>
          <span aria-hidden="true">/</span>
          <span>{p.name}</span>
        </nav>
      </div>
      <header className="wrap cs-head">
        <p className="lbl">{p.type}</p>
        <h1>{p.name}</h1>
        <p className="sum">{p.summary}</p>
        <dl className="cs-meta">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div>
            <dt>Status</dt>
            <dd>
              <span className="live">Live</span>
            </dd>
          </div>
        </dl>
        <ul className="tags cs-stack" aria-label="Technology stack">
          {p.stack.map((s) => (
            <li className="tag" key={s}>
              {s}
            </li>
          ))}
        </ul>
        {p.links?.length ? (
          <div className="cs-links">
            {p.links.map((l) => (
              <Cta kind="external" key={l.url} href={l.url} label={`${p.name}, ${l.label} (${hostOf(l.url)})`}>
                {l.label}
              </Cta>
            ))}
          </div>
        ) : null}
      </header>
      {p.images?.length ? (
        <div className="wrap cs-cover">
          <Carousel images={p.images} />
        </div>
      ) : null}
      <div className={`wrap cs-body${sections.length < 3 ? " solo" : ""}`}>
        {sections.length >= 3 && (
          <nav className="toc" aria-label="On this page">
            <p className="lbl">On this page</p>
            {sections.map((s) => (
              <a key={s.id} href={`#cs-${s.id}`} className={active === s.id ? "on" : ""} onClick={(e) => jump(e, s.id)}>
                {s.label}
              </a>
            ))}
          </nav>
        )}
        <div>
          {sections.map((s) => (
            <section className="cs-sec" id={`cs-${s.id}`} key={s.id}>
              <h2>{s.label}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
      <nav className="wrap pn" aria-label="More projects">
        <Link to={`/projects/${prev.id}`}>
          <small>← Previous project</small>
          <b>{prev.name}</b>
        </Link>
        <Link to={`/projects/${next.id}`} className="pn-next">
          <small>Next project →</small>
          <b>{next.name}</b>
        </Link>
      </nav>
    </article>
  );
}

/** In-page jump that does not touch the router, so the page does not reload or re-animate. */
function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.getElementById(`cs-${id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
