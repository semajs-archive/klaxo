/** Typed application errors that map cleanly onto HTTP responses. */

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'AI_SCHEMA_INVALID'
  | 'AI_TIMEOUT'
  | 'PIPELINE_FAILED'
  | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
  AI_SCHEMA_INVALID: 502,
  AI_TIMEOUT: 504,
  PIPELINE_FAILED: 500,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new AppError('BAD_REQUEST', m, d);
export const notFound = (m: string) => new AppError('NOT_FOUND', m);
export const conflict = (m: string) => new AppError('CONFLICT', m);
export const unauthorized = (m = 'Sign in required.') => new AppError('UNAUTHORIZED', m);
export const rateLimited = (m = 'Too many requests.') => new AppError('RATE_LIMITED', m);
export const aiUnavailable = (m: string, d?: unknown) => new AppError('AI_UNAVAILABLE', m, d);
export const pipelineFailed = (m: string, d?: unknown) => new AppError('PIPELINE_FAILED', m, d);

/** Narrow an unknown thrown value into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    if (err.name === 'AbortError' || /timed? ?out/i.test(err.message)) {
      return new AppError('AI_TIMEOUT', err.message);
    }
    return new AppError('INTERNAL', err.message);
  }
  return new AppError('INTERNAL', 'Unexpected error.');
}
