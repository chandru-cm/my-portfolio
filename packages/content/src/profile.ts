import type { Profile } from "./types";

// Phone number is intentionally not part of the public content.
export const profile: Profile = {
  name: "Chandra Moorthy",
  headline: "Backend and full-stack engineer · Node.js, TypeScript, React Native",
  location: "Chennai, India",
  // Assembled at run time so the address is not a literal in the site code, which keeps simple
  // email scrapers from reading it out of the page source or the JavaScript bundle.
  email: ["chandramoorthy.dev", "gmail.com"].join(String.fromCharCode(64)),
  linkedin: "https://www.linkedin.com/in/chandra-moorthy-5a3156193",
  github: "https://github.com/chandru-cm",
  summary:
    "I build multi-tenant SaaS products end to end: Node.js APIs, mobile apps, payments with Razorpay and AI features with Google Gemini. Four products I worked on are live in production.",
  availability: {
    relocation: true,
    visaSponsorship: true,
    lookingFor: "Backend / full-stack role",
    workSetup: "On-site, hybrid or remote",
  },
  workingHours: "IST 10:00–19:00",
  // IST 10:00–19:00 is 04:30–13:30 UTC. Overlap with each region is worked out from this on the
  // visitor's screen, so it follows daylight-saving changes (see apps/portfolio/src/lib/timezone.ts).
  workDayUtc: { start: 4 * 60 + 30, end: 13 * 60 + 30 },
  overlapRegions: [
    { region: "Central Europe", timeZone: "Europe/Berlin" },
    { region: "United Kingdom", timeZone: "Europe/London" },
    { region: "US Eastern", timeZone: "America/New_York" },
    { region: "US Pacific", timeZone: "America/Los_Angeles" },
  ],
  timezone: "UTC+5:30",
  replyTime: "24 hours",
};
