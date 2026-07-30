import { z } from 'zod';

/**
 * Query schema for GET /api/list.
 * Optional `q` parameter for substring search on original URLs.
 */
export const listQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(3, 'Search query must be at least 3 characters')
    .optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
