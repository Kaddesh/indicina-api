import { IUrlRepository } from '../repositories/IUrlRepository';
import { NotFoundError } from '../errors/NotFoundError';
import { UrlEntry, VisitMetadata } from '../types/url.types';
import { generateShortCode } from '../utils/shortCodeGen';

/**
 * Service responsible for URL shortening business rules.
 *
 * Encoding algorithm:
 *   - Generate a random 7-char short code from a URL-safe alphabet.
 *   - On collision (vanishingly rare with a 44^7 space), regenerate.
 *   - On duplicate URL, return the existing short code (idempotency).
 *
 * Non-enumerable by construction — the counter approach was predictable.
 */
export class UrlService {
  constructor(private readonly repository: IUrlRepository) {}

  /**
   * Encode a long URL into a short URL entry.
   * Idempotent: encoding the same URL twice returns the same short code.
   */
  encode(originalUrl: string): UrlEntry {
    const existing = this.repository.findByOriginalUrl(originalUrl);
    if (existing) return existing;

    const shortCode = this.generateUniqueShortCode();
    const entry: UrlEntry = {
      shortCode,
      originalUrl,
      createdAt: new Date(),
      visits: 0,
    };
    this.repository.save(entry);
    return entry;
  }

  /**
   * Look up the original URL for a short code.
   * Throws NotFoundError if the code doesn't exist.
   */
  decode(shortCode: string): UrlEntry {
    const entry = this.repository.findByShortCode(shortCode);
    if (!entry) {
      throw new NotFoundError('Short URL', shortCode);
    }
    return entry;
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
    const entry = this.repository.findByShortCode(shortCode);
    if (!entry) {
      throw new NotFoundError('Short URL', shortCode);
    }
    return entry;
  }


   private generateUniqueShortCode(): string {
    // With a 44^7 ≈ 1.6e11 space, collisions are astronomically unlikely,
    // but we still defend against them so the contract is airtight.
    let shortCode: string;
    do {
      shortCode = generateShortCode();
    } while (this.repository.findByShortCode(shortCode) !== null);
    return shortCode;
  }
}

