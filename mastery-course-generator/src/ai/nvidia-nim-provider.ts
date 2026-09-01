/**
 * NVIDIA NIM Provider Implementation
 *
 * Communicates with the FCC Server NVIDIA NIM models via an OpenAI-compatible
 * HTTP API. This is the ONLY place that makes direct HTTP calls to the NIM
 * endpoint — the rest of the application works through AIProvider/ModelRouter.
 */
import {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  NvidiaNimConfig,
  ProviderMetadata,
  StreamChunk,
} from './provider';
import { logger } from '../lib/logger';
import { aiUnavailable } from '../lib/errors';

/**
 * Simple rate limiter to avoid exceeding NIM upstream concurrency.
 */
class RateLimiter {
  private lastRequestAt = 0;
  private inFlight = 0;
  private readonly queue: (() => void)[] = [];

  constructor(
    private readonly minIntervalMs: number,
    private readonly maxConcurrency: number,
  ) {}

  async acquire(): Promise<void> {
    // If at concurrency limit, wait for a slot.
    while (this.inFlight >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    // Ensure minimum interval between requests.
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }

    this.lastRequestAt = Date.now();
    this.inFlight++;
  }

  release(): void {
    this.inFlight--;
    const next = this.queue.shift();
    if (next) next();
  }
}

/**
 * NVIDIA NIM provider backed by an OpenAI-compatible endpoint.
 */
export class NvidiaNimProvider implements AIProvider {
  readonly id = 'nvidia-nim';
  readonly name = 'NVIDIA NIM (FCC Server)';
  private readonly limiter: RateLimiter;

  constructor(private readonly config: NvidiaNimConfig) {
    this.limiter = new RateLimiter(
      config.minRequestIntervalMs,
      config.maxConcurrency,
    );
  }

  async getMetadata(): Promise<ProviderMetadata> {
    return {
      name: this.name,
      version: '1.0.0',
      models: [
        { id: this.config.defaultModel, type: 'chat' },
        { id: this.config.visionModel, type: 'vision' },
        { id: this.config.embeddingModel, type: 'embedding' },
      ],
    };
  }

  getDefaultModel(
    task: 'planning' | 'generation' | 'assessment' | 'qa' | 'vision' | 'embedding',
  ): string {
    switch (task) {
      case 'vision':
        return this.config.visionModel;
      case 'embedding':
        return this.config.embeddingModel;
      case 'planning':
        return this.config.planningModel ?? this.config.defaultModel;
      case 'generation':
        return this.config.generationModel ?? this.config.defaultModel;
      case 'assessment':
        return this.config.assessmentModel ?? this.config.defaultModel;
      case 'qa':
        return this.config.qaModel ?? this.config.defaultModel;
      default:
        return this.config.defaultModel;
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startedAt = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.doComplete(request, startedAt);
      } catch (err) {
        lastError = err;
        // Don't retry on 4xx (except 429) or schema validation errors.
        if (!isRetryable(err)) break;
        logger.warn(
          `NIM request failed (attempt ${attempt + 1}/${this.config.maxRetries + 1})`,
          { error: (err as Error).message },
        );
        if (attempt < this.config.maxRetries) {
          await sleep(exponentialBackoff(attempt));
        }
      }
    }

    const msg = lastError instanceof Error ? lastError.message : 'unknown error';
    throw aiUnavailable(`NVIDIA NIM request failed: ${msg}`);
  }

  private async doComplete(
    request: CompletionRequest,
    startedAt: number,
  ): Promise<CompletionResponse> {
    await this.limiter.acquire();
    try {
      const body = buildRequestBody(request);
      const url = `${this.config.baseUrl}/chat/completions`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`NIM HTTP ${res.status}: ${truncate(text, 500)}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const usage = data.usage ?? {};

        return {
          content,
          model: request.model,
          provider: this.id,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          latencyMs: Date.now() - startedAt,
          finishReason: data.choices?.[0]?.finish_reason ?? 'stop',
        };
      } finally {
        clearTimeout(timeout);
      }
    } finally {
      this.limiter.release();
    }
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamChunk> {
    await this.limiter.acquire();
    try {
      const body = buildRequestBody({ ...request, stream: true });
      const url = `${this.config.baseUrl}/chat/completions`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`NIM streaming HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') {
              yield { delta: '', done: true, model: request.model, provider: this.id };
              return;
            }
            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                yield { delta, done: false, model: request.model, provider: this.id };
              }
            } catch {
              // Skip malformed chunks.
            }
          }
        }

        yield { delta: '', done: true, model: request.model, provider: this.id };
      } finally {
        clearTimeout(timeout);
      }
    } finally {
      this.limiter.release();
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startedAt = Date.now();
    await this.limiter.acquire();
    try {
      const url = `${this.config.baseUrl}/embeddings`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({ input: request.input, model: request.model }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`NIM embedding HTTP ${res.status}`);
        }

        const data = await res.json();
        const embeddings = data.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];

        return {
          embeddings,
          model: request.model,
          provider: this.id,
          promptTokens: data.usage?.prompt_tokens,
          latencyMs: Date.now() - startedAt,
        };
      } finally {
        clearTimeout(timeout);
      }
    } finally {
      this.limiter.release();
    }
  }

  /**
   * Health is "can this thing answer a question", not "does it publish a model
   * catalogue". `GET /models` is optional in the OpenAI-style protocol — the
   * Cloudflare endpoint answers 405 — so asking for the catalogue reported a
   * perfectly working provider as down.
   *
   * A one-token completion costs almost nothing and tests what actually
   * matters, including whether the configured model exists.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      try {
        const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.defaultModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
        });
        return res.ok;
      } finally {
        this.limiter.release();
      }
    } catch {
      return false;
    }
  }
}

/**
 * Build the OpenAI-compatible request body.
 */
function buildRequestBody(request: CompletionRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages.map((m) => {
      const content: unknown[] = [{ type: 'text', text: m.content }];
      if (m.images && m.images.length > 0) {
        for (const img of m.images) {
          content.push({
            type: 'image_url',
            image_url: { url: `data:${img.mimeType};base64,${img.data}` },
          });
        }
      }
      return { role: m.role, content };
    }),
  };

  if (request.temperature !== undefined) body.temperature = request.temperature;
  if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

  if (request.responseFormat === 'json' || request.responseFormat === 'json_schema') {
    body.response_format = { type: 'json_object' };
  }
  if (request.responseFormat === 'json_schema' && request.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'result',
        schema: request.jsonSchema,
        strict: true,
      },
    };
  }

  if (request.stream) body.stream = true;

  return body;
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : '';
  // Retry on 429 and 5xx, not on 4xx (except 429) or abort (timeout).
  if (/HTTP 429/.test(msg)) return true;
  if (/HTTP 5\d\d/.test(msg)) return true;
  if (msg.includes('AbortError') || msg.includes('abort')) return false;
  return false;
}

function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}