import type { Project } from "./types";

export const projects: Project[] = [
  {
    id: "renteasify",
    myPart: "Backend workflows for billing, leases and deposits, plus association finance and AI-written listings.",
    userRoles: ["Owners", "Managers", "Tenants", "Applicants", "Association users"],
    name: "RentEasify",
    type: "Rental management SaaS",
    summary:
      "Rental operations for property owners, managers and tenants, from billing and leases to payment collection.",
    contributions: [
      "Built API workflows for rent billing, property management, lease agreements and payment collection, including advance and security deposits and offline payment confirmation.",
      "Implemented role-specific workflows for owners, managers, tenants, applicants and association users.",
      "Contributed association finance features covering income, expenses, reports and member-level transactions.",
      "Integrated generative AI to produce property descriptions and rental content.",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "React", "Angular", "React Native", "Firebase", "Generative AI"],
    categories: ["Backend", "AI", "Mobile"],
    liveUrls: [
      "https://web.renteasify.com",
      "https://association.renteasify.com",
      "https://commercial.renteasify.com",
      "https://rwa.renteasify.com",
    ],
  },
  {
    id: "socibooks",
    myPart: "Member administration, role-based access control, and financial reporting.",
    name: "SociBooks",
    type: "Community association management SaaS",
    summary:
      "Tools for residential communities to manage members, day-to-day operations and financial reporting.",
    contributions: [
      "Developed member administration, income and expense tracking, and community project-planning workflows.",
      "Implemented role-based access control separating committee administration from resident permissions.",
      "Developed financial reporting: bank statement reconciliation, year-to-date dashboards, statement downloads and member-level financial visibility.",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "Angular", "Firebase"],
    categories: ["Backend"],
    liveUrls: ["https://committee.socibooks.com"],
  },
  {
    id: "digivcards",
    myPart: "Card sharing, lead tracking and analytics, AI content generation, and payments.",
    name: "DigiVCards.ai",
    type: "Digital visiting card SaaS",
    summary:
      "Shareable digital business cards with AI-assisted content, payments and lead analytics.",
    contributions: [
      "Developed digital visiting card features for business identity sharing, lead tracking and engagement analytics.",
      "Contributed AI-based card content generation, shareable card workflows, payment processing and mobile-first experiences.",
    ],
    stack: ["Node.js", "TypeScript", "Angular", "Firebase", "Payment gateway", "Generative AI"],
    categories: ["AI"],
    liveUrls: ["https://digivcards.ai"],
  },
  {
    id: "kalaivani-erp",
    myPart: "React Native features for parents, teachers and drivers, including live bus tracking.",
    name: "Kalaivani ERP",
    type: "School management platform",
    summary:
      "A multi-tenant school platform with connected mobile experiences for parents, teachers and drivers.",
    contributions: [
      "Contributed to a multi-tenant school management platform serving multiple client institutions, with Firebase (Firestore) as the database.",
      "Developed React Native features for parents, teachers and drivers, including live bus tracking for parents.",
      "Contributed parent-teacher discussions and messaging, school-wide notifications, attendance and payment tracking, frontend modules, API integration and mobile app migration.",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "Angular", "React Native", "Firebase"],
    categories: ["Mobile", "Backend"],
    liveUrls: ["https://web.kalaivani.in"],
  },
];
