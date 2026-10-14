export type Category = "Backend" | "AI" | "Mobile";

export type Profile = {
  name: string;
  headline: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  summary: string;
  availability: {
    relocation: boolean;
    visaSponsorship: boolean;
  };
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  location: string;
  /** ISO year-month, for example "2024-10". */
  start: string;
  /** null means current role. */
  end: string | null;
  highlights: string[];
};

export type Education = {
  degree: string;
  field: string;
  institution: string;
  region: string;
  startYear: number;
  endYear: number;
  cgpa: string;
};

export type SkillGroup = {
  group: string;
  items: string[];
};

export type Project = {
  id: string;
  name: string;
  type: string;
  summary: string;
  /** One line on what the owner personally did, from the resume. Shown on cards and project pages. */
  myPart: string;
  /** User roles the product serves, when the resume names them. Source of the "5 roles" figure. */
  userRoles?: string[];
  contributions: string[];
  stack: string[];
  categories: Category[];
  /** Public live products only. */
  liveUrls: string[];
};

/**
 * Only case studies with `approved: true` are shown on the site and ingested into
 * the chatbot. Employer-owned work needs explicit approval before this is flipped.
 */
export type CaseStudy = {
  id: string;
  projectId: string;
  title: string;
  approved: boolean;
  problem: string;
  built: string[];
  decisions: string[];
  /** Ordered architecture flow, drawn as an animated diagram on the site. */
  flow: string[];
  /** Internal review notes. Never shown publicly. */
  reviewNotes: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type KnowledgeDocument = {
  id: string;
  source: "profile" | "experience" | "education" | "skills" | "project" | "case-study" | "faq";
  title: string;
  text: string;
};
