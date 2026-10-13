import { profile } from "./profile";
import type { Faq } from "./types";

// Answers use only facts from the resume. Salary and private details are deliberately absent.
export const faq: Faq[] = [
  {
    id: "faq-relocation",
    question: "Is Chandra Moorthy open to relocation or visa sponsorship?",
    answer:
      "Yes. Chandra Moorthy is open to relocation and to visa sponsorship for backend or full-stack roles.",
  },
  {
    id: "faq-experience",
    question: "How much experience does Chandra Moorthy have?",
    answer:
      "About two years of professional experience. Chandra Moorthy has been a Full Stack Developer at Tamilarasi Technologies since October 2024, building production multi-tenant SaaS products.",
  },
  {
    id: "faq-ai",
    question: "What AI experience does Chandra Moorthy have?",
    answer:
      "Chandra Moorthy integrated Google Vertex AI and Gemini for generative content and context-aware features, using Pinecone vector search and WebSocket-based response streaming. Generative AI features appear in RentEasify and DigiVCards.ai.",
  },
  {
    id: "faq-contact",
    question: "How can I contact Chandra Moorthy?",
    answer: `Email Chandra Moorthy at ${profile.email}, or connect on LinkedIn (${profile.linkedin}) or GitHub (${profile.github}).`,
  },
  {
    id: "faq-roles",
    question: "What kind of roles is Chandra Moorthy looking for?",
    answer: "Backend or full-stack software engineering roles.",
  },
  {
    id: "faq-education",
    question: "What is Chandra Moorthy's educational background?",
    answer:
      "A B.E. in Mechatronics Engineering from Nehru Institute of Engineering and Technology, Tamil Nadu, completed in 2021.",
  },
];
