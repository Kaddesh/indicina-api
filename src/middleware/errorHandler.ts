import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { NotFoundError } from '../errors/NotFoundError';
import { ValidationError } from '../errors/ValidationError';
import { ApiError } from '../types/api.types';

/**
 * Global error-handling middleware.
 *
 * Always returns JSON. Never lets Express's default HTML error page
 * leak to the client. Must be registered LAST in the middleware chain.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {

  // Body-parser errors (malformed JSON, oversized payloads) are plain http-errors
// from express.json() — not AppError instances — so they must be detected here.
  const parserError = getBodyParserError(err);
  if (parserError) {
    const body: ApiError = {
      success: false,
      error: {
        code: parserError.code,
        message: parserError.message,
      },
    };
    res.status(parserError.statusCode).json(body);
    return;
  }

  // Validation: thrown by validate middleware
  if (err instanceof ValidationError) {
    const body: ApiError = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Stray Zod errors (shouldn't reach here because validate catches them, but be safe)
  if (err instanceof ZodError) {
    const body: ApiError = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.issues,
      },
    };
    res.status(400).json(body);
    return;
  }

  // NotFound: used by decode and lookup
  if (err instanceof NotFoundError) {
    const body: ApiError = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Any other AppError (custom status code)
  if (err instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / programmer error — log full stack, return generic message
  console.error('[Unhandled error]', err);
  const body: ApiError = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  };
  res.status(500).json(body);
}

function getBodyParserError(
  err: unknown,
): { statusCode: number; code: string; message: string } | null {
  if (!err || typeof err !== 'object') return null;

  const candidate = err as { status?: unknown; statusCode?: unknown; type?: unknown };
  const statusCode =
    typeof candidate.status === 'number'
      ? candidate.status
      : typeof candidate.statusCode === 'number'
        ? candidate.statusCode
        : undefined;

  if (candidate.type === 'entity.parse.failed' && statusCode === 400) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request body contains malformed JSON',
    };
  }

  if (candidate.type === 'entity.too.large' && statusCode === 413) {
    return {
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large',
    };
  }

  return null;
}
