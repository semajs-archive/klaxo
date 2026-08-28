/**
 * Server-side configuration.
 *
 * Every value is validated once, at first access, with Zod. Nothing here is
 * prefixed `NEXT_PUBLIC_`, so none of it can reach the browser bundle.
 *
 * Import this ONLY from server code (route handlers, server components,
 * services). `assertServerOnly()` guards against accidental client imports.
 */
import { z } from 'zod';

function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'src/lib/env.ts was imported into client code. AI credentials must never ' +
        'reach the browser. Move this usage into a server component or route handler.',
    );
  }
}

/** Coerce the string env representation of a boolean. */
const boolFromString = (dflt: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? dflt : v.toLowerCase() === 'true'));

/** Coerce a positive integer from an env string. */
const intFromString = (dflt: number, min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? dflt : Number(v)))
    .pipe(z.number().int().min(min).max(max));

const floatFromString = (dflt: number, min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? dflt : Number(v)))
    .pipe(z.number().min(min).max(max));

/** Empty string is treated as "not set" so `.env.example` can ship blank keys. */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // --- FCC server / NVIDIA NIM ---
  FCC_SERVER_BASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim().replace(/\/+$/, '') : 'https://integrate.api.nvidia.com/v1')),
  FCC_SERVER_API_KEY: optionalString,

  // --- Model routing ---
  NVIDIA_NIM_MODEL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : 'nvidia/nemotron-3-super-120b-a12b')),
  NVIDIA_NIM_VISION_MODEL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : 'meta/llama-3.2-90b-vision-instruct')),
  NVIDIA_NIM_EMBEDDING_MODEL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : 'nvidia/nv-embedqa-mistral-7b-v2')),
  NIM_MODEL_PLANNING: optionalString,
  NIM_MODEL_GENERATION: optionalString,
  NIM_MODEL_ASSESSMENT: optionalString,
  NIM_MODEL_QA: optionalString,
  NIM_ENABLE_EMBEDDINGS: boolFromString(false),

  // --- AI runtime ---
  AI_MAX_RETRIES: intFromString(3, 1, 6),
  AI_REQUEST_TIMEOUT_MS: intFromString(120_000, 5_000, 600_000),
  AI_MAX_TOKENS: intFromString(4096, 256, 32_768),
  AI_TEMPERATURE: floatFromString(0.3, 0, 2),
  AI_MIN_REQUEST_INTERVAL_MS: intFromString(2000, 0, 60_000),
  AI_MAX_CONCURRENCY: intFromString(2, 1, 16),
  AI_DEV_MODE: boolFromString(false),

  // --- Database / uploads ---
  DATABASE_FILE: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : './data/mastery.db')),
  UPLOAD_DIR: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : './uploads')),
  MAX_UPLOAD_BYTES: intFromString(10 * 1024 * 1024, 1024, 100 * 1024 * 1024),
  MAX_UPLOAD_FILES: intFromString(10, 1, 50),

  // --- Security / logging ---
  APP_SECRET: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : 'insecure-development-secret')),
  RATE_LIMIT_PER_MINUTE: intFromString(20, 1, 10_000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_SOURCE_PREVIEWS: boolFromString(false),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Parse and cache configuration. Throws a readable error on misconfiguration. */
export function getEnv(): Env {
  assertServerOnly();
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${detail}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: force a re-read of process.env. */
export function resetEnvCache(): void {
  cached = null;
}

/**
 * True when the app is allowed to make real network calls to FCC/NIM.
 * Real mode additionally REQUIRES a key — we never silently fall back to
 * fixtures, because that would misrepresent mock output as real NIM output.
 */
export function isRealAiEnabled(env: Env = getEnv()): boolean {
  return !env.AI_DEV_MODE && Boolean(env.FCC_SERVER_API_KEY);
}

/** Non-secret snapshot safe to send to the browser / render in the UI. */
export function publicAiStatus(env: Env = getEnv()) {
  return {
    devMode: env.AI_DEV_MODE,
    baseUrl: env.FCC_SERVER_BASE_URL,
    hasCredential: Boolean(env.FCC_SERVER_API_KEY),
    realAiEnabled: isRealAiEnabled(env),
    models: {
      text: env.NVIDIA_NIM_MODEL,
      vision: env.NVIDIA_NIM_VISION_MODEL,
      embedding: env.NVIDIA_NIM_EMBEDDING_MODEL,
      planning: env.NIM_MODEL_PLANNING ?? env.NVIDIA_NIM_MODEL,
      generation: env.NIM_MODEL_GENERATION ?? env.NVIDIA_NIM_MODEL,
      assessment: env.NIM_MODEL_ASSESSMENT ?? env.NVIDIA_NIM_MODEL,
      qa: env.NIM_MODEL_QA ?? env.NVIDIA_NIM_MODEL,
    },
    embeddingsEnabled: env.NIM_ENABLE_EMBEDDINGS,
  } as const;
}
