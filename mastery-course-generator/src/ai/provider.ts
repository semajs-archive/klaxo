/**
 * AI Provider Abstraction Layer
 *
 * Defines the contract that all AI providers (NVIDIA NIM, mock, etc.) must implement.
 * The rest of the application depends only on this interface.
 */
import { z } from 'zod';

/**
 * Standard message format for chat completions.
 */
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  images: z.array(z.string()).optional(), // base64 encoded images
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Request for a completion.
 */
export const CompletionRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  responseFormat: z.enum(['text', 'json', 'json_schema']).optional(),
  jsonSchema: z.record(z.string(), z.unknown()).optional(),
  stream: z.boolean().optional(),
});

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

/**
 * Response from a completion.
 */
export const CompletionResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  provider: z.string(),
  promptTokens: z.number().int().optional(),
  completionTokens: z.number().int().optional(),
  latencyMs: z.number().int().optional(),
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter', 'error']).optional(),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

/**
 * Streaming chunk from a completion.
 */
export const StreamChunkSchema = z.object({
  delta: z.string(),
  done: z.boolean(),
  model: z.string(),
  provider: z.string(),
});

export type StreamChunk = z.infer<typeof StreamChunkSchema>;

/**
 * Embedding request.
 */
export const EmbeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;

/**
 * Embedding response.
 */
export const EmbeddingResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())),
  model: z.string(),
  provider: z.string(),
  promptTokens: z.number().int().optional(),
  latencyMs: z.number().int().optional(),
});

export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;

/**
 * Provider metadata.
 */
export const ProviderMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  models: z.array(z.object({
    id: z.string(),
    type: z.enum(['chat', 'vision', 'embedding']),
    maxTokens: z.number().int().optional(),
    supportsJsonSchema: z.boolean().optional(),
    supportsStreaming: z.boolean().optional(),
  })),
});

export type ProviderMetadata = z.infer<typeof ProviderMetadataSchema>;

/**
 * Core AI Provider interface.
 * All provider implementations must satisfy this contract.
 */
export interface AIProvider {
  /**
   * Unique provider identifier (e.g., 'nvidia-nim', 'mock').
   */
  readonly id: string;

  /**
   * Human-readable provider name.
   */
  readonly name: string;

  /**
   * Get provider metadata including available models.
   */
  getMetadata(): Promise<ProviderMetadata>;

  /**
   * Generate a completion (non-streaming).
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Generate a completion with streaming.
   */
  streamComplete(request: CompletionRequest): AsyncIterable<StreamChunk>;

  /**
   * Generate embeddings.
   */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * Check if the provider is healthy/available.
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get the default model for a given task type.
   */
  getDefaultModel(task: 'planning' | 'generation' | 'assessment' | 'qa' | 'vision' | 'embedding'): string;
}

/**
 * Configuration for provider selection.
 */
export interface ProviderConfig {
  provider: 'nvidia-nim' | 'mock';
  nim?: NvidiaNimConfig;
}

/**
 * NVIDIA NIM specific configuration.
 */
export interface NvidiaNimConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  visionModel: string;
  embeddingModel: string;
  planningModel?: string;
  generationModel?: string;
  assessmentModel?: string;
  qaModel?: string;
  enableEmbeddings: boolean;
  maxRetries: number;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
  minRequestIntervalMs: number;
  maxConcurrency: number;
}

/**
 * Model routing configuration.
 * Maps pipeline stages to specific models.
 */
export const ModelRoutingSchema = z.object({
  planning: z.string(),
  generation: z.string(),
  assessment: z.string(),
  qa: z.string(),
  vision: z.string(),
  embedding: z.string(),
});

export type ModelRouting = z.infer<typeof ModelRoutingSchema>;

/**
 * Create model routing from environment configuration.
 */
export function createModelRouting(config: NvidiaNimConfig): ModelRouting {
  return {
    planning: config.planningModel ?? config.defaultModel,
    generation: config.generationModel ?? config.defaultModel,
    assessment: config.assessmentModel ?? config.defaultModel,
    qa: config.qaModel ?? config.defaultModel,
    vision: config.visionModel,
    embedding: config.embeddingModel,
  };
}