# Connecting an AI

Out of the box, KLAXO runs on **example answers**. Everything works — you can
add material, build a course, practise — but the lessons and questions are
placeholder text, not written from your material. The app says so in a banner
across the top until you connect a provider.

Nobody can hand you a working key. API keys are billed and rate-limited to
whoever owns them, and they must never be committed, so `.env` is ignored by
git. You need your own. It takes about five minutes and the first option below
costs nothing.

## The quick way

```bash
cd mastery-course-generator
npm run ai:setup
```

It asks which provider, then for your key — which is not echoed to the screen,
not written to your shell history, and goes straight into `.env`. Then run the
check at the bottom of this page.

The rest of this page is what that script is doing, in case you would rather
do it by hand or use a provider it does not list.

## What you are actually configuring

Three values, whoever you use:

| Value | What it is |
|---|---|
| `FCC_SERVER_BASE_URL` | The address of the service |
| `FCC_SERVER_API_KEY` | Your key |
| `NVIDIA_NIM_MODEL` | Which model to use |

KLAXO talks the standard OpenAI-style protocol, so anything that speaks it
works. Put them in `mastery-course-generator/.env` and set `AI_DEV_MODE="false"`.

## Option 1 — Cloudflare Workers AI (free)

A free daily allowance, no card required. This is the one to start with.

1. Make an account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Copy your **Account ID** from the dashboard URL or the sidebar.
3. Create an API token with the **Workers AI** permission.
4. Put this in `.env`:

```bash
FCC_SERVER_BASE_URL="https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1"
FCC_SERVER_API_KEY="YOUR_TOKEN"
NVIDIA_NIM_MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast"
NVIDIA_NIM_VISION_MODEL="@cf/meta/llama-3.2-11b-vision-instruct"
AI_DEV_MODE="false"
```

If you run out of the daily allowance, generation queues and picks up later.
Nothing already built is lost.

## Option 2 — NVIDIA NIM

Free credits to start. This is what the defaults in `.env.example` point at.

```bash
FCC_SERVER_BASE_URL="https://integrate.api.nvidia.com/v1"
FCC_SERVER_API_KEY="YOUR_KEY"
NVIDIA_NIM_MODEL="nvidia/nemotron-3-super-120b-a12b"
AI_DEV_MODE="false"
```

## Option 3 — OpenAI, or anything else OpenAI-compatible

```bash
FCC_SERVER_BASE_URL="https://api.openai.com/v1"
FCC_SERVER_API_KEY="YOUR_KEY"
NVIDIA_NIM_MODEL="gpt-4o-mini"
AI_DEV_MODE="false"
```

This one is not free. Building a course is many requests, so watch the spend
before pointing it at a large model.

## Check it worked

```bash
npm run nim:probe
```

It should print `Real AI enabled: true` and `Health check: OK`. Restart the dev
server after editing `.env`, and the banner across the top of the app should be
gone.

If the probe fails:

- **401 / 403** — the key is wrong, or missing the Workers AI permission.
- **404** — the base URL is wrong; for Cloudflare, check the account id in it.
- **Model not found** — the model name is not available on that provider.

## Which model

Bigger models write better lessons and cost more. The pipeline asks for
structured output and repairs it when a model gets the shape wrong, so a small
model works — it is just more likely to need a second attempt. Start with the
free option and only change it if the courses are not good enough.

You can also point different stages at different models — planning, writing,
assessment and QA — with `NIM_MODEL_PLANNING`, `NIM_MODEL_GENERATION`,
`NIM_MODEL_ASSESSMENT` and `NIM_MODEL_QA`. Leave them blank to use one model
for everything.
