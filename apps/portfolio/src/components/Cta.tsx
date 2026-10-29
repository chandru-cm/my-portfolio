import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSectionLink } from "../hooks/useSectionLink";
import { focusContactForm } from "../lib/scroll";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "link";

type Props = { variant?: Variant; children: ReactNode; className?: string; icon?: IconName } & (
  /** Scroll to a section of the home page, from any page. `focusForm` also puts the cursor in the contact form. */
  | { kind: "section"; to: string; focusForm?: boolean }
  /** Go to another page of this site. */
  | { kind: "page"; to: string }
  /** Open another website in a new tab. `label` is the accessible name, for example "LinkedIn profile". */
  | { kind: "external"; href: string; label: string }
  | { kind: "download"; href: string; fileName: string }
  /** `hint` is the line shown when no mail app seems to have opened; false turns it off. */
  | { kind: "mail"; email: string; hint?: string | false }
  | { kind: "action"; onClick: () => void }
);

const CLASS: Record<Variant, string> = { primary: "btn btn-primary", secondary: "btn", link: "btn-link" };

const MAIL_HINT = "Nothing opened? Use the form below.";

/**
 * Shows every label in one grid cell and hides all but the active one, so the button keeps the width
 * of its longest label and nothing around it shifts when the label changes.
 */
function Swap({ labels, active }: { labels: ReactNode[]; active: number }) {
  return (
    <span className="cta-swap">
      {labels.map((label, i) => (
        <span key={i} data-on={i === active}>
          {label}
        </span>
      ))}
    </span>
  );
}

/** Download link that confirms on the button itself: Downloading, then Downloaded, then back. */
function DownloadCta({ cls, href, fileName, children }: { cls: string; href: string; fileName: string; children: ReactNode }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function onClick() {
    if (phase !== 0) return; // the download itself still happens on every click
    setPhase(1);
    timers.current = [window.setTimeout(() => setPhase(2), 900), window.setTimeout(() => setPhase(0), 3000)];
  }

  return (
    <>
      <a className={phase === 2 ? `${cls} cta-done` : cls} href={href} download={fileName} onClick={onClick}>
        <Icon name={phase === 0 ? "download" : phase === 1 ? "spinner" : "check"} />
        <Swap labels={[children, "Downloading…", "Downloaded"]} active={phase} />
      </a>
      <span className="sr-only" role="status">
        {phase === 1 ? "Downloading" : phase === 2 ? "Download complete" : ""}
      </span>
    </>
  );
}

/**
 * Opens the visitor's mail app. A page cannot tell whether one exists, so if the window never loses focus
 * (which is what a mail app opening does), a hint points to the contact form instead.
 */
function MailCta({
  cls,
  email,
  hint,
  icon,
  children,
}: {
  cls: string;
  email: string;
  hint: string | false;
  icon?: IconName;
  children: ReactNode;
}) {
  const [opening, setOpening] = useState(false);
  const [noApp, setNoApp] = useState(false);
  const timers = useRef<number[]>([]);
  const stop = useRef<() => void>();
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stop.current?.();
    },
    [],
  );

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // The mailto: address is put together only when the link is used, so it is never sitting in the
    // page markup for a scraper to collect.
    e.preventDefault();
    timers.current.forEach(clearTimeout);
    stop.current?.();
    setOpening(true);
    setNoApp(false);

    let left = false;
    const mark = () => {
      left = true;
    };
    window.addEventListener("blur", mark);
    document.addEventListener("visibilitychange", mark);
    stop.current = () => {
      window.removeEventListener("blur", mark);
      document.removeEventListener("visibilitychange", mark);
    };
    timers.current = [
      window.setTimeout(() => setOpening(false), 1500),
      window.setTimeout(() => {
        stop.current?.();
        if (!left && hint !== false) setNoApp(true);
      }, 4000),
      window.setTimeout(() => setNoApp(false), 12000),
    ];
    window.location.href = `mailto:${email}`;
  }

  return (
    <>
      <a className={cls} href="#contact" onClick={onClick}>
        {opening ? <Icon name="spinner" /> : icon ? <Icon name={icon} /> : null}
        <Swap labels={[children, "Opening your mail app…"]} active={opening ? 1 : 0} />
      </a>
      <span className="sr-only" role="status">
        {opening ? "Opening your mail app" : noApp && hint !== false ? hint : ""}
      </span>
      {noApp && hint !== false && <span className="cta-hint">{hint}</span>}
    </>
  );
}

/**
 * Every call-to-action on the site goes through this one component, so a label, a redirect and its
 * accessibility behave the same everywhere:
 *  - primary: the one main action of a block; secondary: supporting actions; link: quiet text links
 *  - external links always open in a new tab, say so to screen readers, and never leak the opener
 *  - section links scroll in place, even when the address already names that section
 *  - download and mail buttons confirm on the button itself, with no pop-up
 */
export default function Cta(props: Props) {
  const { variant = "secondary", children, className, icon } = props;
  const cls = [CLASS[variant], className].filter(Boolean).join(" ");
  const section = useSectionLink();
  const lead = icon ? <Icon name={icon} /> : null;

  switch (props.kind) {
    case "section":
      return (
        <Link
          className={cls}
          to={{ pathname: "/", hash: `#${props.to}` }}
          onClick={(e) => {
            section(e, props.to);
            if (props.focusForm) focusContactForm();
          }}
        >
          {lead}
          {children}
        </Link>
      );
    case "page":
      return (
        <Link className={cls} to={props.to}>
          {lead}
          {children}
        </Link>
      );
    case "external":
      return (
        <a className={cls} href={props.href} target="_blank" rel="noopener noreferrer" aria-label={`${props.label} (opens in a new tab)`}>
          {lead}
          {children} <span aria-hidden="true">↗</span>
        </a>
      );
    case "download":
      return (
        <DownloadCta cls={cls} href={props.href} fileName={props.fileName}>
          {children}
        </DownloadCta>
      );
    case "mail":
      return (
        <MailCta cls={cls} email={props.email} hint={props.hint ?? MAIL_HINT} icon={icon}>
          {children}
        </MailCta>
      );
    case "action":
      return (
        <button className={cls} type="button" onClick={props.onClick}>
          {lead}
          {children}
        </button>
      );
  }
}
