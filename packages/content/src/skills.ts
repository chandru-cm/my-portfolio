import type { SkillGroup } from "./types";

// Grouped by how deeply each is used, so a reader can see where the depth is. Tiers are the
// owner's judgement: move an item down a tier if you could not answer three questions about it.
export const skills: SkillGroup[] = [
  {
    group: "Daily, in production",
    items: ["TypeScript", "Node.js", "Express.js", "PostgreSQL", "Angular", "React", "React Native", "Firebase"],
  },
  {
    group: "Used on real projects",
    items: ["Google Vertex AI", "Gemini API", "Pinecone", "WebSockets", "Docker", "CI/CD"],
  },
  { group: "Familiar", items: ["Python", "FastAPI", "Next.js"] },
  {
    group: "What I build",
    items: ["Multi-tenant architecture", "Role-based access control (RBAC)", "Payment integration", "REST APIs"],
  },
];
