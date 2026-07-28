import { config } from '../config/env';
import { UrlEntry, UrlEntryView } from '../types/url.types';

/**
 * Map a domain UrlEntry to its API DTO.
 * Dates become ISO strings; absent optional fields become null.
 */
export function toUrlEntryView(entry: UrlEntry): UrlEntryView {
  return {
    shortCode: entry.shortCode,
    shortUrl: `${config.baseUrl}/${entry.shortCode}`,
    originalUrl: entry.originalUrl,
    createdAt: entry.createdAt.toISOString(),
    visits: entry.visits,
    lastVisitedAt: entry.lastVisitedAt ? entry.lastVisitedAt.toISOString() : null,
    lastUserAgent: entry.lastUserAgent ?? null,
    lastReferer: entry.lastReferer ?? null,
  };
}

