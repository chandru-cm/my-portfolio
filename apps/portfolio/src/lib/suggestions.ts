import type { Suggestion } from "@my-portfolio/content";

/** Fisher-Yates on a copy. `rng` returns a number in [0, 1); it is a parameter so tests can control it. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `count` questions the visitor has not asked yet, in random order. When there are enough to choose from
 * it always includes one question for a hiring manager and one about a project, so the set is never all one kind.
 */
export function pickSuggestions(pool: readonly Suggestion[], asked: readonly string[], count: number, rng: () => number = Math.random): string[] {
  const done = new Set(asked.map((q) => q.trim().toLowerCase()));
  const fresh = shuffle(pool.filter((s) => !done.has(s.text.toLowerCase())), rng);
  const chosen: Suggestion[] = [];
  if (count >= 2) {
    for (const group of ["hiring", "project"] as const) {
      const first = fresh.find((s) => s.group === group);
      if (first) chosen.push(first);
    }
  }
  for (const s of fresh) {
    if (chosen.length >= count) break;
    if (!chosen.includes(s)) chosen.push(s);
  }
  return shuffle(chosen, rng).slice(0, count).map((s) => s.text);
}
