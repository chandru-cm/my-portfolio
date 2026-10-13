import { caseStudies, type CaseStudy } from "@my-portfolio/content";

export const RESUME_URL = "/Chandra_Moorthy_Resume.pdf";
export const HAS_RESUME = __HAS_RESUME__;

/**
 * The chat widget is always on in development. In production it stays hidden until the API is
 * deployed and VITE_CHAT_ENABLED=true is set, so visitors never see a button that cannot work.
 */
export const CHAT_ENABLED = import.meta.env.DEV || import.meta.env.VITE_CHAT_ENABLED === "true";

/** Drafts are shown only while developing, so unapproved wording can never reach production. */
const SHOW_DRAFTS = import.meta.env.DEV;

export function caseStudyFor(projectId: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.projectId === projectId && (c.approved || SHOW_DRAFTS));
}

/** Whole years since an ISO "YYYY-MM" month, never negative. */
export function yearsSince(isoMonth: string, now = new Date()): number {
  const [y, m] = isoMonth.split("-").map(Number);
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.max(0, Math.floor(months / 12));
}

export function formatMonth(isoMonth: string): string {
  const [y, m] = isoMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
