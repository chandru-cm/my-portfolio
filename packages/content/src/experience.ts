import type { Education, Experience } from "./types";

export const experience: Experience[] = [
  {
    id: "tamilarasi-full-stack",
    role: "Full Stack Developer",
    company: "Tamilarasi Technologies Pvt Ltd",
    location: "Chennai, India",
    start: "2024-10",
    end: null,
    highlights: [
      "Design, build and maintain production SaaS applications end to end: Node.js and TypeScript APIs, Angular and React front ends, PostgreSQL and Firestore data models, third-party integrations and deployment workflows.",
      "Integrated Google Vertex AI and Gemini for generative content and context-aware features, using Pinecone vector search and WebSocket-based response streaming.",
      "Investigate production defects by tracing logs and code, validate fixes against existing business logic, and own assigned features across application layers.",
    ],
  },
];

export const education: Education[] = [
  {
    degree: "Bachelor of Engineering (B.E.)",
    field: "Mechatronics Engineering",
    institution: "Nehru Institute of Engineering and Technology",
    region: "Tamil Nadu, India",
    startYear: 2017,
    endYear: 2021,
    cgpa: "7.25 / 10",
  },
];
