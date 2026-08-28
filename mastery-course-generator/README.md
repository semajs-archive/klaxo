# Mastery Course Generator

> **AI-powered curriculum engineering platform** — transforms raw educational material into structured, grounded, mastery-oriented courses using FCC Server NVIDIA NIM models.

---

## Product Overview

The Mastery Course Generator is a curriculum engineering platform that takes messy educational inputs (syllabus photos, PDFs, lecture notes, textbook material, natural-language prompts) and produces a complete, structured course with:

- **Course architecture** — units, topics, measurable learning objectives
- **Lessons** — explanations, worked examples, visual specifications, misconceptions
- **Practice** — progressive levels from recognition to challenge
- **Assessments** — aligned to objectives with distractor analysis
- **Mastery tracking** — evidence-based progression with spaced review
- **Provenance** — every element traced back to source material
- **Quality assurance** — automated checks with revision loops

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  Dashboard → Wizard (7 steps) → Workspace (tabs)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Next.js Routes)               │
│  /api/courses • /api/sources • /api/analyze • /api/jobs        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Pipeline Orchestrator                    │
│  Job state machine: QUEUED → ANALYZING → PLANNING →            │
│  GENERATING → VALIDATING → REVISING → COMPLETED                │
│  Streaming progress events for UI recovery                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────────┐  ┌──────────┐
       │ Ingestion│    │Source Analysis│  │Course Gen│
       │ Service  │    │ Service       │  │ Service  │
       └──────────┘    └──────────────┘  └──────────┘
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────────┐  ┌──────────┐
       │  Source  │    │ Knowledge    │  │ Blueprint│
       │  Docs    │    │ Package      │  │ + Units  │
       │  + Frags │    │ (normalized) │  │ + Object.│
       └──────────┘    └──────────────┘  └──────────┘
                                                      │
                              ┌───────────────────────┘
                              ▼
                       ┌──────────────┐
                       │   QA Service │
                       │ (deterministic│
                       │  + AI checks)│
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   Database   │
                       │  (SQLite +   │
                       │  Drizzle ORM)│
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ AI Provider  │
                       │ (NVIDIA NIM  │
                       │  via FCC)    │
                       └──────────────┘
```

### Key Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Provider abstraction** | `AIProvider` interface with `NvidiaNimProvider` + `MockProvider` |
| **Model routing** | Per-stage model selection via `ModelRouter` (planning, generation, assessment, QA, vision) |
| **Structured generation** | Schema-constrained output with bounded retry/repair |
| **Idempotent jobs** | `requestKey` prevents duplicate submissions |
| **Provenance tracking** | Every curriculum entity links to source fragments |
| **Classification integrity** | REQUIRED / PREREQUISITE / RECOMMENDED / ENRICHMENT never silently converted |
| **User edit protection** | `origin: AI_GENERATED \| USER_EDITED` — never overwritten by regeneration |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, TypeScript |
| Database | SQLite via `better-sqlite3` + Drizzle ORM |
| AI | NVIDIA NIM models via FCC Server (OpenAI-compatible API) |
| Schema Validation | Zod |
| Testing | Vitest |

---

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone <repo-url>
cd mastery-course-generator
npm install
```

### Environment Configuration

Copy the example and fill in your values:

```bash
cp .env.example .env
```

**Required for production (real AI):**

```env
# FCC Server / NVIDIA NIM
FCC_SERVER_BASE_URL=https://integrate.api.nvidia.com/v1
FCC_SERVER_API_KEY=nvapi-...

# Or if running local FCC server proxying NIM:
# FCC_SERVER_BASE_URL=http://127.0.0.1:8080/v1
# FCC_SERVER_API_KEY=<your-fcc-key>

# Model routing (all optional — sensible defaults provided)
NVIDIA_NIM_MODEL=nvidia/nemotron-3-super-120b-a12b
NVIDIA_NIM_VISION_MODEL=meta/llama-3.2-90b-vision-instruct
NVIDIA_NIM_EMBEDDING_MODEL=nvidia/nv-embedqa-mistral-7b-v2
NIM_MODEL_PLANNING=
NIM_MODEL_GENERATION=
NIM_MODEL_ASSESSMENT=
NIM_MODEL_QA=
NIM_ENABLE_EMBEDDINGS=false

# AI runtime
AI_MAX_RETRIES=3
AI_REQUEST_TIMEOUT_MS=120000
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.3
AI_MIN_REQUEST_INTERVAL_MS=2000
AI_MAX_CONCURRENCY=2

# Development mode (mock AI, no network calls)
AI_DEV_MODE=true

# Database
DATABASE_FILE=./data/mastery.db

# Uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_BYTES=10485760
MAX_UPLOAD_FILES=10

# Security
APP_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
RATE_LIMIT_PER_MINUTE=20

# Logging
LOG_LEVEL=info
LOG_SOURCE_PREVIEWS=false
```

**For local development (mock AI):**

```env
AI_DEV_MODE=true
# No FCC_SERVER_API_KEY needed
```

> **Security Note**: All AI credentials are server-side only. None are prefixed with `NEXT_PUBLIC_`, so they never reach the browser.

### Database Initialization

Tables are created automatically on first connection. For a clean slate:

```bash
npm run db:reset
```

---

## Running the Application

### Development Mode (with mock AI)

```bash
npm run dev
```

Open `http://localhost:3000`. The app uses deterministic mock AI fixtures — no network calls, no API keys needed.

### Production Mode (real NVIDIA NIM)

```bash
# Set AI_DEV_MODE=false and provide valid FCC_SERVER_API_KEY in .env
npm run build
npm run start
```

---

## AI Pipeline

