# Deploying to Vercel

You can deploy the website and the chat API in **one Vercel project** (one address) or in **two** (one address each). Option A is simpler and is the recommended route. Option B is the fallback.

| | Option A: one project | Option B: two projects |
| --- | --- | --- |
| Addresses | One: `/` is the website, `/api/chat` and `/api/health` are the API | Two |
| Cross-site settings (`VITE_API_BASE_URL`, `ALLOWED_ORIGINS`) | None needed | Needed |
| Root Directory | the repository root | `apps/portfolio` and `apps/api` |
| Setup | Change settings of your existing project | Create a second project |

Everything runs on free tiers. Nothing secret is committed: keys live in Vercel's Environment Variables.

> What was verified before writing this: the combined output builds, and the assembled website and functions pass every check in `npm run smoke` behind a local stand-in for Vercel's routing, live against Gemini and Pinecone. What can only be verified on Vercel itself: that it accepts the generated output and routes it as documented. Troubleshooting is at the end.

---

## Before you start

- All work is merged into `main`.
- Pinecone has your records: `npm run check:pinecone` shows `portfolio: 15`. If not, run `npm run ingest -- --reset`.
- You have a Gemini API key, a Pinecone API key and the Pinecone index **name** (not its URL).

## 1. Create the rate-limit database (Upstash, free)

