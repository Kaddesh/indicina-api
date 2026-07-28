import { UrlEntry, VisitMetadata } from '../types/url.types';
import { IUrlRepository } from './IUrlRepository';

/**
 * In-memory implementation of IUrlRepository.
 *
 * Data is lost on process restart (per the assignment brief).
 * The interface allows us to swap this for a persistent store
 * without changing the service layer.
 */
export class InMemoryUrlRepository implements IUrlRepository {
  private readonly byShortCode: Map<string, UrlEntry> = new Map();
  private readonly byOriginalUrl: Map<string, UrlEntry> = new Map();

  findByShortCode(shortCode: string): UrlEntry | null {
    return this.byShortCode.get(shortCode) ?? null;
  }

  findByOriginalUrl(originalUrl: string): UrlEntry | null {
    return this.byOriginalUrl.get(originalUrl) ?? null;
  }

  save(entry: UrlEntry): void {
    if (this.byShortCode.has(entry.shortCode)) {
      throw new Error(`Short code already exists: ${entry.shortCode}`);
    }
    this.byShortCode.set(entry.shortCode, entry);
    this.byOriginalUrl.set(entry.originalUrl, entry);
  }

  findAll(query?: string): UrlEntry[] {
    const all = Array.from(this.byShortCode.values());
    const filtered = query
      ? all.filter((entry) => entry.originalUrl.toLowerCase().includes(query.toLowerCase()))
      : all;
    // Most recently created first
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  recordVisit(shortCode: string, metadata: VisitMetadata): UrlEntry | null {
    const entry = this.byShortCode.get(shortCode);
    if (!entry) return null;

    const updated: UrlEntry = {
      ...entry,
      visits: entry.visits + 1,
      lastVisitedAt: metadata.visitedAt,
      lastUserAgent: metadata.userAgent,
      lastReferer: metadata.referer,
    };
    this.byShortCode.set(shortCode, updated);
    // byOriginalUrl still points to the same logical entry; replace reference too
    this.byOriginalUrl.set(updated.originalUrl, updated);
    return updated;
  }
}

