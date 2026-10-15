import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { profile } from "@my-portfolio/content";
import ThemeToggle from "./ThemeToggle";
import { useSectionLink } from "../hooks/useSectionLink";

const LINKS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { pathname, hash } = useLocation();
  const onHome = pathname === "/";
  const goTo = useSectionLink(() => setOpen(false));

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
          <ThemeToggle />
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