1. Sign up at console.upstash.com and create a **Redis** database. Region **AWS us-east-1** (close to Vercel's default function region and to Pinecone). Free plan. Turn **Eviction** on.
2. In the database's **REST API** section, copy **UPSTASH_REDIS_REST_URL** and the read-write **UPSTASH_REDIS_REST_TOKEN**.

Why it is needed: Vercel runs your API on many short-lived servers that share no memory, so rate-limit counters must live somewhere shared. Upstash works over plain HTTPS, which suits serverless.

---

## Option A: one project (recommended)

Reuse your existing website project. Its address stays the same.

### A1. Change the project's settings

Open the project, **Settings → General**, then:

| Setting | Change to |
| --- | --- |
| Root Directory | **empty** (the repository root). Clear `apps/portfolio` |
| Framework Preset | **Other** |
| Build Command | leave default (the root `vercel.json` sets `npm run build:vercel`). Turn off any override |
| Output Directory | **empty** |
| Node.js Version | 22.x |

### A2. Environment variables

In **Settings → Environment Variables**, tick **Production** for each:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | your Gemini key |
| `PINECONE_API_KEY` | your Pinecone key |
| `PINECONE_INDEX` | `portfolio` (the index **name**) |
| `PINECONE_INDEX_HOST` | the index host from the Pinecone console (saves about 3 s on cold starts) |
| `UPSTASH_REDIS_REST_URL` | from step 1 |
| `UPSTASH_REDIS_REST_TOKEN` | from step 1 |

Also **remove** `VITE_API_BASE_URL` if you added it earlier. In one project the website and API share an address, so it must stay empty. You do not need `ALLOWED_ORIGINS`: this deployment's own Vercel addresses are allowed automatically. Add it only if you attach a custom domain.

`VITE_CHAT_ENABLED` is not needed either: the one-project build turns the chat on by default.

### A3. Redeploy

**Deployments →** the latest → **Redeploy** (or merge to `main`).

**Check in the build log:** `built api/chat`, `built api/health`, and `Wrote .vercel/output: ... website files, 2 functions, routing config.` In the deployment's **Functions** tab you should see `api/chat` and `api/health`.

### A4. Test

```bash
curl https://YOUR-SITE.vercel.app/api/health
npm run smoke -- https://YOUR-SITE.vercel.app https://YOUR-SITE.vercel.app
```

`/api/health` should return `{"ok":true}`. Then open the site, click **Ask about Chandra Moorthy**, and try a suggested question.

### Roll back

If something is wrong, set Root Directory back to `apps/portfolio` and Framework Preset to Vite, then redeploy. The website works exactly as before, without the chat.

---

## Option B: two projects

### B1. Deploy the API project

**Add New → Project**, same repository:

| Setting | Value |
| --- | --- |
| Project name | for example `my-portfolio-api` |
| Root Directory | `apps/api` |
| Framework Preset | Other |
| Build Command | default (`apps/api/vercel.json` sets it) |
| Output Directory | empty |

Environment variables (Production): the six variables from A2, plus `ALLOWED_ORIGINS` set to your website's address with no trailing slash (for example `https://my-portfolio-six-flax-15.vercel.app`). Deploy. Check the log for `built api/chat` and `wrote .vercel/output`.

Then **Settings → Deployment Protection → Vercel Authentication → Only Preview Deployments**, and save. Test `https://YOUR-API.vercel.app/api/health`.

### B2. Connect the website project

In the existing website project (Root Directory `apps/portfolio`), add:

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | the API's address, no trailing slash |
| `VITE_CHAT_ENABLED` | `true` |

These are baked into the site at build time, so **redeploy** the website. Then:

```bash
npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
```

---

## Where to find an address

Open the project, **Overview**, then **Domains**. Use the short `something.vercel.app` address, not the long per-build ones. Make sure **Settings → Deployment Protection** allows public access to production, or visitors see a login page.

## What `npm run smoke` checks and normal timings

It checks health, CORS, that other origins are rejected, the private-details refusal, an instant FAQ answer, "I don't know" for off-topic questions, a model-written answer, and that the website, a deep link and the résumé PDF load.

| Check | Normal |
| --- | --- |
| Health, refusal | well under 1 s |
| Instant FAQ answer | about 3 to 4 s cold, under 1 s warm |
| Off-topic ("I don't know") | about 1 to 4 s |
| Model-written answer | 2 to 15 s, varying with Gemini's free-tier load |

A slow or unavailable model is a warning, not a failure, because it depends on Google's capacity.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `/api/health` shows the website page or a 404 (Option A) | Vercel did not use the generated output. Check the build log for `Wrote .vercel/output`, that Root Directory is empty and Framework is Other, and that no Build Command override is set |
| Build fails on `tsx` or `npm run build:vercel` | The build must run at the repository root. Confirm Root Directory is empty |
| Chat button missing | Option A: redeploy after the settings change. Option B: `VITE_CHAT_ENABLED` is not `true`, or the website was not redeployed |
| "Couldn't reach the assistant" | Option B: `VITE_API_BASE_URL` wrong, or the API's Deployment Protection is still on |
| `403 forbidden_origin` | Option B: `ALLOWED_ORIGINS` does not exactly match the website's address. Option A: you are on a custom domain, so add it to `ALLOWED_ORIGINS` |
| `500`, "not configured correctly" | A required setting is missing. The Logs show the names, never the values |
| `502 upstream_error` | Gemini or Pinecone failed: check keys, and the Logs line `reason: generate:<status>` or `retrieve:<status>` |
| `429` while testing | You hit the per-minute limit; wait for `Retry-After` seconds |
| A model **display name** in a variable | Use model IDs like `gemini-3.1-flash-lite`, never "Gemini 3.1 Flash Lite" |

## Safety notes

- Keys exist only in Vercel's settings. Never prefix a secret with `VITE_`: those values are public.
- Do not import your whole local `.env` into Vercel: it can hold localhost URLs and other values that break production.
- The API limits each visitor per minute and per day, and caps total daily use so the free Gemini quota cannot be drained.
- Free-tier Gemini may use prompts to improve Google's products. That is acceptable only because the knowledge base is public content.
- Rotate a key at once if it ever appears in a log, chat or commit.

## Later

- A custom domain: add it to the project, then add it to `ALLOWED_ORIGINS` and redeploy.
- After changing content in `packages/content`, run `npm run eval -- --gemini` and `npm run ingest -- --reset` from your machine. The API reads Pinecone live, so it needs no redeploy for knowledge changes, but the website does for text on the page.
