import { Link, useParams } from "react-router-dom";
import { projects } from "@my-portfolio/content";
import FlowDiagram from "../components/FlowDiagram";
import Reveal from "../components/Reveal";
import { caseStudyFor, hostOf } from "../lib/site";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import NotFound from "./NotFound";

export default function Project() {
  const { id } = useParams();
  const index = projects.findIndex((p) => p.id === id);
  const project = projects[index];
  const study = project ? caseStudyFor(project.id) : undefined;
  useDocumentTitle(project?.name);

  if (!project) return <NotFound />;
  const next = projects[(index + 1) % projects.length];

  return (
    <article className="section project-page">
      <div className="wrap narrow">
        <Link className="back" to={{ pathname: "/", hash: "#work" }}>
          ← All work
        </Link>
        <p className="k">{project.type}</p>
        <h1 className="page-title">{project.name}</h1>
        <p className="lead">{project.summary}</p>
        <p className="my-part my-part-lg">
          <b>My part:</b> {project.myPart}
        </p>
        <ul className="tags" aria-label="Technology stack">
          {project.stack.map((s) => (
            <li className="tag" key={s}>
              {s}
            </li>
          ))}
        </ul>
        <div className="actions">
          {project.liveUrls.map((u) => (
            <a className="btn" key={u} href={u} target="_blank" rel="noreferrer">
              {hostOf(u)} ↗
            </a>
          ))}
        </div>

        <Reveal>
          <h2>What I contributed</h2>
          <ul className="bullets">
            {project.contributions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Reveal>

        {study && (
          <Reveal>
            <section className="case">
              <p className="k">
                Case study{" "}
                {!study.approved && <span className="draft">Draft: visible in development only</span>}
              </p>
              <h2>{study.title}</h2>
              <h3>Problem</h3>
              <p className="muted">{study.problem}</p>
              <h3>What I built</h3>
              <ul className="bullets">
                {study.built.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <h3>Decisions</h3>
              <ul className="bullets">
                {study.decisions.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <h3>How it flows</h3>
              <FlowDiagram steps={study.flow} />
            </section>
          </Reveal>
        )}

        <nav className="next" aria-label="More projects">
          <Link to={`/work/${next.id}`}>
            Next project: {next.name} <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </article>
  );
}
