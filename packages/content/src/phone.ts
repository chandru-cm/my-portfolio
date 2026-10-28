/**
 * Phone numbers for the contact form. The website and the API both import this file, so the form and the
 * server can never disagree about what a valid number is.
 *
 * This is deliberately small. It checks the shape of a number (country code plus 6 to 14 digits, 15 at most,
 * which is the international E.164 limit). It does not know each country's numbering plan, send a text, or
 * verify that the number exists: the number is only ever used to reach out, by WhatsApp or by phone, and a
 * wrong one is caught the first time it is used.
 */

export type Country = { iso: string; name: string; dial: string };

/** Countries a visitor is likely to call from. Sorted by name for the picker. */
export const countries: Country[] = [
  ["AR", "Argentina", "+54"], ["AU", "Australia", "+61"], ["AT", "Austria", "+43"], ["BH", "Bahrain", "+973"],
  ["BD", "Bangladesh", "+880"], ["BE", "Belgium", "+32"], ["BR", "Brazil", "+55"], ["CA", "Canada", "+1"],
  ["CL", "Chile", "+56"], ["CN", "China", "+86"], ["CO", "Colombia", "+57"], ["CZ", "Czechia", "+420"],
  ["DK", "Denmark", "+45"], ["EG", "Egypt", "+20"], ["FI", "Finland", "+358"], ["FR", "France", "+33"],
  ["DE", "Germany", "+49"], ["GR", "Greece", "+30"], ["HK", "Hong Kong", "+852"], ["HU", "Hungary", "+36"],
  ["IN", "India", "+91"], ["ID", "Indonesia", "+62"], ["IE", "Ireland", "+353"], ["IL", "Israel", "+972"],
  ["IT", "Italy", "+39"], ["JP", "Japan", "+81"], ["KE", "Kenya", "+254"], ["KW", "Kuwait", "+965"],
  ["MY", "Malaysia", "+60"], ["MX", "Mexico", "+52"], ["NP", "Nepal", "+977"], ["NL", "Netherlands", "+31"],
  ["NZ", "New Zealand", "+64"], ["NG", "Nigeria", "+234"], ["NO", "Norway", "+47"], ["OM", "Oman", "+968"],
  ["PK", "Pakistan", "+92"], ["PH", "Philippines", "+63"], ["PL", "Poland", "+48"], ["PT", "Portugal", "+351"],
  ["QA", "Qatar", "+974"], ["RO", "Romania", "+40"], ["RU", "Russia", "+7"], ["SA", "Saudi Arabia", "+966"],
  ["SG", "Singapore", "+65"], ["ZA", "South Africa", "+27"], ["KR", "South Korea", "+82"], ["ES", "Spain", "+34"],
  ["LK", "Sri Lanka", "+94"], ["SE", "Sweden", "+46"], ["CH", "Switzerland", "+41"], ["TW", "Taiwan", "+886"],
  ["TH", "Thailand", "+66"], ["TR", "Turkey", "+90"], ["UA", "Ukraine", "+380"], ["AE", "United Arab Emirates", "+971"],
  ["GB", "United Kingdom", "+44"], ["US", "United States", "+1"], ["VN", "Vietnam", "+84"],
].map(([iso, name, dial]) => ({ iso, name, dial }));

/** The country pre-selected in the phone picker. The site's owner is in India, so most messages come with +91. */
export const FALLBACK_COUNTRY = "IN";

/** "en-IN" becomes "IN". Returns undefined when the locale names no region. */
export function regionFromLocale(locale: string | undefined): string | undefined {
  const m = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(locale ?? "");
  return m ? m[1].toUpperCase() : undefined;
}

/** The country to pre-select: from the browser's languages when one names a known region, else the fallback. */
export function guessCountry(locales: readonly string[]): Country {
  for (const locale of locales) {
    const iso = regionFromLocale(locale);
    const hit = iso && countries.find((c) => c.iso === iso);
    if (hit) return hit;
  }
  return countries.find((c) => c.iso === FALLBACK_COUNTRY) as Country;
}

export type PhoneInput = { dial: string; number: string };
export type NormalizedPhone = {
  /** "+91" */
  dial: string;
  /** Digits only, without the country code or a leading trunk zero. */
  national: string;
  /** "+919876543210": what a dialler and WhatsApp want. */
  e164: string;
  /** "+91 9876543210": what a person reads. */
  display: string;
};

export type PhoneResult = { ok: true; phone: NormalizedPhone } | { ok: false; message: string };

const MIN_NATIONAL = 6;
const MAX_TOTAL = 15;
// Italy is the main case where the leading 0 is part of the number. Everywhere else it is a local dialling prefix.
const KEEPS_LEADING_ZERO = new Set(["+39"]);

export function normalizePhone(input: PhoneInput): PhoneResult {
  const dial = input.dial.trim();
  if (!/^\+\d{1,4}$/.test(dial)) return { ok: false, message: "Pick a country code for your phone number." };

  const raw = input.number.trim();
  if (!/^[\d\s().-]+$/.test(raw)) return { ok: false, message: "Use digits only in your phone number." };

  let national = raw.replace(/\D/g, "");
  if (!KEEPS_LEADING_ZERO.has(dial)) national = national.replace(/^0+/, "");
  if (national.length < MIN_NATIONAL || dial.length - 1 + national.length > MAX_TOTAL) {
    return { ok: false, message: "That phone number does not look right. Check the country code and the digits." };
  }
  return { ok: true, phone: { dial, national, e164: `${dial}${national}`, display: `${dial} ${national}` } };
}

/**
 * Countries that match what the visitor typed: the start of a name or of a word in it, an ISO code ("IN"),
 * or a dial code with or without the plus ("+91" or "91"). Best matches come first. An empty query returns everything.
 */
export function searchCountries(query: string, list: readonly Country[] = countries): Country[] {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  if (!q) return [...list];
  const rank = (c: Country): number => {
    const name = c.name.toLowerCase();
    const dial = c.dial.slice(1);
    if (name.startsWith(q)) return 0;
    if (c.iso.toLowerCase() === q) return 1;
    if (dial === q) return 2;
    if (name.split(/\s+/).some((w) => w.startsWith(q))) return 3;
    if (/^\d+$/.test(q) && dial.startsWith(q)) return 4;
    if (name.includes(q)) return 5;
    return -1;
  };
  return list
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name))
    .map((x) => x.c);
}

/** The few countries to show first: the visitor's own, then places most enquiries come from. */
export function suggestedCountries(guessIso: string, count = 6): Country[] {
  const out: Country[] = [];
  for (const iso of [guessIso, "IN", "US", "GB", "AE", "CA", "AU", "DE", "SG"]) {
    const c = countries.find((x) => x.iso === iso);
    if (c && !out.includes(c)) out.push(c);
    if (out.length >= count) break;
  }
  return out;
}
