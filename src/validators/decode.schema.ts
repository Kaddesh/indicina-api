import { z } from 'zod';

/**
 * Query schema for GET /api/decode.
 * Accepts either a full short URL (?url=...) or a raw short code (?shortCode=...).
 * At least one is required.
 */
export const decodeQuerySchema = z
  .object({
    url: z.string().min(1, 'url must not be empty').optional(),
    shortCode: z.string().min(1, 'shortCode must not be empty').optional(),
  })
  .refine((data) => Boolean(data.url) || Boolean(data.shortCode), {
    message: 'Either url or shortCode query parameter is required',
  });

export type DecodeQuery = z.infer<typeof decodeQuerySchema>;

