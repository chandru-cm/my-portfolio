import { caseStudies } from "./caseStudies";
import { education, experience } from "./experience";
import { faq } from "./faq";
import { profile } from "./profile";
import { projects } from "./projects";
import { skills } from "./skills";
import type { KnowledgeDocument } from "./types";

/**
 * Flattens the typed content into plain documents for the chatbot.
 * Pure and deterministic: ids are stable, so re-ingesting upserts and never duplicates.
 * Unapproved case studies are excluded so they cannot leak through the chatbot.
 */
export function toKnowledgeDocuments(): KnowledgeDocument[] {
  const docs: KnowledgeDocument[] = [];

  docs.push({
    id: "profile",
    source: "profile",
    title: "Profile",
    text: `${profile.name}. ${profile.headline}. Based in ${profile.location}. ${profile.summary} Open to relocation: ${
      profile.availability.relocation ? "yes" : "no"
    }. Open to visa sponsorship: ${profile.availability.visaSponsorship ? "yes" : "no"}.`,
  });

  for (const e of experience) {
    docs.push({
      id: `experience:${e.id}`,
      source: "experience",
      title: `${e.role} at ${e.company}`,
      text: `${e.role} at ${e.company}, ${e.location}, from ${e.start} to ${e.end ?? "present"}. ${e.highlights.join(" ")}`,
    });
  }

  for (const ed of education) {
    docs.push({
      id: `education:${ed.institution}`,
      source: "education",
      title: `${ed.degree} ${ed.field}`,
      text: `${ed.degree} in ${ed.field}, ${ed.institution}, ${ed.region}, ${ed.startYear} to ${ed.endYear}. CGPA ${ed.cgpa}.`,
    });
  }

  docs.push({
    id: "skills",
    source: "skills",
    title: "Skills",
    text: skills.map((s) => `${s.group}: ${s.items.join(", ")}.`).join(" "),
  });

  for (const p of projects) {
    docs.push({
      id: `project:${p.id}`,
      source: "project",
      title: p.name,
      text: `${p.name}, ${p.type}. ${p.summary} Contributions: ${p.contributions.join(" ")} Stack: ${p.stack.join(", ")}. Live: ${p.liveUrls.join(", ")}.`,
    });
  }

  for (const c of caseStudies) {
    if (!c.approved) continue;
    docs.push({
      id: `case-study:${c.id}`,
      source: "case-study",
      title: c.title,
      text: `${c.title}. Problem: ${c.problem} What was built: ${c.built.join(" ")} Decisions: ${c.decisions.join(" ")} Flow: ${c.flow.join(", ")}.`,
    });
  }

  for (const f of faq) {
    docs.push({
      id: f.id,
      source: "faq",
      title: f.question,
      text: `${f.question} ${f.answer}`,
    });
  }

  return docs;
}
