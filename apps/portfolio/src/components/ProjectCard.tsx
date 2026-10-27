import { Link } from "react-router-dom";
import type { Project } from "@my-portfolio/content";
import Carousel from "./Carousel";
import { hostOf } from "../lib/site";

export default function ProjectCard({ project: p }: { project: Project }) {
  const meta = [
    ["Role", p.role],
    ["Period", p.period],
    ["Team", p.team],
  ].filter(([, v]) => v);
  const first = p.links?.[0];
  return (
    <article className="card project-card">
      <Carousel images={p.images} fallback={p.name} />
      <div className="card-b">
        <div className="card-top">
          <div>
            <h3>
              <Link to={`/projects/${p.id}`}>{p.name}</Link>
            </h3>
            <p className="type">{p.type}</p>
          </div>
          <span className="live">Live</span>
        </div>
        <p className="d">{p.summary}</p>
        {meta.length > 0 && (
          <div className="meta">
            {meta.map(([k, v]) => (
              <span key={k}>
                <b>{k}</b> {v}
              </span>
            ))}
          </div>
        )}
        {p.cardPoints?.length ? (
          <ul className="points">
            {p.cardPoints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : null}
        <ul className="tags" aria-label="Technology stack">
          {p.stack.slice(0, 6).map((s) => (
            <li className="tag" key={s}>
              {s}
            </li>
          ))}
          {p.stack.length > 6 && <li className="tag">+{p.stack.length - 6}</li>}
        </ul>
        <div className="card-f">
          <Link to={`/projects/${p.id}`}>
            Read case study <span className="arrow" aria-hidden="true">→</span>
          </Link>
          {first && (
            <a href={first.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name}, ${hostOf(first.url)} (opens in a new tab)`}>
              {first.label} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
