import type { CaseStudy } from "./types";

// Drafts written from the owner's own working sessions. All are unapproved:
// they stay out of the site and the chatbot until `approved` is set to true.
export const caseStudies: CaseStudy[] = [
  {
    id: "renteasify-pagination",
    projectId: "renteasify",
    title: "Server-side pagination for list screens",
    approved: false,
    problem:
      "List endpoints returned entire tables, and the units screen sent one query per branch.",
    built: [
      "Paged SQL queries that fetch the count and one page of data in parallel, with filters applied in the database.",
      "A single query replacing the per-branch requests.",
      "A compact pager shared by web and mobile.",
    ],
    decisions: [
      "Used one pagination design for web and mobile instead of platform-specific versions.",
      "Traced a crash to a shared fetch helper that stripped the response wrapper and lost the totals; added a helper that returns the full response.",
    ],
    flow: ["Mobile app", "API route", "SQL count and page", "JSON data and total", "Pager UI"],
    reviewNotes:
      "Employer-owned work: needs company permission. No performance numbers were recorded, so none may be claimed. The tenants endpoint still slices in memory after filtering, so do not describe it as fully SQL-paginated.",
  },
  {
    id: "digivcards-admin-plan",
    projectId: "digivcards",
    title: "Admin app refactor: plan before code",
    approved: false,
    problem:
      "22 admin screens repeated the same patterns, and one screen had a critical defect.",
    built: [
      "Reviewed the admin architecture and wrote a 28-document refactor plan: one spec per screen, a shared-foundation spec and a master roadmap.",
      "Ordered the roadmap by dependency: critical fixes, shared hooks and API modules, backend utilities, component extraction, page refactors, type cleanup.",
    ],
    decisions: [
      "Work one phase per session, with one commit per task, so shared foundations are built once before any page is refactored.",
    ],
    flow: ["Critical fixes", "Shared hooks", "Backend utilities", "Components", "Page refactors"],
    reviewNotes:
      "The plan is the owner's work. Do not claim the full refactor shipped: execution progress is unverified.",
  },
  {
    id: "socibooks-ledger-rules",
    projectId: "socibooks",
    title: "Ledger rules for opening balances and advances",
    approved: false,
    problem:
      "Opening balances and advance payments need negative transaction amounts, which the original constraints rejected.",
    built: [
      "Relaxed the transaction constraints through reviewed SQL migrations.",
      "Added an opening-balance transaction kind.",
    ],
    decisions: [
      "Kept schema changes as explicit, reviewed migration files instead of relying on runtime workarounds.",
    ],
    flow: ["Opening balance", "Transaction rules", "Ledger", "Statements"],
    reviewNotes:
      "Unconfirmed whether the underlying product is SociBooks or a separate one. Do not publish until the owner confirms the product and that it is public.",
  },
];
