import { profile } from "@my-portfolio/content";
import { scrollToTop } from "../lib/scroll";
import { SITE_UPDATED, SITE_VERSION } from "../lib/site";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>
          © {new Date().getFullYear()} {profile.name} · <span className="ver">{SITE_VERSION}</span> updated {SITE_UPDATED}
        </span>
        <button className="to-top" type="button" onClick={scrollToTop}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
