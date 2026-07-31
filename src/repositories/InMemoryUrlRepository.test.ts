import { InMemoryUrlRepository } from './InMemoryUrlRepository';
import { UrlEntry, VisitMetadata } from '../types/url.types';

const baseEntry = (overrides: Partial<UrlEntry> = {}): UrlEntry => ({
  shortCode: 'AbCdEfG',
  originalUrl: 'https://example.com',
  createdAt: new Date('2025-01-01'),
  visits: 0,
  ...overrides,
});

describe('InMemoryUrlRepository', () => {
  let repo: InMemoryUrlRepository;

  beforeEach(() => {
    repo = new InMemoryUrlRepository();
  });

  describe('save', () => {
    it('persists a new entry', () => {
      const entry = baseEntry();
      repo.save(entry);

      expect(repo.findByShortCode('AbCdEfG')).toEqual(entry);
      expect(repo.findByOriginalUrl('https://example.com')).toEqual(entry);
    });

    it('throws when saving a duplicate short code', () => {
      repo.save(baseEntry());

      expect(() => repo.save(baseEntry())).toThrow(
        'Short code already exists: AbCdEfG',
      );
    });
  });

  describe('findByShortCode', () => {
    it('returns the entry when found', () => {
      const entry = baseEntry();
      repo.save(entry);

      expect(repo.findByShortCode('AbCdEfG')).toEqual(entry);
    });

    it('returns null when not found', () => {
      expect(repo.findByShortCode('unknown')).toBeNull();
    });
  });

  describe('findByOriginalUrl', () => {
    it('returns the entry when found', () => {
      const entry = baseEntry();
      repo.save(entry);

      expect(repo.findByOriginalUrl('https://example.com')).toEqual(entry);
    });

    it('returns null when not found', () => {
      expect(repo.findByOriginalUrl('https://unknown.com')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns an empty array when no entries exist', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('returns all entries most-recently-created first', () => {
      const old = baseEntry({
        shortCode: 'Old1234',
        originalUrl: 'https://old.example',
        createdAt: new Date('2024-01-01'),
      });
      const recent = baseEntry({
        shortCode: 'New5678',
        originalUrl: 'https://recent.example',
        createdAt: new Date('2025-01-01'),
      });
      repo.save(old);
      repo.save(recent);

      const result = repo.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].shortCode).toBe('New5678');
      expect(result[1].shortCode).toBe('Old1234');
    });

    it('filters by case-insensitive query substring', () => {
      repo.save(baseEntry({ shortCode: 'F001', originalUrl: 'https://example.com/FOO' }));
      repo.save(baseEntry({ shortCode: 'B002', originalUrl: 'https://example.com/bar' }));
      repo.save(baseEntry({ shortCode: 'F003', originalUrl: 'https://other.com/foo' }));

      const result = repo.findAll('foo');

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.shortCode).sort()).toEqual(['F001', 'F003']);
    });
  });

  describe('recordVisit', () => {
    it('increments visits and sets metadata', () => {
      const entry = baseEntry();
      repo.save(entry);
      const metadata: VisitMetadata = {
        visitedAt: new Date('2025-06-01T12:00:00Z'),
        userAgent: 'test-agent',
        referer: 'https://ref.example',
      };

      const updated = repo.recordVisit('AbCdEfG', metadata);

      expect(updated).not.toBeNull();
      expect(updated!.visits).toBe(1);
      expect(updated!.lastVisitedAt).toEqual(metadata.visitedAt);
      expect(updated!.lastUserAgent).toBe('test-agent');
      expect(updated!.lastReferer).toBe('https://ref.example');
    });

    it('increments visits on multiple visits', () => {
      repo.save(baseEntry());
      repo.recordVisit('AbCdEfG', { visitedAt: new Date() });
      repo.recordVisit('AbCdEfG', { visitedAt: new Date() });
      repo.recordVisit('AbCdEfG', { visitedAt: new Date() });

      const entry = repo.findByShortCode('AbCdEfG');
      expect(entry!.visits).toBe(3);
    });

    it('updates the entry in both maps', () => {
      repo.save(baseEntry());
      const metadata: VisitMetadata = {
        visitedAt: new Date(),
        userAgent: 'agent',
      };

      repo.recordVisit('AbCdEfG', metadata);

      const byCode = repo.findByShortCode('AbCdEfG');
      const byUrl = repo.findByOriginalUrl('https://example.com');
      expect(byCode!.visits).toBe(1);
      expect(byUrl!.visits).toBe(1);
    });

    it('returns null for unknown short code', () => {
      const result = repo.recordVisit('zzzzzzz', { visitedAt: new Date() });

      expect(result).toBeNull();
    });
  });
});
