/**
 * Model Router
 *
 * Central routing layer that maps pipeline stages to specific NIM models.
 * Also provides structured-generation helpers with schema validation/repair.
 */
import { z } from 'zod';
import { AIProvider, CompletionRequest, ModelRouting } from './provider';
import { logger } from '../lib/logger';

/**
 * Pipeline stages that require model routing.
 */
export type PipelineStage =
  | 'source_extraction'
  | 'curriculum_planning'
  | 'prerequisite_analysis'
  | 'lesson_generation'
  | 'practice_generation'
  | 'assessment_generation'
  | 'qa'
  | 'revision';

/**
 * Maps a pipeline stage to a model routing key.
 */
const STAGE_TO_ROUTING: Record<PipelineStage, keyof ModelRouting> = {
  source_extraction: 'vision',
  curriculum_planning: 'planning',
  prerequisite_analysis: 'planning',
  lesson_generation: 'generation',
  practice_generation: 'generation',
  assessment_generation: 'assessment',
  qa: 'qa',
  revision: 'generation',
};

/**
 * Resolves the model for a given pipeline stage.
 */
export function resolveModel(routing: ModelRouting, stage: PipelineStage): string {
  const key = STAGE_TO_ROUTING[stage];
  return routing[key];
}

/**
 * Structured generation result with schema validation metadata.
 */
export interface StructuredResult<T> {
  value: T;
  model: string;
  provider: string;
  schemaFailures: number;
  retries: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
}

/**
 * Generate structured JSON output with schema validation and bounded repair.
 *
 * Flow:
 * 1. Attempt generation (with json_schema if provider supports it).
 * 2. Validate against the Zod schema.
 * 3. On failure, attempt repair by feeding the schema error back.
 * 4. Retry up to maxRetries.
 * 5. Throw if still invalid.
 */
export async function generateStructured<T extends z.ZodTypeAny>(
  provider: AIProvider,
  model: string,
  request: Omit<CompletionRequest, 'model'> & { schema: T },
  options: { maxRetries?: number; temperature?: number; maxTokens?: number } = {},
): Promise<StructuredResult<z.infer<T>>> {
  const maxRetries = options.maxRetries ?? 2;
  let schemaFailures = 0;
  let retries = 0;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const messages = [...request.messages];
      if (lastError && attempt > 0) {
        // Feed the schema error back for repair.
        messages.push({
          role: 'assistant',
          content: '[previous attempt failed]',
        });
        messages.push({
          role: 'user',
          content: `Your previous output was invalid JSON. Fix it to match the schema. Error: ${lastError}`,
        });
      }

      const completion = await provider.complete({
        messages,
        model,
        temperature: options.temperature ?? 0.3,
        maxTokens: options.maxTokens ?? 4096,
        responseFormat: 'json',
        jsonSchema: zodToJsonSchema(request.schema),
      });

      // Parse JSON (strip markdown fences if present).
      const parsed = parseJsonSafe(completion.content);

      // Validate against the Zod schema.
      const result = request.schema.safeParse(parsed);
      if (result.success) {
        return {
          value: result.data,
          model: completion.model,
          provider: completion.provider,
          schemaFailures,
          retries,
          promptTokens: completion.promptTokens,
          completionTokens: completion.completionTokens,
          latencyMs: completion.latencyMs,
        };
      }

      schemaFailures++;
      lastError = formatZodError(result.error);
      logger.warn('Structured generation schema validation failed', {
        attempt: attempt + 1,
        error: lastError,
      });
      retries = attempt;
    } catch (err) {
      // Network/provider error — retry.
      retries = attempt;
      lastError = (err as Error).message;
      logger.warn('Structured generation request failed', {
        attempt: attempt + 1,
        error: lastError,
      });
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
    }
  }

  throw new Error(`Structured generation failed after ${maxRetries + 1} attempts: ${lastError}`);
}

/**
 * Parse JSON robustly, handling markdown code fences.
 */
export function parseJsonSafe(content: string): unknown {
  const trimmed = content.trim();

  // Strip markdown fences.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1] ?? '');
  }

  // Try direct parse.
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try to find JSON object boundaries.
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    const arrStart = trimmed.indexOf('[');
    const arrEnd = trimmed.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      return JSON.parse(trimmed.slice(arrStart, arrEnd + 1));
    }
    throw new Error('No valid JSON found in response');
  }
}

/**
 * Format a Zod error into a human-readable string.
 */
function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}

/**
 * Convert a Zod schema to a JSON Schema (approximate, for json_schema format).
 * For simplicity, we fall back to json_object mode in the provider; the real
 * schema validation happens with Zod after parsing.
 */
function zodToJsonSchema<T extends z.ZodTypeAny>(_schema: T): Record<string, unknown> {
  // We don't need a full JSON Schema — the provider uses json_object mode and
  // Zod validates afterwards. This is a placeholder for provider compatibility.
  return { type: 'object' };
}