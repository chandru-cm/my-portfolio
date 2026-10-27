import type { Project, Skill, SkillGroup } from "./types";

// Grouped by area. `level` is the owner's judgement: lower an item if you could not answer three
// questions about it. `countFrom` ties an item to project stack tags, so the project counts shown
// on the site are computed, never typed.
export const skills: SkillGroup[] = [
  {
    group: "Backend",
    items: [
      { name: "Node.js", level: 3, countFrom: ["Node.js"] },
      { name: "TypeScript", level: 3, countFrom: ["TypeScript"] },
      { name: "Express", level: 3, countFrom: ["Express"] },
      { name: "Firebase Functions", level: 3, countFrom: ["Firebase Functions"] },
      { name: "REST APIs", level: 3 },
      { name: "Python", level: 1 },
      { name: "FastAPI", level: 1 },
    ],
  },
  {
    group: "Data",
    items: [
      { name: "PostgreSQL", level: 3, countFrom: ["PostgreSQL"] },
      { name: "Drizzle ORM", level: 2, countFrom: ["Drizzle ORM"] },
      { name: "Firestore", level: 3, countFrom: ["Firestore"] },
      { name: "Prisma", level: 2, countFrom: ["Prisma"] },
    ],
  },
  {
    group: "Mobile",
    items: [
      { name: "React Native / Expo", level: 3, countFrom: ["React Native", "Expo"] },
      { name: "Flutter", level: 3, countFrom: ["Flutter"] },
    ],
  },
  {
    group: "Frontend",
    items: [
      { name: "React", level: 3, countFrom: ["React"] },
      { name: "Angular", level: 3, countFrom: ["Angular"] },
      { name: "Tailwind CSS", level: 2 },
      { name: "Next.js", level: 1, countFrom: ["Next.js"] },
    ],
  },
  {
    group: "AI",
    items: [
      { name: "Google Gemini", level: 2, countFrom: ["Gemini"] },
    ],
  },
  {
    group: "Payments",
    items: [
      { name: "Razorpay", level: 3, countFrom: ["Razorpay"] },
      { name: "Webhooks and reconciliation", level: 2 },
    ],
  },
  {
    group: "Patterns",
    items: [
      { name: "Multi-tenant architecture", level: 3 },
      { name: "RBAC", level: 3 },
      { name: "OTP authentication", level: 3 },
      { name: "CI/CD with GitHub Actions", level: 2 },
    ],
  },
];

export const LEVEL_LABEL = { 3: "Daily, in production", 2: "Shipped on real projects", 1: "Familiar" } as const;

/** How many of the given projects list this skill in their stack. Undefined when not tied to a stack tag. */
export function projectCount(skill: Skill, projects: Project[]): number | undefined {
  if (!skill.countFrom) return undefined;
  const tags = skill.countFrom.map((t) => t.toLowerCase());
  return projects.filter((p) => p.stack.some((s) => tags.includes(s.toLowerCase()))).length;
}
