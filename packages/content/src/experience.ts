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
      "Build generative AI features on Google Vertex AI and Gemini, using Pinecone vector search for context-aware responses and WebSocket streaming to deliver them.",
      "Own features end to end across four production products: PostgreSQL and Firestore data models, Node.js and TypeScript APIs, Angular and React front ends, third-party integrations and deployment.",
      "Build the payment collection, role-based access control and financial reporting that the products depend on.",
      "Trace production defects through logs and code to the root cause, and validate each fix against existing business logic.",
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
