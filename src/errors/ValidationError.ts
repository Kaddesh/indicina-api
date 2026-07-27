import { AppError } from './AppError';

/**
 * Thrown when user input fails validation.
 * Maps to HTTP 400.
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

