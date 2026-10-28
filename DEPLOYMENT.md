# Deploying to Vercel

Two Vercel projects from the same repository:

| Project | Root Directory | What it is |
| --- | --- | --- |
| **Website** | `apps/portfolio` | The static React site |
| **API** | `apps/api` | The chat backend (serverless functions) |

Everything runs on free tiers. Nothing secret is committed: keys live in Vercel's Environment Variables.

> What was verified before writing this: the API builds into Vercel's output format, and the built functions load and answer correctly when run the way Vercel's Node launcher runs them, live against Gemini and Pinecone. What can only be verified on Vercel itself is marked **Check** below.

---

## 0. Before you start

- All work is merged into `main`.
- Pinecone has your 14 records: `npm run check:pinecone` shows `portfolio: 14`. If not, run `npm run ingest -- --reset`.
- You have: a Gemini API key, a Pinecone API key, and the Pinecone index **name** (not its URL).

## 1. Create the rate-limit database (Upstash, free)

1. Sign up at Upstash and create a **Redis** database (any region near your visitors).
2. Open its REST section and copy two values: **REST URL** and **REST Token**.

Why it is needed: Vercel runs your API on many short-lived servers that share no memory, so rate-limit counters must live somewhere shared.

## 2. Deploy the API project

In Vercel: **Add New → Project**, pick this repository, then set:

| Setting | Value |
| --- | --- |
| Project name | something short, for example `chandra-portfolio-api` |
| Root Directory | `apps/api` |
| Framework Preset | Other |
| Build Command | leave as is (`vercel.json` sets `npm run build`) |
| Output Directory | leave **empty** |
| Include source files outside of the Root Directory | **on** (the default) |

Open **Environment Variables** before deploying and add:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | your Gemini key |
| `PINECONE_API_KEY` | your Pinecone key |
| `PINECONE_INDEX` | the index **name**, for example `portfolio` |
| `PINECONE_INDEX_HOST` | the host from the Pinecone console (saves about 3 s on a cold start) |
| `UPSTASH_REDIS_REST_URL` | from step 1 |
| `UPSTASH_REDIS_REST_TOKEN` | from step 1 |
| `ALLOWED_ORIGINS` | leave out for now; added in step 5 |

Optional: `GEMINI_CHAT_MODEL`, `GEMINI_CHAT_FALLBACK_MODELS` (model **IDs** like `gemini-3.1-flash-lite`, never display names), `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_DAY`, `GLOBAL_DAILY_LIMIT`. Defaults are in `apps/api/README.md`.

Click **Deploy**.

**Check:** in the build log you should see `built api/chat`, `built api/health` and `wrote .vercel/output`. In **Settings → Functions**, the Node.js version should be 22.x.

## 3. Get the API's production URL

1. Open the API project, **Overview** tab. Under **Domains** is the production address, for example `https://chandra-portfolio-api.vercel.app`. The same list is in **Settings → Domains**.
2. Use that short address. The long addresses with random letters belong to one specific build and may stay behind the login wall.
3. Make it public: **Settings → Deployment Protection → Vercel Authentication**: choose **Only Preview Deployments** (or turn off), then save.
4. Test it from any terminal, or paste the first address into a private browser window:

```bash
curl https://YOUR-API.vercel.app/api/health
```

Expected: `{"ok":true}`. If you get a Vercel login page or a 401, step 3 was not saved.

## 4. Deploy the website project

**Add New → Project**, same repository:

| Setting | Value |
| --- | --- |
| Project name | for example `chandra-portfolio` |
| Root Directory | `apps/portfolio` |
| Framework Preset | Vite |
| Build / Output | defaults (`npm run build`, `dist`) |

Environment variables:

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | the API address from step 3, with no trailing slash |
| `VITE_CHAT_ENABLED` | `true` |

These are written into the site when it is built, so changing them later means redeploying. Deploy, then repeat step 3 for this project: copy its production address and set Deployment Protection to **Only Preview Deployments**.

## 5. Tell the API which website may call it

1. In the **API** project: **Settings → Environment Variables**, add `ALLOWED_ORIGINS` set to the website's production address, for example `https://chandra-portfolio.vercel.app`. No trailing slash. Separate several addresses with commas (add a custom domain here later).
2. **Redeploy** the API (Deployments → the latest → Redeploy). Environment changes only apply to new deployments.

Each project needs the other's address, so one of them always gets configured after the first deploy. That is normal.

**Region:** leave the API's function region at Vercel's default (Washington DC, `iad1`). Your Pinecone index is in AWS `us-east-1`, so the two are close together. Pick an Upstash region near there too.

## 5b. Turn on the contact form (email to your inbox)

