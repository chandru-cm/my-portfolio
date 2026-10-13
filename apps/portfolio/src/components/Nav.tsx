import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { profile } from "@my-portfolio/content";
import { useTheme } from "../hooks/useTheme";
import { scrollToId } from "../lib/scroll";

const LINKS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";

  /**
   * On the home page, scroll straight away instead of waiting for a router update, so the link
   * also works when the address already says the same section. Elsewhere, or with a modifier
   * key (open in new tab), the normal link behaviour applies.
   */
  function goTo(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!onHome || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
    navigate({ pathname: "/", hash: `#${id}` }, { replace: hash === `#${id}` });
  }

  // Close the mobile menu on navigation or Escape.
  useEffect(() => setOpen(false), [pathname, hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Highlight the section currently in view (home page only).
  useEffect(() => {
    if (!onHome) return setActive("");
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [onHome]);

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" to="/" aria-label={`${profile.name}, home`}>
          {profile.name}
          <span>.</span>
        </Link>
        <nav id="primary-nav" className={open ? "open" : ""} aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.id}
              to={{ pathname: "/", hash: `#${l.id}` }}
              className={active === l.id ? "on" : ""}
              onClick={(e) => goTo(e, l.id)}
              aria-current={active === l.id ? "location" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? "☼" : "☾"}
          </button>
          <button
            className="icon-btn burger"
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="primary-nav"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
