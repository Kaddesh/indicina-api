import { z } from 'zod';

/**
 * Validation schema for POST /api/encode.
 *
 * Rules:
 *  - originalUrl is required and must be a non-empty string
 *  - must be a valid URL
 *  - must use http or https scheme
 */
export const encodeSchema = z.object({
  originalUrl: z
    .string({ required_error: 'originalUrl is required' })
    .trim()
    .min(1, 'originalUrl must not be empty')
    .url('originalUrl must be a valid URL')
    .refine((value) => /^https?:\/\//i.test(value), {
      message: 'originalUrl must start with http:// or https://',
    }),
});

export type EncodeInput = z.infer<typeof encodeSchema>;

