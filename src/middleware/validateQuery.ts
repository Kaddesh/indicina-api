import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/ValidationError';

/**
 * Middleware factory that validates req.query against a Zod schema.
 * On success, the parsed value replaces req.query.
 * On failure, throws a ValidationError with structured details.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Query parameter validation failed', details));
      return;
    }
    // Express 5 makes req.query a getter-only; assign to a known-safe property
    Object.assign(req.query, result.data);
    next();
  };
}

