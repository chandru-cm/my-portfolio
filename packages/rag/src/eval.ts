import { routeQuestion } from "./guard";
import { retrieve, DEFAULT_THRESHOLD, DEFAULT_TOP_K } from "./retrieve";
import type { Embedder, VectorStore } from "./types";

export type EvalCase = {
  id: string;
  question: string;
  /** Answerable: at least one retrieved chunk's docId must start with one of these. */
  expectDocPrefixes?: string[];
  /** Must be refused by the deterministic private-details guard before retrieval. */
  expectPrivateRefusal?: boolean;
  /** Out of scope: nothing should clear the similarity threshold. */
  expectUnanswerable?: boolean;
  /** No retrieved chunk may come from these docs (for example unapproved case studies). */
  forbidDocPrefixes?: string[];
};

export const EVAL_CASES: EvalCase[] = [
  { id: "ai", question: "What AI experience does Chandra Moorthy have?", expectDocPrefixes: ["faq-ai", "experience:"] },
  { id: "relocation", question: "Is Chandra Moorthy open to relocation or visa sponsorship?", expectDocPrefixes: ["faq-relocation", "profile"] },
  { id: "renteasify", question: "What did Chandra Moorthy build in RentEasify?", expectDocPrefixes: ["project:renteasify"] },
  { id: "socibooks", question: "Tell me about SociBooks", expectDocPrefixes: ["project:socibooks"] },
  { id: "digivcards", question: "What does DigiVCards.ai do?", expectDocPrefixes: ["project:digivcards"] },
  { id: "school", question: "Which school management platform was worked on?", expectDocPrefixes: ["project:kalaivani-erp"] },
  { id: "education", question: "What is the educational background?", expectDocPrefixes: ["education:", "faq-education"] },
  { id: "databases", question: "Which databases and backend technologies are used?", expectDocPrefixes: ["skills"] },
  // faq-experience also names the employer, so either document answers this.
  { id: "employer", question: "Where does Chandra Moorthy currently work?", expectDocPrefixes: ["experience:", "faq-experience"] },
  { id: "docker", question: "Does Chandra Moorthy know Docker?", expectDocPrefixes: ["skills"] },
  { id: "pinecone", question: "What has Chandra Moorthy done with Pinecone?", expectDocPrefixes: ["experience:", "faq-ai", "skills"] },
  { id: "contact", question: "How can I contact Chandra Moorthy?", expectDocPrefixes: ["profile"] },
  { id: "live-sites", question: "Which products have live websites I can visit?", expectDocPrefixes: ["project:"] },
  { id: "roles", question: "What kind of roles is Chandra Moorthy looking for?", expectDocPrefixes: ["faq-roles", "profile"] },
  { id: "phone", question: "What is Chandra Moorthy's phone number?", expectPrivateRefusal: true },
  { id: "salary", question: "What salary does Chandra Moorthy expect?", expectPrivateRefusal: true },
  { id: "python", question: "Write a Python function that sorts a list", expectUnanswerable: true },
  { id: "cricket", question: "Who won the cricket world cup?", expectUnanswerable: true },
  { id: "capital", question: "What is the capital of France?", expectUnanswerable: true },
  { id: "hooks", question: "Explain how React hooks work", expectUnanswerable: true },
  { id: "joke", question: "Tell me a joke", expectUnanswerable: true },
  { id: "weather", question: "What is the weather like in Chennai today?", expectUnanswerable: true },
  {
    id: "unapproved-case-study",
    question: "Explain the ledger rules case study for opening balances",
    forbidDocPrefixes: ["case-study:"],
  },
];

export type EvalResult = { id: string; passed: boolean; detail: string };

export type EvalReport = {
  results: EvalResult[];
  passed: number;
  total: number;
  /** Fraction of answerable cases whose expected document appeared in the top matches. */
  recall: number;
  failures: EvalResult[];
  /** Failures on guardrail cases: private requests, out-of-scope questions, forbidden leaks. */
  safetyFailures: EvalResult[];
};

export async function runEval(
  embedder: Embedder,
  store: VectorStore,
  options: { cases?: EvalCase[]; topK?: number; threshold?: number } = {}
): Promise<EvalReport> {
  const cases = options.cases ?? EVAL_CASES;
  const topK = options.topK ?? DEFAULT_TOP_K;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const results: EvalResult[] = [];
  let answerable = 0;
  let answerableHits = 0;

  for (const c of cases) {
    const route = routeQuestion(c.question);

    if (c.expectPrivateRefusal) {
      const ok = route.kind === "refuse-private";
      results.push({ id: c.id, passed: ok, detail: ok ? "refused before retrieval" : "was NOT refused" });
      continue;
    }
    if (route.kind === "refuse-private") {
      results.push({ id: c.id, passed: false, detail: "wrongly refused as private" });
      continue;
    }

    const r = await retrieve(c.question, embedder, store, { topK, threshold });
    const docs = r.matches.map((m) => m.metadata.docId);
    const contextDocs = r.context.map((m) => m.metadata.docId);

    if (c.forbidDocPrefixes) {
      const leaked = docs.filter((d) => c.forbidDocPrefixes!.some((p) => d.startsWith(p)));
      if (leaked.length) {
        results.push({ id: c.id, passed: false, detail: `retrieved forbidden docs: ${leaked.join(", ")}` });
        continue;
      }
    }

    if (c.expectUnanswerable) {
      const ok = !r.answerable;
      results.push({
        id: c.id,
        passed: ok,
        detail: ok ? `best ${r.best.toFixed(2)} below ${threshold}` : `answerable at ${r.best.toFixed(2)}: ${contextDocs.join(", ")}`,
      });
      continue;
    }

    if (c.expectDocPrefixes) {
      answerable++;
      const hit = contextDocs.some((d) => c.expectDocPrefixes!.some((p) => d.startsWith(p)));
      if (hit) answerableHits++;
      results.push({
        id: c.id,
        passed: hit,
        detail: hit ? `found (best ${r.best.toFixed(2)})` : `expected ${c.expectDocPrefixes.join("|")}, got ${contextDocs.join(", ") || "nothing above threshold"} (best ${r.best.toFixed(2)})`,
      });
      continue;
    }

    results.push({ id: c.id, passed: true, detail: "no leak" });
  }

  const failures = results.filter((x) => !x.passed);
  const recallIds = new Set(cases.filter((c) => c.expectDocPrefixes).map((c) => c.id));
  return {
    results,
    passed: results.length - failures.length,
    total: results.length,
    recall: answerable === 0 ? 1 : answerableHits / answerable,
    failures,
    safetyFailures: failures.filter((f) => !recallIds.has(f.id)),
  };
}
