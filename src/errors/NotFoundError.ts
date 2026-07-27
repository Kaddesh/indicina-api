import { AppError } from './AppError';

/**
 * Thrown when a requested resource does not exist.
 * Maps to HTTP 404.
 *
 * NOTE: Declared now for completeness, used in the decode/list slice.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 404, 'NOT_FOUND', { resource, identifier });
  }
}