The site has a form that emails visitors' messages and call requests to you. It lives in the API project, so the keys go there, never in the website.

1. **Gmail app password.** Use a personal Gmail account. Turn on 2-Step Verification, then create an app password at https://myaccount.google.com/apppasswords. Google shows 16 characters in four groups of four; paste them as they are or without spaces.
2. **Phone alert (optional but recommended).** In Telegram, message @BotFather, send `/newbot`, and keep the bot token. Send your new bot any message, then get your numeric chat id.
3. In the **API** project, add these Environment Variables, then **redeploy**:

| Name | Value |
| --- | --- |
| `SMTP_USER` | the Gmail address that owns the app password |
| `SMTP_PASS` | the 16-character app password |
| `CONTACT_TO` | optional: where messages are delivered (defaults to `SMTP_USER`) |
| `TELEGRAM_BOT_TOKEN` | optional: from BotFather |
| `TELEGRAM_CHAT_ID` | optional: your chat id |

4. In the **website** project, add `VITE_CONTACT_ENABLED` = `true` and redeploy it.

How it behaves: the visitor's message is delivered by email and by the phone alert at the same time. If either one gets through, the visitor sees "sent". If both fail, they see your email address so nothing is lost. Each visitor also gets a short "received" email (set `CONTACT_CONFIRMATION=false` to switch it off). Limits default to 3 per minute and 10 per day per visitor, and 60 per day overall; Gmail's own daily sending limit is the real ceiling.

**Check:** submit the form on the live site, then look for the email and the Telegram message. The function log shows `{"evt":"contact","status":200,...}` with no names or addresses.

## 6. Test the live deployment

Run the automated check from your machine (it needs no keys):

```bash
npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
```

It checks the API health, the CORS rules, that other origins are rejected, the private-details refusal, an instant FAQ answer, "I don't know" for off-topic questions, a model-written answer, and that the website, a deep link and the résumé PDF load. Expected timings on the free tiers:

| Check | Normal |
| --- | --- |
| Health, refusal | well under 1 s |
| Instant FAQ answer | about 4 s on a cold start, under 1 s when warm (set `PINECONE_INDEX_HOST` to avoid a 3 s lookup) |
| Off-topic ("I don't know") | about 1 to 4 s |
| Model-written answer | 2 to 15 s, varying with Gemini's free-tier load |

A slow or unavailable model is reported as a warning, not a failure, because it depends on Google's capacity. Everything else must pass.

Then check by eye:

1. Open the website's production address.
2. Click **Ask about Chandra Moorthy** and try:
   - a suggested question (instant answer),
   - "What did Chandra Moorthy build in RentEasify?" (a model-written answer, about 7 to 15 seconds),
   - "What is the phone number?" (refused).
3. In the browser's DevTools → Network, the request goes to your API address and returns `200`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Chat button missing on the live site | `VITE_CHAT_ENABLED` not `true`, or you did not redeploy the website after setting it |
| "Couldn't reach the assistant" | `VITE_API_BASE_URL` wrong or missing, or the API's Deployment Protection is still on |
| `403 forbidden_origin` in the Network tab | `ALLOWED_ORIGINS` does not exactly match the website address (scheme, host, no trailing slash), or the API was not redeployed after adding it |
| `500` and "not configured correctly" | A required setting is missing. The API project's **Logs** show the names (never values) |
| `502 upstream_error` | The Gemini or Pinecone call failed: check keys, model ID, and the Logs line `reason: generate:<status>` or `retrieve:<status>` |
| `429` for you while testing | You hit the per-minute limit; wait for `Retry-After` seconds |
| API build log lacks `wrote .vercel/output` | Build Command was overridden in the project settings; clear the override so `vercel.json` applies |
| Functions deploy but every call 404s | **Check:** Vercel did not pick up `.vercel/output`. The handler is a plain web `Request`/`Response` function, so it can also run on any Node host with `toNodeHandler`; ask for help before changing hosts |

## Safety notes

- Keys exist only in Vercel's settings. Never put them in the website project, and never prefix a secret with `VITE_` (those values are public).
- The API limits each visitor per minute and per day, and caps total daily use so the free Gemini quota cannot be drained.
- Free-tier Gemini may use prompts to improve Google's products. That is acceptable only because the knowledge base is public content.
- Rotate a key at once if it ever appears in a log, chat, or commit.

## Later

- A custom domain: add it to the website project, then add the new address to `ALLOWED_ORIGINS` and redeploy the API.
- After changing content in `packages/content`, run `npm run eval -- --gemini` and `npm run ingest -- --reset` from your machine. The API needs no redeploy for knowledge changes, because it reads Pinecone live.
