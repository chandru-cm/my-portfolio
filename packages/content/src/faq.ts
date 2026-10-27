import { profile } from "./profile";
import type { Faq } from "./types";

// Answers use only facts from the resume. Salary and private details are deliberately absent.
export const faq: Faq[] = [
  {
    id: "faq-relocation",
    question: "Is Chandra Moorthy open to relocation or visa sponsorship?",
    answer:
      "Yes. Chandra Moorthy is open to relocating abroad for the right role and will need visa sponsorship. Remote work is also an option.",
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
      "Chandra Moorthy builds generative AI features with Google Gemini: property descriptions and an AI advisor in RentEasify, and content writing, scanning paper visiting cards and a voice chat assistant in DigiVCards.ai.",
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
  {
    id: "faq-timezone",
    question: "Which time zones can Chandra Moorthy work with?",
    answer:
      "Chandra Moorthy is in Chennai, India (UTC+5:30) and works 10:00 to 19:00 IST. That covers the whole morning in Central Europe (about 5 to 6 hours with a 09:00 to 17:00 day) and 4 to 5 hours in the United Kingdom. Overlap with US Eastern time is at most about 30 minutes, in summer only.",
  },
  {
    id: "faq-products-live",
    question: "Which products has Chandra Moorthy worked on, and which are live?",
    answer:
      "Four live products: RentEasify (rental management), SociBooks (housing society accounting), DigiVCards.ai (digital business cards) and Kalaivani ERP (school management). Links: renteasify.com, socibooks.com, digivcards.ai and kalaivani.in.",
  },
  {
    id: "faq-renteasify",
    question: "What did Chandra Moorthy do on RentEasify?",
    answer:
      "Since March 2026 Chandra Moorthy has built much of the Expo association (RWA) app that replaces the legacy web app, features in the commercial app (QR onboarding, branch payments, offline payment approval, House Rules AI), and backend services for leases, billing, KYC with DigiLocker and agreement e-sign. RentEasify has 7 front-end apps on one backend with 118 database tables.",
  },
  {
    id: "faq-digivcards",
    question: "What did Chandra Moorthy do on DigiVCards.ai?",
    answer:
      "From June 2025 to August 2026 Chandra Moorthy built features in the Flutter app and then the Expo app that replaced it (public card, who viewed my card, members, OTP resend, paywall and pricing), added AI scanning of a paper visiting card and AI content suggestions, and redesigned the admin console (users, cards, billing, notifications hub, feature flags, roles) with page and page-size pagination.",
  },
  {
    id: "faq-socibooks",
    question: "What did Chandra Moorthy do on SociBooks?",
    answer:
      "In June and July 2026 Chandra Moorthy moved the API to Prisma and built income, payment and expense modules (including committee-vote expense approval), statement of account and invoice PDFs, invoice templates, opening balances, the financial report and account ledger, and owner-facing screens such as the association switcher.",
  },
  {
    id: "faq-kalaivani",
    question: "What did Chandra Moorthy do on Kalaivani ERP?",
    answer:
      "From January to March 2026 Chandra Moorthy worked mainly on the school admin Flutter app: dashboard and setup screens, splitting the app into admin and public versions with role-based access, shared change-school sign-in across all four apps, transport screens (bus and driver assignment, student allocation) and demo seed data.",
  },
  {
    id: "faq-payments",
    question: "What payments experience does Chandra Moorthy have?",
    answer:
      "Razorpay payment flows in DigiVCards.ai (per-card billing, a 30-day trial before billing, a catalog-driven price list, payment fixes) and signature-verified Razorpay webhooks on the SociBooks API, plus rent billing, deposit and offline payment confirmation workflows in RentEasify.",
  },
  {
    id: "faq-multitenancy",
    question: "Has Chandra Moorthy built multi-tenant systems?",
    answer:
      "Yes. SociBooks shares one PostgreSQL database across societies: every request names an association and middleware checks the user's active membership there. Kalaivani ERP keeps each school's data under its own Firestore path, and RentEasify serves owners, managers, tenants and association users with role-based workflows.",
  },
  {
    id: "faq-tech",
    question: "What is Chandra Moorthy's main technology stack?",
    answer:
      "TypeScript and Node.js with Express on Firebase Functions, PostgreSQL (Prisma) or Firestore for data, React Native with Expo and Flutter for mobile, React and Angular for web, Razorpay for payments and Google Gemini for AI features.",
  },
  {
    id: "faq-about",
    question: "Who is Chandra Moorthy? Tell me about you, about yourself.",
    answer:
      "Chandra Moorthy is a full-stack developer in Chennai, India, with about two years of professional experience since October 2024 at Tamilarasi Technologies. They build multi-tenant SaaS products end to end with Node.js, TypeScript, PostgreSQL or Firestore, React Native and Flutter, and have worked on four live products: RentEasify, SociBooks, DigiVCards.ai and Kalaivani ERP.",
  },
  {
    id: "faq-strengths",
    question: "What are Chandra Moorthy's strongest skills?",
    answer:
      "Node.js and TypeScript APIs, multi-tenant data access with role-based permissions, Razorpay payment flows, and mobile apps in React Native, Expo and Flutter. Chandra Moorthy also builds AI features with Google Gemini, such as scanning a paper visiting card into a digital card.",
  },
  {
    id: "faq-working-style",
    question: "How does Chandra Moorthy like to work?",
    answer:
      "Chandra Moorthy is open to on-site, hybrid or remote work and works IST 10:00 to 19:00. Email is the best way to reach them and replies come within 24 hours. On every product they have worked in a team of several engineers, owning features from the data model and API through to the mobile or web screen and deployment.",
  },
  {
    id: "faq-remote",
    question: "Can Chandra Moorthy work remotely with a team abroad?",
    answer:
      "Yes. Chandra Moorthy is based in Chennai (UTC+5:30). The working day covers the whole morning in Central Europe and most of the morning in the United Kingdom; overlap with US Eastern time is very limited. The time-zone table on the portfolio shows the overlap for today's date.",
  },
  {
    id: "faq-compensation",
    question: "What are Chandra Moorthy's salary or rate expectations?",
    answer:
      "Chandra Moorthy discusses compensation directly, because it depends on the role, scope, location and type of engagement. Send the role, your working style and your budget by email and expect a reply within 24 hours.",
  },
  {
    id: "faq-interview",
    question: "How can I schedule an interview or call with Chandra Moorthy?",
    answer:
      "Email Chandra Moorthy with the role, a few proposed times and your time zone. Working hours are IST 10:00 to 19:00 and replies come within 24 hours.",
  },
  {
    id: "faq-personal",
    question: "Can I ask Chandra Moorthy personal questions through this assistant?",
    answer:
      "This assistant covers professional topics only: projects, skills, experience, availability and ways of working. For anything personal or not covered here, email Chandra Moorthy directly.",
  },
  {
    id: "faq-assistant",
    question: "Who built this assistant, and what AI does it use? How do you work?",
    answer:
      "Chandra Moorthy built this assistant for the portfolio. It is an AI assistant that uses Google Gemini and a search index of the approved portfolio content. It answers only from the projects, skills, experience and availability on this site, does not store your questions, and says so when it does not know something.",
  },
];
