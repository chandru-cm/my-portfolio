import { education, experience } from "./experience";
import { profile } from "./profile";
import { projects } from "./projects";
import { skills } from "./skills";

export type Resume = {
  name: string;
  headline: string;
  /** Public contact details only. The phone number is deliberately never part of this. */
  contact: string[];
  summary: string;
  experience: { title: string; company: string; dates: string; location: string; bullets: string[] }[];
  projects: { name: string; type: string; myPart: string; bullets: string[]; links: string[] }[];
  skills: { label: string; items: string[] }[];
  education: { degree: string; school: string; dates: string; note: string }[];
};

function month(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * The resume as plain structured data, built from the same content as the website and the chatbot,
 * so all three always agree. A PDF is rendered from this by scripts/resume.ts.
 */
export function toResume(): Resume {
  const available = [
    profile.availability.relocation ? "Open to relocation" : "",
    profile.availability.visaSponsorship ? "visa sponsorship needed" : "",
  ].filter(Boolean);

  return {
    name: profile.name,
    headline: profile.headline,
    contact: [profile.email, profile.location, profile.linkedin, profile.github],
    summary: `${profile.summary} ${available.join(", ")}.`.replace(/\.\./g, "."),
    experience: experience.map((e) => ({
      title: e.role,
      company: e.company,
      dates: `${month(e.start)} to ${e.end ? month(e.end) : "present"}`,
      location: e.location,
      bullets: e.highlights,
    })),
    projects: projects.map((p) => ({
      name: p.name,
      type: p.type,
      myPart: p.myPart,
      bullets: p.contributions.slice(0, 2),
      links: p.liveUrls.slice(0, 2),
    })),
    skills: skills.map((s) => ({ label: s.group, items: s.items.map((i) => i.name) })),
    education: education.map((e) => ({
      degree: `${e.degree}, ${e.field}`,
      school: `${e.institution}, ${e.region}`,
      dates: `${e.startYear} to ${e.endYear}`,
      note: `CGPA ${e.cgpa}`,
    })),
  };
}
