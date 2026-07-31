import { UrlService } from './UrlService';
import { IUrlRepository } from '../repositories/IUrlRepository';
import { UrlEntry, VisitMetadata } from '../types/url.types';
import { NotFoundError } from '../errors/NotFoundError';

function createMockRepo(): jest.Mocked<IUrlRepository> {
  return {
    findByShortCode: jest.fn(),
    findByOriginalUrl: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    recordVisit: jest.fn(),
  };
}

const validEntry = (overrides: Partial<UrlEntry> = {}): UrlEntry => ({
  shortCode: 'AbCdEfG',
  originalUrl: 'https://example.com',
  createdAt: new Date('2025-01-01'),
  visits: 0,
  ...overrides,
});

describe('UrlService', () => {
  describe('encode', () => {
    it('creates a new entry when URL does not exist', () => {
      const repo = createMockRepo();
      repo.findByOriginalUrl.mockReturnValue(null);
      repo.findByShortCode.mockReturnValue(null);
      const service = new UrlService(repo);

      const result = service.encode('https://indicina.co');

      expect(result.created).toBe(true);
      expect(result.entry.originalUrl).toBe('https://indicina.co');
      expect(result.entry.shortCode).toHaveLength(7);
      expect(repo.save).toHaveBeenCalledWith(result.entry);
    });

    it('returns existing entry when URL was already encoded (idempotent)', () => {
      const repo = createMockRepo();
      const existing = validEntry({ originalUrl: 'https://example.com' });
      repo.findByOriginalUrl.mockReturnValue(existing);
      const service = new UrlService(repo);

      const result = service.encode('https://example.com');

      expect(result.created).toBe(false);
      expect(result.entry).toBe(existing);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('regenerates short code on collision', () => {
      const repo = createMockRepo();
      repo.findByOriginalUrl.mockReturnValue(null);
      const collision = validEntry({ shortCode: 'AAAAAAA' });
      repo.findByShortCode
        .mockReturnValueOnce(collision)
        .mockReturnValueOnce(null);
      const service = new UrlService(repo);

      const result = service.encode('https://collision.example');

      expect(result.created).toBe(true);
      // The second generated code (no collision) is what gets saved
      expect(result.entry.shortCode).toHaveLength(7);
      expect(repo.findByShortCode).toHaveBeenCalledTimes(2);
    });
  });

  describe('decode', () => {
    it('returns the entry for an existing short code', () => {
      const repo = createMockRepo();
      const entry = validEntry({ shortCode: 'AbCdEfG' });
      repo.findByShortCode.mockReturnValue(entry);
      const service = new UrlService(repo);

      const result = service.decode('AbCdEfG');

      expect(result).toBe(entry);
    });

    it('throws NotFoundError for an unknown short code', () => {
      const repo = createMockRepo();
      repo.findByShortCode.mockReturnValue(null);
      const service = new UrlService(repo);

      expect(() => service.decode('zzzzzzz')).toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('returns all entries when no query is given', () => {
      const repo = createMockRepo();
      const entries = [validEntry(), validEntry({ shortCode: 'XyZ1234' })];
      repo.findAll.mockReturnValue(entries);
      const service = new UrlService(repo);

      const result = service.list();

      expect(result).toEqual(entries);
      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('delegates query filtering to the repository', () => {
      const repo = createMockRepo();
      repo.findAll.mockReturnValue([]);
      const service = new UrlService(repo);

      service.list('example');

      expect(repo.findAll).toHaveBeenCalledWith('example');
    });
  });

  describe('getStatistics', () => {
    it('returns the entry for an existing short code', () => {
      const repo = createMockRepo();
      const entry = validEntry({ shortCode: 'Stats1' });
      repo.findByShortCode.mockReturnValue(entry);
      const service = new UrlService(repo);

      const result = service.getStatistics('Stats1');

      expect(result).toBe(entry);
    });

    it('throws NotFoundError for an unknown short code', () => {
      const repo = createMockRepo();
      repo.findByShortCode.mockReturnValue(null);
      const service = new UrlService(repo);

      expect(() => service.getStatistics('zzzzzzz')).toThrow(NotFoundError);
    });
  });

  describe('recordVisit', () => {
    it('records visit and returns updated entry', () => {
      const repo = createMockRepo();
      const updated = validEntry({ visits: 1, lastUserAgent: 'Mozilla' });
      repo.recordVisit.mockReturnValue(updated);
      const service = new UrlService(repo);
      const metadata: VisitMetadata = { visitedAt: new Date(), userAgent: 'Mozilla' };

      const result = service.recordVisit('AbCdEfG', metadata);

      expect(result).toBe(updated);
      expect(repo.recordVisit).toHaveBeenCalledWith('AbCdEfG', metadata);
    });

    it('throws NotFoundError when short code does not exist', () => {
      const repo = createMockRepo();
      repo.recordVisit.mockReturnValue(null);
      const service = new UrlService(repo);

      expect(() => service.recordVisit('zzzzzzz', { visitedAt: new Date() })).toThrow(NotFoundError);
    });
  });
});
