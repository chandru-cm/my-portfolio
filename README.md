# Chandra Moorthy — Software Engineering Portfolio

A responsive portfolio built with Vite, React, TypeScript and Framer Motion. It builds to static files and can be hosted on Vercel or another static host.

## Run locally

Install Node.js (18 or newer), then run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Before sharing or deploying, run:

```bash
npm run typecheck
npm run build
npm run preview
```

## Update your content

| Content | File or location |
| --- | --- |
| Name, contact links, resume path, project summaries and skills | `src/data.ts` |
| Page structure and section content | `src/App.tsx` |
| Layout, colors, responsive rules and theme | `src/styles.css` |
| Browser title and search/social description | `index.html` |
| Resume PDF | Add `public/Chandra_Moorthy_Resume.pdf` |
| Optional profile photo | Add `public/photo.webp` if you choose to use one |

Project cards currently use CSS-made illustrative UI panels, not screenshots from the live products. Replace them with approved, genuine screenshots when available. Do not imply the decorative panels are actual product screenshots.

## Before publishing

- Verify every project contribution, technology, job title and public link.
- Confirm the resume file exists at the configured path; otherwise remove or update the download links.
- Check that the contact email and LinkedIn/GitHub links are correct.
- Ask permission before describing employer-owned products or publishing screenshots. Never publish credentials, customer information, private architecture or confidential metrics.
- Only add performance metrics or business outcomes that can be substantiated.
- Test keyboard navigation, reduced-motion behaviour, mobile layouts, theme contrast and external links.
- Review the page at desktop and phone widths.

## Deploy to Vercel

Import the Git repository into Vercel. Use the defaults for Vite:

- Build command: `npm run build`
- Output directory: `dist`

Run the build locally before deployment. The portfolio does not require a server-side runtime.
