import type { SkillGroup } from "./types";

export const skills: SkillGroup[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL", "HTML5", "CSS3"] },
  { group: "Backend and APIs", items: ["Node.js", "Express.js", "FastAPI", "REST APIs", "WebSockets", "Swagger", "Postman"] },
  { group: "Frontend and mobile", items: ["React", "Next.js", "Angular", "React Native", "Expo"] },
  { group: "Databases and backend services", items: ["PostgreSQL", "Firebase", "Firebase Firestore (NoSQL)"] },
  { group: "AI and search", items: ["Google Vertex AI", "Gemini API", "Generative AI", "Pinecone", "Vector search"] },
  { group: "DevOps and tools", items: ["Git", "Docker", "CI/CD"] },
  { group: "Practices", items: ["Multi-tenant architecture", "Role-based access control (RBAC)", "Payment integration", "Code review", "Debugging"] },
];
