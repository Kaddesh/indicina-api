import { IUrlRepository } from '../repositories/IUrlRepository';
import { NotFoundError } from '../errors/NotFoundError';
import { UrlEntry, VisitMetadata } from '../types/url.types';
import { generateShortCode } from '../utils/shortCodeGen';

/**
 * Service responsible for URL shortening business rules.
 *
 * Encoding algorithm:
 *   - Generate a random 7-char short code from a URL-safe alphabet.
 *   - On collision (vanishingly rare with a 56^7 space), regenerate.
 *   - On duplicate URL, return the existing short code (idempotency).
 *
 * Non-enumerable by construction — the counter approach was predictable.
 */
export class UrlService {
  constructor(private readonly repository: IUrlRepository) {}

  /**
   * Encode a long URL into a short URL entry.
   * Idempotent: encoding the same URL twice returns the same short code.
   * Returns `{ entry, created }` so callers can distinguish new vs. existing.
   */
  encode(originalUrl: string): { entry: UrlEntry; created: boolean } {
    const existing = this.repository.findByOriginalUrl(originalUrl);
    if (existing) return { entry: existing, created: false };

    const shortCode = this.generateUniqueShortCode();
    const entry: UrlEntry = {
      shortCode,
      originalUrl,
      createdAt: new Date(),
      visits: 0,
    };
    this.repository.save(entry);
    return { entry, created: true };
  }

  /**
   * Look up the original URL for a short code.
   * Throws NotFoundError if the code doesn't exist.
   */
  decode(shortCode: string): UrlEntry {
    return this.findByShortCodeOrThrow(shortCode);
  }

  /**
   * Return every stored entry, optionally filtered by a substring on the original URL.
   * Most recently created first.
   */
  list(query?: string): UrlEntry[] {
    return this.repository.findAll(query);
  }

  /**
   * Return stats for a short code.
   * Throws NotFoundError if the code doesn't exist.
   */
  getStatistics(shortCode: string): UrlEntry {
    return this.findByShortCodeOrThrow(shortCode);
  }

  /**
   * Record a visit and return the updated entry.
   * Throws NotFoundError if the code doesn't exist.
   */
  recordVisit(shortCode: string, metadata: VisitMetadata): UrlEntry {
    const updated = this.repository.recordVisit(shortCode, metadata);
    if (!updated) {
      throw new NotFoundError('Short URL', shortCode);
    }
    return updated;
  }

  /**
   * private helper for getting shortcode in memory
   * Throws NotFoundError if the code doesn't exist.
   */
  private findByShortCodeOrThrow(shortCode: string): UrlEntry {
    const entry = this.repository.findByShortCode(shortCode);
    if (!entry) {
      throw new NotFoundError('Short URL', shortCode);
    }
    return entry;
  }

  private generateUniqueShortCode(): string {
    // With a 56^7 ≈ 1.7e11 space, collisions are astronomically unlikely,
    // but we still defend against them so the contract is airtight.
    let shortCode: string;
    do {
      shortCode = generateShortCode();
    } while (this.repository.findByShortCode(shortCode) !== null);
    return shortCode;
  }
}
