import { profile } from "@my-portfolio/content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          {" · "}
          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {" · "}
          <a href={`mailto:${profile.email}`}>Email</a>
        </span>
        <button className="to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
