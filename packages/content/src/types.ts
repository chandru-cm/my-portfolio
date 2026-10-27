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
    lookingFor: string;
    workSetup: string;
  };
  /** Shown in the contact block and used by the chatbot. */
  workingHours: string;
  /** The working day in UTC minutes after midnight, so overlap can be worked out for any date. */
  workDayUtc: { start: number; end: number };
  /** Regions shown in the time-zone block, as IANA time zone names. */
  overlapRegions: { region: string; timeZone: string }[];
  timezone: string;
  replyTime: string;
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

/** 3 = daily, in production; 2 = shipped on real projects; 1 = familiar. The owner's own judgement. */
export type SkillLevel = 1 | 2 | 3;

export type Skill = {
  name: string;
  level: SkillLevel;
  /** Stack tags that count as using this skill. When set, the site shows how many projects use it. */
  countFrom?: string[];
};

export type SkillGroup = {
  group: string;
  items: Skill[];
};

export type ProjectLink = { label: string; url: string };
export type ProjectImage = { src: string; alt: string };
export type Feature = { title: string; text: string; how?: string };
export type Challenge = { title: string; problem: string; approach: string; result?: string };
export type Architecture = { layers: [string, string][]; notes?: string[] };
export type Result = { value: string; label: string };

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

  // Case-study fields. Every one is optional: a section or header item with no data is not rendered.
  role?: string;
  period?: string;
  team?: string;
  platform?: string;
  /** Labelled public links, shown on the project page. */
  links?: ProjectLink[];
  /** Screenshots under public/media. */
  images?: ProjectImage[];
  /** Short bullets on the home card. */
  cardPoints?: string[];
  /** One line for the table view. */
  tableSummary?: string;
  overview?: string;
  problem?: string;
  features?: Feature[];
  architecture?: Architecture;
  challenges?: Challenge[];
  results?: Result[];
  learned?: string;
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
