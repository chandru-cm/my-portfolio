import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scrollToId } from "../lib/scroll";

/**
 * Click handler for a link to a section of the home page. On the home page it scrolls straight away
 * (so it also works when the address already names that section) and keeps the address in step.
 * Elsewhere, or with a modifier key such as "open in a new tab", the normal link behaviour applies.
 */
export function useSectionLink(onNavigate?: () => void) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  return (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname !== "/" || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate?.();
    scrollToId(id);
    navigate({ pathname: "/", hash: `#${id}` }, { replace: hash === `#${id}` });
  };
}
