import { Link } from "react-router-dom";
import type { Project } from "@my-portfolio/content";

type Props = { project: Project; index: number };

export default function ProjectCard({ project, index }: Props) {
  return (
    <Link className="card project-card" to={`/work/${project.id}`}>
      <span className="k">
        {String(index + 1).padStart(2, "0")} · {project.type}
      </span>
      <h3>{project.name}</h3>
      <p className="muted">{project.summary}</p>
      <ul className="tags" aria-label="Technology stack">
        {project.stack.slice(0, 5).map((s) => (
          <li className="tag" key={s}>
            {s}
          </li>
        ))}
      </ul>
      <span className="go">
        View project <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
