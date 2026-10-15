import { profile } from "@my-portfolio/content";
import { scrollToTop } from "../lib/scroll";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${profile.name} on LinkedIn (opens in a new tab)`}>
            LinkedIn
          </a>
          {" · "}
          <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label={`${profile.name} on GitHub (opens in a new tab)`}>
            GitHub
          </a>
          {" · "}
          <a href={`mailto:${profile.email}`}>Email</a>
        </span>
        <button className="to-top" type="button" onClick={scrollToTop}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
