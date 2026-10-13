// Keep public-facing project descriptions accurate and non-confidential.
// Verify every contribution and technology before publishing.

export type Category = "Backend" | "AI" | "Mobile";

export type Project = {
  name: string;
  type: string;
  summary: string;
  highlights: string[];
  stack: string[];
  categories: Category[];
  url: string;
  visualLabel: string;
  visualTitle: string;
};

export const profile = {
  name: "Chandra Moorthy",
  location: "Chennai, India",
  email: "cmchandru77@gmail.com",
  linkedin: "https://www.linkedin.com/in/chandra-moorthy-5a3156193",
  github: "https://github.com/chandu-dev",
  // Add this PDF to public/ before publishing.
  resume: "/Chandra_Moorthy_Resume.pdf",
};

export const projects: Project[] = [
  {
    name: "RentEasify",
    type: "Rental management SaaS",
    summary: "Rental operations for property owners, managers and tenants—from billing and leases to payment collection.",
    visualLabel: "PROPERTY OPERATIONS",
    visualTitle: "Rent. Manage. Simplify.",
    highlights: [
      "Contributed to API workflows for rent billing, lease agreements, deposits and offline payment confirmation.",
      "Worked across role-specific experiences for owners, managers, tenants, applicants and association users.",
      "Contributed association finance features for income, expenses, reports and member-level transactions.",
      "Integrated generative AI for property descriptions and rental content.",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "React", "Angular", "React Native", "Firebase"],
    categories: ["Backend", "AI", "Mobile"],
    url: "https://web.renteasify.com",
  },
  {
    name: "SociBooks",
    type: "Community association SaaS",
    summary: "Tools for residential communities to manage members, day-to-day operations and financial reporting.",
    visualLabel: "COMMUNITY MANAGEMENT",
    visualTitle: "One place for operations.",
    highlights: [
      "Developed member administration, income and expense tracking, and community project planning.",
      "Implemented role-based access control separating committee administration from resident permissions.",
      "Contributed financial reporting features including bank reconciliation, year-to-date dashboards and downloadable statements.",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "Angular", "Firebase"],
    categories: ["Backend"],
    url: "https://committee.socibooks.com",
  },
  {
    name: "DigiVCards.ai",
    type: "Digital visiting card SaaS",
    summary: "Shareable digital business cards with AI-assisted content, payments and lead analytics.",
    visualLabel: "DIGITAL IDENTITY",
    visualTitle: "Make every connection count.",
    highlights: [
      "Developed digital card features for business identity sharing, lead tracking and engagement analytics.",
      "Contributed AI-assisted card content generation and shareable card workflows.",
      "Worked on payment processing and mobile-first experiences.",
    ],
    stack: ["Node.js", "TypeScript", "Angular", "Firebase", "Payment gateway"],
    categories: ["AI"],
    url: "https://digivcards.ai",
  },
  {
    name: "Kalaivani ERP",
    type: "School management platform",
    summary: "A school platform with connected mobile experiences for parents, teachers and drivers.",
    visualLabel: "SCHOOL OPERATIONS",
    visualTitle: "Connected school journeys.",
    highlights: [
      "Contributed to a multi-tenant platform serving multiple institutions, backed by Firestore.",
      "Developed React Native features for parents, teachers and drivers, including live bus tracking.",
      "Worked on parent-teacher messaging, school-wide notifications, attendance and payment tracking.",
    ],
    stack: ["Node.js", "TypeScript", "Angular", "React Native", "Firebase"],
    categories: ["Mobile", "Backend"],
    url: "https://web.kalaivani.in",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
  { group: "Backend and APIs", items: ["Node.js", "Express.js", "FastAPI", "REST APIs", "WebSockets", "Swagger"] },
  { group: "Frontend and mobile", items: ["React", "Next.js", "Angular", "React Native", "Expo"] },
  { group: "Data", items: ["PostgreSQL", "Firebase", "Firestore"] },
  { group: "AI and search", items: ["Google Vertex AI", "Gemini API", "Pinecone", "Vector search"] },
  { group: "Practices and tools", items: ["Multi-tenant systems", "Role-based access control", "Payment integration", "Docker", "Git", "CI/CD"] },
];
