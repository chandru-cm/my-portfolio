# Chandra Moorthy: Portfolio

A personal portfolio built with Vite, React, TypeScript and Framer Motion. The repository is an npm-workspaces monorepo that builds to static files and deploys to Vercel.

## Structure

```
apps/
  portfolio/  Portfolio site (Vite + React + TypeScript)
  api/        Reserved for v2: contact-form API (not implemented)
packages/
  config/     Shared TypeScript config
```

## Run locally

Requires Node.js 18 or newer. From the repository root:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

Before sharing or deploying:

```bash
npm run typecheck
npm run build
npm run preview
```

## Update your content

| Content | Location |
| --- | --- |
| Name, links, project summaries, skills | `apps/portfolio/src/data.ts` |
| Page structure and sections | `apps/portfolio/src/App.tsx` |
| Layout, colors, responsive rules | `apps/portfolio/src/styles.css` |
| Title and search/social description | `apps/portfolio/index.html` |
| Resume PDF | `apps/portfolio/public/Chandra_Moorthy_Resume.pdf` |

## Before publishing

- Verify every project contribution, technology, title and link.
- Do not commit a resume that shows a personal phone number to a public repository.
- Ask permission before describing employer-owned products or showing screenshots. Never publish credentials, customer data, private architecture or confidential metrics.
- Only add metrics that can be substantiated.
- Test keyboard navigation, reduced-motion behaviour, phone and tablet layouts, theme contrast and external links.

## Deploy to Vercel

Import the repository and set:

- Root Directory: `apps/portfolio`
- Build command: `npm run build`
- Output directory: `dist`

The site needs no server runtime.
