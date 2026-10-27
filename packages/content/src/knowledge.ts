import { caseStudies } from "./caseStudies";
import { education, experience } from "./experience";
import { faq } from "./faq";
import { profile } from "./profile";
import { projects } from "./projects";
import { LEVEL_LABEL, skills } from "./skills";
import type { KnowledgeDocument, Project } from "./types";

/**
 * Flattens the typed content into plain documents for the chatbot.
 * Pure and deterministic: ids are stable, so re-ingesting upserts and never duplicates.
 * Unapproved case studies are excluded so they cannot leak through the chatbot.
 */
function projectText(p: Project): string {
  const parts = [
    `${p.name}, ${p.type}, a product ${profile.name} worked on. ${p.summary}`,
    p.role && `Role: ${p.role}.`,
    p.period && `Period: ${p.period}.`,
    p.team && `Team: ${p.team}.`,
    p.platform && `Platforms: ${p.platform}.`,
    p.overview,
    p.problem && `Problem: ${p.problem}`,
    `Their part: ${p.myPart} Contributions: ${p.contributions.join(" ")}`,
    p.features?.length && `Features: ${p.features.map((f) => `${f.title}: ${f.text}${f.how ? ` How: ${f.how}` : ""}`).join(" ")}`,
    p.architecture && `Architecture: ${p.architecture.layers.map(([a, b]) => `${a}: ${b}`).join("; ")}. ${(p.architecture.notes ?? []).join(" ")}`,
    p.challenges?.length && `Challenges: ${p.challenges.map((c) => `${c.title}. Problem: ${c.problem} Approach: ${c.approach}${c.result ? ` Result: ${c.result}` : ""}`).join(" ")}`,
    p.results?.length && `Numbers: ${p.results.map((r) => `${r.value} ${r.label}`).join(", ")}.`,
    p.learned,
    `Stack: ${p.stack.join(", ")}. Live: ${p.liveUrls.join(", ")}.`,
  ];
  return parts.filter(Boolean).join(" ");
}

export function toKnowledgeDocuments(): KnowledgeDocument[] {
  const docs: KnowledgeDocument[] = [];

  docs.push({
    id: "profile",
    source: "profile",
    title: "Profile",
    text: `${profile.name}. ${profile.headline}. Based in ${profile.location}. ${profile.summary} Open to relocation: ${profile.availability.relocation ? "yes, abroad" : "no"}. Needs visa sponsorship: ${profile.availability.visaSponsorship ? "yes" : "no"}. Looking for: ${profile.availability.lookingFor}. Work setup: ${profile.availability.workSetup}. Time zone ${profile.timezone}, working hours ${profile.workingHours}. Replies within ${profile.replyTime}.`,
  });

  for (const e of experience) {
    docs.push({
      id: `experience:${e.id}`,
      source: "experience",
      title: `${e.role} at ${e.company}`,
      text: `${profile.name}'s work experience: ${e.role} at ${e.company}, ${e.location}, from ${e.start} to ${e.end ?? "present"}. ${e.highlights.join(" ")}`,
    });
  }

  for (const ed of education) {
    docs.push({
      id: `education:${ed.institution}`,
      source: "education",
      title: `${ed.degree} ${ed.field}`,
      text: `${profile.name}'s education: ${ed.degree} in ${ed.field}, ${ed.institution}, ${ed.region}, ${ed.startYear} to ${ed.endYear}. CGPA ${ed.cgpa}.`,
    });
  }

  docs.push({
    id: "skills",
    source: "skills",
    title: "Skills",
    text: `${profile.name}'s technical skills. ` + skills.map((s) => `${s.group}: ${s.items.map((i) => `${i.name} (${LEVEL_LABEL[i.level].toLowerCase()})`).join(", ")}.`).join(" "),
  });

  for (const p of projects) {
    docs.push({
      id: `project:${p.id}`,
      source: "project",
      title: p.name,
      text: projectText(p),
    });
  }

  for (const c of caseStudies) {
    if (!c.approved) continue;
    docs.push({
      id: `case-study:${c.id}`,
      source: "case-study",
      title: c.title,
      text: `${c.title}, a case study by ${profile.name}. Problem: ${c.problem} What was built: ${c.built.join(" ")} Decisions: ${c.decisions.join(" ")} Flow: ${c.flow.join(", ")}.`,
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
