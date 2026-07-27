import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/ValidationError';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success, the parsed (and possibly transformed) value replaces req.body.
 * On failure, throws a ValidationError with structured details.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Request body validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

