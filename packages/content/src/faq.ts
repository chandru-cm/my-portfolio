import type { Faq } from "./types";

// Answers use only facts from the resume. Salary and private details are deliberately absent.
export const faq: Faq[] = [
  {
    id: "faq-relocation",
    question: "Is Chandra open to relocation or visa sponsorship?",
    answer:
      "Yes. Chandra is open to relocation and to visa sponsorship for backend or full-stack roles.",
  },
  {
    id: "faq-experience",
    question: "How much experience does Chandra have?",
    answer:
      "About two years of professional experience. Chandra has been a Full Stack Developer at Tamilarasi Technologies since October 2024, building production multi-tenant SaaS products.",
  },
  {
    id: "faq-ai",
    question: "What AI experience does Chandra have?",
    answer:
      "Chandra integrated Google Vertex AI and Gemini for generative content and context-aware features, using Pinecone vector search and WebSocket-based response streaming. Generative AI features appear in RentEasify and DigiVCards.ai.",
  },
  {
    id: "faq-roles",
    question: "What kind of roles is Chandra looking for?",
    answer: "Backend or full-stack software engineering roles.",
  },
  {
    id: "faq-education",
    question: "What is Chandra's educational background?",
    answer:
      "A B.E. in Mechatronics Engineering from Nehru Institute of Engineering and Technology, Tamil Nadu, completed in 2021.",
  },
];
