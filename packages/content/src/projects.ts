import type { Project } from "./types";

// Checked against the product repositories and the owner's own git history (see the review notes
// in the project description). Rules for editing this file:
//  - Say only what the code shows. Where a feature is shared by a team, say what the owner did.
//  - Optional fields may be left out: the site hides any block with no data.
//  - Counts come from the code and live admin figures; update them with their source and date.
export const projects: Project[] = [
  {
    id: "renteasify",
    name: "RentEasify",
    type: "Rental management SaaS",
    categories: ["Backend", "Mobile", "AI"],
    summary:
      "Rent collection, tenant KYC, rental agreements and property management for Indian landlords, PG operators and housing associations.",
    myPart: "The Expo association (RWA) app, the commercial app, and backend services for leases, billing, KYC and agreements.",
    role: "Full-stack developer",
    period: "Mar 2026 – present",
    platform: "Android, iOS, web",
    userRoles: ["Owners", "Managers", "Tenants", "Applicants", "Association users"],
    links: [
      { label: "renteasify.com", url: "https://renteasify.com" },
      { label: "Web app", url: "https://web.renteasify.com" },
      { label: "Commercial", url: "https://commercial.renteasify.com" },
      { label: "Associations", url: "https://rwa.renteasify.com" },
    ],
    liveUrls: [
      "https://renteasify.com",
      "https://web.renteasify.com",
      "https://commercial.renteasify.com",
      "https://rwa.renteasify.com",
    ],
    images: [
      { src: "/media/renteasify-1.jpg", alt: "RentEasify home page" },
      { src: "/media/renteasify-2.jpg", alt: "RentEasify web app sign-in" },
    ],
    stack: [
      "Node.js", "TypeScript", "Express", "Firebase Functions", "PostgreSQL", "Drizzle ORM",
      "React Native", "Expo", "React", "Next.js", "Razorpay", "Gemini",
    ],
    cardPoints: [
      "Association (RWA) app rebuilt in Expo",
      "Commercial and PG app",
      "Lease, billing, KYC and e-sign services on the API",
      "AI advisor contexts and House Rules AI",
    ],
    tableSummary: "Association app in Expo, commercial app, lease, billing and KYC services, AI",
    overview:
      "RentEasify is a family of apps on one backend: a landlord and tenant app, a commercial app for PGs, hostels and commercial properties, an association app for housing societies, and admin, referral and marketing sites. I work on the backend and on the association and commercial apps.",
    problem:
      "Small landlords in India collect rent by bank transfer or cash, check tenants informally and sign paper agreements. RentEasify moves rent, tenant verification and agreements into one app.",
    contributions: [
      "Built much of the Expo association (RWA) app, which replaces the legacy web app screen by screen: units, owners, tenants, leases, team, settings and reports, move-in and move-out checklists, owner import from a unit sheet, and association registration.",
      "Built features in the commercial app for PGs and commercial properties: QR onboarding, property and complex detail, branch payments, offline payment approval and House Rules AI.",
      "Built backend services for leases and billing (discounts, owner reminders, late fees, ledger and tax invoice PDFs), KYC with DigiLocker, and agreement e-sign flows.",
      "Worked on phone OTP sign-in and the auth flows shared by the apps.",
      "Added AI advisor contexts built on Google Gemini.",
    ],
    features: [
      {
        title: "Rent bills and payments",
        text: "Monthly rent bills per lease, paid over UPI through Razorpay, with offline payments recorded by the owner and approved in the app.",
        how: "Razorpay Route linked accounts split payments to owners; webhooks are verified by signature.",
      },
      {
        title: "KYC and agreements",
        text: "Tenant identity checks and state-specific rental agreements signed with an OTP.",
        how: "KYC through Cashfree and CaseDocker with DigiLocker; e-sign and e-stamp services on the API.",
      },
      {
        title: "Association (RWA) app",
        text: "Units, owners, tenants, leases, team and reports for housing societies, with move-in and move-out checklists.",
        how: "An Expo app for iOS, Android and the web that replaces the older React web app, one screen at a time.",
      },
      {
        title: "Commercial and PG app",
        text: "Branches and complex units, staff and resident attendance, and billing for PGs, hostels and commercial properties.",
        how: "Shares the API and auth with the landlord app; an X-APP-ID header selects app-specific rules.",
      },
      {
        title: "AI features",
        text: "A Gemini agreement advisor, House Rules AI for commercial properties, and a WhatsApp bot that is checked with evaluation tests.",
        how: "Gemini is called from the backend; the model name is set in configuration.",
      },
    ],
    architecture: {
      layers: [
        ["Apps", "Expo / React Native (landlord and tenant, commercial, association), React + Vite (admin, referral), Next.js marketing"],
        ["API", "Node.js 22, Express 5, TypeScript on Firebase Functions"],
        ["Data", "PostgreSQL with Drizzle ORM, 118 tables"],
        ["Payments", "Razorpay (Route linked accounts), signature-verified webhooks"],
        ["KYC", "Cashfree, CaseDocker and DigiLocker; personal data encrypted with GCP KMS"],
        ["Jobs", "One hourly scheduler that runs about 30 background jobs, plus Cloud Tasks"],
        ["AI", "Google Gemini"],
      ],
      notes: ["Access is checked through membership tables, with owner, manager and tenant roles on each property."],
    },
    challenges: [
      {
        title: "Balances drifting from payments",
        problem: "A lease balance can drift if a payment or refund is recorded out of order.",
        approach: "A scheduled reconciliation job rebuilds balances from payment transactions and bills.",
        result: "Balances correct themselves without manual fixes.",
      },
    ],
    results: [
      { value: "7", label: "front-end apps on one backend" },
      { value: "118", label: "database tables" },
      { value: "~30", label: "scheduled background jobs" },
      { value: "91", label: "properties on the platform (admin console, Oct 2026)" },
      { value: "438", label: "registered users (admin console, Oct 2026)" },
      { value: "174", label: "active tenants (admin console, Oct 2026)" },
    ],
  },
  {
    id: "socibooks",
    name: "SociBooks",
    type: "Society accounting SaaS",
    categories: ["Backend", "Mobile"],
    summary:
      "Transparent accounting for housing societies and associations: maintenance billing, income, expenses, reconciliation and member statements.",
    myPart: "Ledger, income, expense-approval, invoice and statement features across the API and committee app, and the owner screens.",
    role: "Full-stack developer",
    period: "Jun – Jul 2026",
    platform: "Android, iOS, web",
    userRoles: ["President", "Secretary", "Treasurer", "Owners", "Tenants"],
    links: [
      { label: "socibooks.com", url: "https://socibooks.com" },
      { label: "Committee app", url: "https://committee.socibooks.com" },
    ],
    liveUrls: ["https://socibooks.com", "https://committee.socibooks.com"],
    images: [
      { src: "/media/socibooks-1.jpg", alt: "SociBooks home page" },
      { src: "/media/socibooks-2.jpg", alt: "SociBooks committee sign-in" },
    ],
    stack: ["Node.js", "TypeScript", "Express", "Firebase Functions", "PostgreSQL", "Prisma", "React", "Expo", "React Native"],
    cardPoints: [
      "Committee web app: members, income, expenses, reports",
      "Owner mobile app: statement of account, dues, notices",
      "Expense approval by committee vote",
      "Bank reconciliation, invoice and statement PDFs",
    ],
    tableSummary: "Committee app, owner app, expense approval, reconciliation, invoices and statements",
    overview:
      "SociBooks gives a housing society's committee one place to run its books, and gives every owner a read-only view of where the money goes. I worked across the API, the committee web app and the owner app.",
    problem:
      "Many housing societies keep accounts in registers or spreadsheets. Owners cannot see how maintenance money is spent, and the treasurer spends days on statements and bank matching.",
    contributions: [
      "Moved the API's database access to Prisma and built much of the income, payment and expense modules, including expense categories and committee-vote approval.",
      "Built the statement of account and invoice PDFs, invoice templates and the opening-balance flow (manual entry and CSV).",
      "Built the financial report, account ledger and monthly balance snapshots in the committee app.",
      "Built owner-facing screens and sign-in fixes, including the association switcher and owner profile editing.",
      "Wrote a validation script for the CSV test data.",
    ],
    features: [
      {
        title: "Committee web app",
        text: "Members, memberships, residents, income, expenses, assets, projects, annual plan, invoice templates and notices.",
        how: "React 18 with Vite and Tailwind, talking to one versioned REST API.",
      },
      {
        title: "Owner mobile app",
        text: "Each owner sees their statement of account, pending dues, income, expenses and notices, and the society's bank details for paying.",
        how: "Expo SDK 52 app for Android, iOS and the web.",
      },
      {
        title: "Expense approval",
        text: "Expenses can need approval from the committee before they are booked, decided by vote.",
      },
      {
        title: "Reconciliation and statements",
        text: "Bank statement reconciliation, an account ledger, a financial report, and downloadable PDF statements and invoices.",
        how: "PDFs are generated on the server with pdfkit.",
      },
    ],
    architecture: {
      layers: [
        ["Apps", "Expo / React Native (owners), React + Vite (committee, admin, marketing)"],
        ["API", "Express 4 on Firebase Functions, /api/v1"],
        ["Data", "PostgreSQL with Prisma migrations, 42 models"],
        ["Auth", "Phone OTP by SMS or WhatsApp (MSG91), then a Firebase token"],
        ["Payments", "Razorpay order and webhook endpoints on the API; the owner app currently shows bank details to pay"],
        ["Delivery", "GitHub Actions to Firebase Hosting and Functions, and an Android build"],
      ],
      notes: [
        "Multi-tenant on one database: every request names an association, and middleware checks the caller's active membership there, with committee access above owner access, before any query runs.",
      ],
    },
    challenges: [
      {
        title: "Keeping each society's books separate",
        problem: "All societies share one database, so a missing check could expose another society's accounts.",
        approach:
          "Every request names an association, middleware verifies the user's active membership in it, and every query filters by that association.",
        result: "A signed-in user can only reach the societies they belong to.",
      },
    ],
    results: [
      { value: "5", label: "apps: owner, committee, admin, marketing, API" },
      { value: "25", label: "committee app pages" },
      { value: "42", label: "database models" },
    ],
  },
  {
    id: "digivcards",
    name: "DigiVCards.ai",
    type: "Digital business card SaaS",
    categories: ["Backend", "Mobile", "AI"],
    summary:
      "Digital business cards with a public link and QR sharing, AI-written content, visitor analytics and per-card payments.",
    myPart: "Flutter and Expo app features, the admin console redesign, AI card scanning and content, and payment fixes.",
    role: "Full-stack developer",
    period: "Jun 2025 – Aug 2026",
    platform: "Android, iOS, web",
    links: [
      { label: "digivcards.ai", url: "https://digivcards.ai" },
      { label: "Web app", url: "https://web.digivcards.ai" },
    ],
    liveUrls: ["https://digivcards.ai", "https://web.digivcards.ai"],
    images: [{ src: "/media/digivcards-1.jpg", alt: "DigiVCards.ai home page" }],
    stack: [
      "Node.js", "TypeScript", "Express", "Firebase Functions", "Firestore", "Expo", "React Native", "Flutter",
      "React", "Angular", "Razorpay", "Gemini",
    ],
    cardPoints: [
      "Flutter app, then the Expo app that replaced it",
      "Admin console redesign",
      "AI scan of a paper visiting card",
      "Razorpay per-card payments",
    ],
    tableSummary: "Flutter and Expo apps, admin console redesign, AI card scanning, payments",
    overview:
      "DigiVCards.ai lets a business build a mobile card with its products, services, gallery, reviews and payment details, share it by link or QR code, and see who engaged with it. I worked on the mobile apps, the admin console and the backend.",
    problem:
      "Paper visiting cards run out, go out of date and tell the owner nothing about who was interested. A digital card can be updated at any time and shows which visitors called, messaged or saved it.",
    contributions: [
      "Built features in the Flutter mobile app: onboarding, OTP sign-in, cards, products and services, payments and localisation.",
      "Built screens in the Expo app that replaced it: the public card, who viewed my card, members, OTP resend, paywall and pricing.",
      "Added scanning a paper visiting card into a profile with AI extraction, and AI content suggestions for card text.",
      "Redesigned the admin console (users, cards, billing, notifications hub, feature flags, settings, roles) and moved its lists to page and page-size pagination.",
      "Worked on the Angular user web app (members, licences and permissions) and on payment-flow fixes.",
    ],
    features: [
      {
        title: "One app for three platforms",
        text: "Cards, analytics, visitors, AI chat, payments and settings in one Expo app, in six languages.",
        how: "Expo SDK 52 with expo-router replaced the separate Flutter app and user web app.",
      },
      {
        title: "AI content and card scanning",
        text: "Gemini writes product and service descriptions, a photo of a paper card becomes a digital card, and visitors can use an AI chat, including by voice.",
        how: "Cloud Vision reads the photo and Gemini structures it; voice goes through Google Speech-to-Text.",
      },
      {
        title: "Payments and trial",
        text: "Owners pay per card through Razorpay; the first card gets a 30-day free trial before billing starts.",
        how: "Billing moves from trial to active or unpaid; prices come from a catalog API managed in the admin console.",
      },
      {
        title: "Visitor analytics",
        text: "Owners see who called, messaged on WhatsApp, emailed, saved or shared their card, and who viewed it.",
        how: "More than 15 named engagement events are stored on the card; generic click events are rejected.",
      },
    ],
    architecture: {
      layers: [
        ["Apps", "Expo / React Native, Flutter (previous), Angular 19 SSR for public cards"],
        ["Admin", "React 18, Vite, Tailwind, Radix UI"],
        ["API", "Express on Firebase Functions; public, secure and admin APIs"],
        ["Data", "Firestore and Cloud Storage"],
        ["AI", "Gemini, Cloud Vision, Google Speech-to-Text API"],
        ["Delivery", "GitHub Actions to Firebase, Cloud Run (SSR) and Play Store"],
      ],
    },
    results: [
      { value: "18", label: "industry card templates" },
      { value: "8", label: "backend services that use Gemini" },
      { value: "15+", label: "tracked engagement events" },
      { value: "6", label: "app languages" },
    ],
  },
  {
    id: "kalaivani-erp",
    name: "Kalaivani ERP",
    type: "School management platform",
    categories: ["Mobile"],
    summary: "A multi-tenant school ERP with web portals and Flutter apps for school admins, parents, teachers and drivers.",
    myPart: "School admin Flutter app features: dashboard and setup, shared school switching, and transport screens.",
    role: "Flutter developer",
    period: "Jan – Mar 2026",
    platform: "Android, iOS, web",
    links: [
      { label: "kalaivani.in", url: "https://kalaivani.in" },
      { label: "Web app", url: "https://web.kalaivani.in" },
    ],
    liveUrls: ["https://kalaivani.in", "https://web.kalaivani.in"],
    images: [
      { src: "/media/kalaivani-erp-1.jpg", alt: "Kalaivani ERP home page" },
      { src: "/media/kalaivani-erp-2.jpg", alt: "Kalaivani ERP school selection" },
    ],
    stack: ["Flutter", "Riverpod", "Node.js", "TypeScript", "Express", "Firebase Functions", "Firestore"],
    cardPoints: [
      "School admin Flutter app features",
      "Split into admin and public apps with role-based access",
      "Change school across all four apps",
      "Transport: bus and driver assignment",
    ],
    tableSummary: "Admin app, school switching, transport screens, demo data",
    overview:
      "Kalaivani ERP runs admissions, fees, attendance, exams, transport and parent communication for several schools on one platform. Each school gets its own data space, and larger schools can run on a dedicated cloud with their own branding.",
    problem:
      "Schools handle admissions, fee collection, attendance and parent messages on paper and phone calls, which takes staff time and leaves parents without updates.",
    contributions: [
      "Built features in the school admin Flutter app, my main area: dashboard, setup progress and profile screens.",
      "Split the mobile app into admin and public versions with role-based access.",
      "Added shared school switching ('change school') to all four apps and the sign-in screen, and fixed parent and teacher sign-in.",
      "Built transport screens: bus and driver assignment, student allocation with search filters, and error handling on transport routes.",
      "Refactored the demo seed data and fixed student and teacher creation.",
    ],
    features: [
      {
        title: "School admin app",
        text: "Dashboard, setup progress, student and teacher management and school profile for school administrators.",
        how: "Flutter with Riverpod and shared local packages.",
      },
      {
        title: "Change school",
        text: "People who belong to more than one school switch between them without signing out.",
        how: "One shared sign-in package used by the admin, parent, teacher and driver apps.",
      },
      {
        title: "Transport and live bus tracking",
        text: "Admins assign buses, drivers and students; parents watch the bus on a map during a trip.",
        how: "The driver app sends its location every 10 seconds or 10 metres; the map uses OpenStreetMap tiles.",
      },
    ],
    architecture: {
      layers: [
        ["Apps", "Flutter (admin, parent, teacher, driver), Riverpod"],
        ["Web", "Angular 19 portals, Angular 19 SSR marketing site"],
        ["API", "Firebase Functions with Express, Node 22"],
        ["Data", "Cloud Firestore, one path per school"],
        ["Messaging", "Firebase Cloud Messaging, Twilio SMS, email"],
        ["Payments", "Cashfree"],
      ],
      notes: ["Every school's data sits under its own path in Firestore, so schools are isolated by tenant."],
    },
    results: [
      { value: "4", label: "Flutter apps" },
      { value: "24", label: "web feature modules" },
      { value: "8", label: "user roles" },
    ],
  },
];
