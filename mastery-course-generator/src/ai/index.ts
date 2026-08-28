/**
 * AI Service Factory
 *
 * The single well-defined integration boundary between the application and
 * the AI layer. Resolves configuration from environment, selects the provider
 * (NVIDIA NIM vs mock), and exposes typed services for each pipeline stage.
 */
import { getEnv, isRealAiEnabled } from '../lib/env';
import {
  AIProvider,
  createModelRouting,
  ModelRouting,
  NvidiaNimConfig,
} from './provider';
import { NvidiaNimProvider } from './nvidia-nim-provider';
import { MockProvider } from './mock-provider';

/**
 * Shared singleton AI context for server-side use.
 */
export interface AiContext {
  provider: AIProvider;
  routing: ModelRouting;
  devMode: boolean;
  realAiEnabled: boolean;
  config: NvidiaNimConfig;
}

let cached: AiContext | null = null;

/**
 * Build the NvidiaNimConfig from environment.
 */
export function buildNimConfig(): NvidiaNimConfig {
  const env = getEnv();
  return {
    baseUrl: env.FCC_SERVER_BASE_URL,
    apiKey: env.FCC_SERVER_API_KEY ?? '',
    defaultModel: env.NVIDIA_NIM_MODEL,
    visionModel: env.NVIDIA_NIM_VISION_MODEL,
    embeddingModel: env.NVIDIA_NIM_EMBEDDING_MODEL,
    planningModel: env.NIM_MODEL_PLANNING,
    generationModel: env.NIM_MODEL_GENERATION,
    assessmentModel: env.NIM_MODEL_ASSESSMENT,
    qaModel: env.NIM_MODEL_QA,
    enableEmbeddings: env.NIM_ENABLE_EMBEDDINGS,
    maxRetries: env.AI_MAX_RETRIES,
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    maxTokens: env.AI_MAX_TOKENS,
    temperature: env.AI_TEMPERATURE,
    minRequestIntervalMs: env.AI_MIN_REQUEST_INTERVAL_MS,
    maxConcurrency: env.AI_MAX_CONCURRENCY,
  };
}

/**
 * Resolve the active AI context.
 *
 * - AI_DEV_MODE=true → MockProvider (deterministic fixtures).
 * - Otherwise → NvidiaNimProvider (real NIM; requires FCC_SERVER_API_KEY).
 */
export function getAiContext(): AiContext {
  if (cached) return cached;

  const env = getEnv();
  const config = buildNimConfig();
  const devMode = env.AI_DEV_MODE;
  const realAiEnabled = isRealAiEnabled(env);

  // Never silently fall back to mock in production: if dev mode is off we MUST
  // use the real provider and let failures surface clearly.
  const provider: AIProvider = devMode ? new MockProvider() : new NvidiaNimProvider(config);

  cached = {
    provider,
    routing: createModelRouting(config),
    devMode,
    realAiEnabled,
    config,
  };

  return cached;
}

/**
 * Test helper: reset the cached context (forces re-read of env).
 */
export function resetAiContext(): void {
  cached = null;
}