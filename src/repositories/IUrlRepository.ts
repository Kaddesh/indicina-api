import { UrlEntry, VisitMetadata } from '../types/url.types';

/**
 * Contract for URL storage.
 *
 * Following the Dependency Inversion Principle, the service layer
 * depends on this interface, not on any concrete implementation.
 */
export interface IUrlRepository {
  /**
   * Look up an entry by its short code.
   * Returns null if not found.
   */
  findByShortCode(shortCode: string): UrlEntry | null;

  /**
   * Look up an entry by its original URL.
   * Used for idempotent encoding.
   * Returns null if not found.
   */
  findByOriginalUrl(originalUrl: string): UrlEntry | null;

  /**
   * Persist a new entry.
   * Throws if the short code already exists.
   */
  save(entry: UrlEntry): void;

  /**
   * Return every stored entry, most recently created first.
   * Optionally filter by a case-insensitive substring on the original URL.
   */
  findAll(query?: string): UrlEntry[];

  /**
   * Atomically record a visit: increment counter + update last-visited fields.
   * Returns the updated entry, or null if the short code doesn't exist.
   */
  recordVisit(shortCode: string, metadata: VisitMetadata): UrlEntry | null;
}

