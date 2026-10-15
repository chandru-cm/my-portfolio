import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSectionLink } from "../hooks/useSectionLink";

type Variant = "primary" | "secondary" | "link";

type Props = { variant?: Variant; children: ReactNode; className?: string } & (
  /** Scroll to a section of the home page, from any page. */
  | { kind: "section"; to: string }
  /** Go to another page of this site. */
  | { kind: "page"; to: string }
  /** Open another website in a new tab. `label` is the accessible name, for example "LinkedIn profile". */
  | { kind: "external"; href: string; label: string }
  | { kind: "download"; href: string; fileName: string }
  | { kind: "mail"; email: string }
  | { kind: "action"; onClick: () => void }
);

const CLASS: Record<Variant, string> = { primary: "btn btn-primary", secondary: "btn", link: "btn-link" };

/**
 * Every call-to-action on the site goes through this one component, so a label, a redirect and its
 * accessibility behave the same everywhere:
 *  - primary: the one main action of a block; secondary: supporting actions; link: quiet text links
 *  - external links always open in a new tab, say so to screen readers, and never leak the opener
 *  - section links scroll in place, even when the address already names that section
 */
export default function Cta(props: Props) {
  const { variant = "secondary", children, className } = props;
  const cls = [CLASS[variant], className].filter(Boolean).join(" ");
  const section = useSectionLink();

  switch (props.kind) {
    case "section":
      return (
        <Link className={cls} to={{ pathname: "/", hash: `#${props.to}` }} onClick={(e) => section(e, props.to)}>
          {children}
        </Link>
      );
    case "page":
      return (
        <Link className={cls} to={props.to}>
          {children}
        </Link>
      );
    case "external":
      return (
        <a className={cls} href={props.href} target="_blank" rel="noopener noreferrer" aria-label={`${props.label} (opens in a new tab)`}>
          {children} <span aria-hidden="true">↗</span>
        </a>
      );
    case "download":
      return (
        <a className={cls} href={props.href} download={props.fileName}>
          {children} <span aria-hidden="true">↓</span>
        </a>
      );
    case "mail":
      return (
        <a className={cls} href={`mailto:${props.email}`}>
          {children}
        </a>
      );
    case "action":
      return (
        <button className={cls} type="button" onClick={props.onClick}>
          {children}
        </button>
      );
  }
}