The generation pipeline executes as a persisted job with streaming progress:

| Stage | Model | Purpose |
|-------|-------|---------|
| **Source Extraction** | Vision (images) / Text | Extract structured knowledge from uploaded material |
| **Curriculum Planning** | Planning | Design blueprint: units, topics, objectives, prerequisites |
| **Prerequisite Analysis** | Planning | Build dependency graph, detect cycles/missing prereqs |
| **Lesson Generation** | Generation | Create lessons with sections, examples, misconceptions |
| **Practice Generation** | Generation | Progressive practice sets (recognition → challenge) |
| **Assessment Generation** | Assessment | Aligned questions with distractor rationale |
| **Curriculum QA** | QA (independent) | Coverage, alignment, duplicates, invalid equations, etc. |
| **Revision Loop** | Generation | Targeted fixes for auto-fixable QA failures |

### Streaming Progress Example

```
Reading source…
Structuring syllabus…
Building prerequisite graph…
Designing curriculum…
Generating Unit 1…
Generating assessments…
Running QA…
Fixing issues…
Course ready.
```

The UI recovers after browser refresh by polling the job state.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List user's courses |
| `POST` | `/api/courses` | Create course |
| `GET` | `/api/courses/:id` | Get course details |
| `PATCH` | `/api/courses/:id` | Update course |
| `DELETE` | `/api/courses/:id` | Delete course |
| `GET` | `/api/courses/:id/sources` | List uploaded sources |
| `POST` | `/api/courses/:id/sources` | Upload files/prompts (multipart) |
| `POST` | `/api/courses/:id/analyze` | Analyze source into knowledge package |
| `GET` | `/api/courses/:id/knowledge-package` | Get source interpretation |
| `PATCH` | `/api/courses/:id/knowledge-package` | Approve/edit interpretation |
| `POST` | `/api/courses/:id/jobs` | Start generation job |
| `GET` | `/api/courses/:id/jobs` | List jobs |
| `GET` | `/api/courses/:id/workspace` | Get curriculum entities |
| `POST` | `/api/auth/bootstrap` | Create demo session |

---

## Database Schema (Key Entities)

| Table | Purpose |
|-------|---------|
| `courses` | Course metadata, stage, preferences |
| `source_documents` | Uploaded files (PDF, image, text, prompt) |
| `source_fragments` | Extracted sections with page/confidence |
| `knowledge_packages` | Structured source interpretation |
| `units` / `topics` / `objectives` | Curriculum structure |
| `objective_dependencies` | Prerequisite graph edges |
| `lessons` / `activities` | Lesson content + activities |
| `practice_sets` / `assessments` / `questions` | Practice & assessment items |
| `mastery_records` | Learner mastery state per objective |
| `provenance` | Entity → source fragment links |
| `qa_results` | Quality check records |
| `generation_jobs` / `generation_events` | Job state + streaming progress |
| `user_edits` | Human edits preserved across regeneration |

---

## Development Workflow

### Common Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Verify everything (typecheck + test + build)
npm run verify

# Probe available NIM models (requires valid credentials)
npm run nim:probe
```

### Adding New Pipeline Stages

1. Add stage to `PipelineStage` type in `src/ai/router.ts`
2. Add system prompt in `src/pipeline/prompts/index.ts`
3. Add model routing entry in `STAGE_TO_ROUTING`
3. Implement service in `src/services/`
4. Wire into `src/pipeline/orchestrator.ts`

---

## Security

- **Prompt injection defense**: Source material always delimited in `<source_material>` blocks with explicit ignore-instructions
- **Server-side credentials**: AI keys never exposed to browser
- **Rate limiting**: Per-IP limits on AI-triggering endpoints
- **Input validation**: File size, MIME, extension, content validation
- **Safe rendering**: Markdown sanitization strips dangerous HTML/JS
- **Authorization**: Ownership checks on every mutating operation

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables from `.env.example`
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production

Ensure `AI_DEV_MODE=false` and `FCC_SERVER_API_KEY` is set. Generate a strong `APP_SECRET`.

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| Build fails with "Dynamic filesystem access" | These are warnings for `mkdirSync` in ingestion/DB — harmless for deployment |
| "Cannot find module '@/lib/env'" | Run `npm run dev` once to generate `.next/types` |
| Mock AI returns same output every time | Expected — deterministic fixtures for development |
| Real AI returns 429 | Rate limiter throttles; check `AI_MIN_REQUEST_INTERVAL_MS` / `AI_MAX_CONCURRENCY` |
| DB locked | SQLite WAL mode enabled; ensure single writer |

---

## Acceptance Criteria

The application supports the full workflow:

1. ✅ Create course from scratch
2. ✅ Upload syllabus image / PDF / document / prompt
3. ✅ Extract and structure contents via NVIDIA NIM
4. ✅ Review extracted interpretation
5. ✅ Correct errors
6. ✅ Generate curriculum blueprint
7. ✅ Edit blueprint
8. ✅ Generate detailed lessons
9. ✅ Generate practice sets
10. ✅ Generate assessments
11. ✅ Run curriculum QA
12. ✅ Automatically revise failed sections
13. ✅ View source provenance
14. ✅ Distinguish required vs. enrichment content
15. ✅ Edit generated material
16. ✅ Preserve user edits
17. ✅ Regenerate individual components
18. ✅ Maintain course versions
19. ✅ Track mastery
20. ✅ Support adaptive remediation
21. ✅ Recover from generation failures
21. ✅ Survive refresh during generation
22. ✅ Operate securely (no credential leakage)
23. ✅ Use FCC Server NVIDIA NIM in production path

---

## License

Proprietary — internal use only.