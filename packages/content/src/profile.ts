import type { Profile } from "./types";

// Phone number is intentionally not part of the public content.
export const profile: Profile = {
  name: "Chandra Moorthy",
  headline: "Full-stack engineer: the payments, permissions and AI behind multi-tenant SaaS",
  location: "Chennai, India",
  email: "cmchandru77@gmail.com",
  linkedin: "https://www.linkedin.com/in/chandra-moorthy-5a3156193",
  github: "https://github.com/chandru-cm",
  summary:
    "Software engineer with 2 years of experience building production multi-tenant SaaS platforms with Node.js, TypeScript and PostgreSQL, plus Angular, React, React Native and Firebase. Delivered REST APIs, role-based access control, payment workflows, financial reporting and generative AI features (Google Vertex AI, Gemini, Pinecone) across property management, community finance and education products.",
  availability: {
    relocation: true,
    visaSponsorship: true,
  },
};
