import { z } from 'zod';

/**
 * Query schema for GET /api/list.
 * Optional `q` parameter for substring search on original URLs.
 */
export const listQuerySchema = z.object({
  q: z.string().min(1).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

