export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scrolls a section to the top of the viewport (below the sticky nav, via scroll-padding). */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  return true;
}

/**
 * After "Get in touch" scrolls to the contact section: flash the form so the eye lands on it and, on
 * devices with a keyboard, put the cursor in its first field. Touch screens are left alone, because
 * focusing a field there would pop up the on-screen keyboard over the form.
 */
export function focusContactForm(): void {
  const reduced = prefersReducedMotion();
  window.setTimeout(() => {
    const form = document.querySelector<HTMLElement>(".contact .cform");
    if (!form) return;
    if (!window.matchMedia("(pointer: coarse)").matches) {
      form.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    }
    if (reduced) return;
    form.classList.remove("cform-flash");
    void form.offsetWidth; // restart the animation if it is already running
    form.classList.add("cform-flash");
    window.setTimeout(() => form.classList.remove("cform-flash"), 1400);
  }, reduced ? 0 : 550);
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
