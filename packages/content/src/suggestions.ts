import { profile } from "./profile";

export type Suggestion = { group: "hiring" | "project"; text: string };

const n = profile.name;

/**
 * Questions the chat offers a visitor. The widget draws a few at random, so two visits rarely look alike,
 * and a visitor is curious about the answer instead of seeing the same four standard questions.
 *
 * Rules for adding one:
 *  - Name the product or the person in the question, so the answer is easy to find.
 *  - It must be answerable from the approved content. apps/api/src/suggestions.test.ts checks that every
 *    question here finds matching content, so a suggestion can never end in "I don't know".
 */
export const suggestionPool: Suggestion[] = [
  { group: "hiring", text: `Is ${n} open to remote or relocation roles?` },
  { group: "hiring", text: `Which time zones can ${n} work with?` },
  { group: "hiring", text: `What kind of roles is ${n} looking for?` },
  { group: "hiring", text: `How much experience does ${n} have?` },
  { group: "project", text: "How does RentEasify rebuild lease balances from payment transactions?" },
  { group: "project", text: "How does SociBooks keep each society's books separate when all societies share one database?" },
  { group: "project", text: "How does a photo of a paper visiting card become a digital card in DigiVCards.ai?" },
  { group: "project", text: "How are rent payments split between owners in RentEasify?" },
  { group: "project", text: "How does a parent watch the school bus live in Kalaivani ERP?" },
  { group: "project", text: "What do the background jobs in RentEasify do?" },
  { group: "project", text: "How does expense approval by committee vote work in SociBooks?" },
  { group: "project", text: "How does the 30-day free trial and billing work in DigiVCards.ai?" },
  { group: "project", text: `What AI features has ${n} built?` },
  { group: "project", text: `What did ${n} build in RentEasify, the rental management product?` },
];
