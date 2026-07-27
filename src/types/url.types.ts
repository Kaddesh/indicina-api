/**
 * Domain model for a shortened URL entry.
 * Lives in storage (in-memory for now, swappable for DB later).
 */
export interface UrlEntry {
  shortCode: string;
  originalUrl: string;
  createdAt: Date;
  visits: number;
  lastVisitedAt?: Date;
  lastUserAgent?: string;
  lastReferer?: string;
}

/**
 * Encode request body (incoming DTO).
 */
export interface EncodeRequestBody {
  originalUrl: string;
}

/**
 * Encode response data (outgoing DTO).
 */
export interface EncodeResponseData {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string; // ISO 8601
}

/**
 * Decode response data.
 */
export interface DecodeResponseData {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
}

/**
 * A single entry as returned by /api/list and /api/statistic.
 */
export interface UrlEntryView {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  visits: number;
  lastVisitedAt: string | null;
  lastUserAgent: string | null;
  lastReferer: string | null;
}

/**
 * Metadata captured on each redirect (visit) event.
 */
export interface VisitMetadata {
  visitedAt: Date;
  userAgent?: string;
  referer?: string;
}

