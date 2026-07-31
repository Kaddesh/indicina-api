import { extractShortCode } from './shortCode';

describe('extractShortCode', () => {
  it('extracts the trailing path segment from a full short URL', () => {
    expect(extractShortCode('http://short.est/GeAi9K')).toBe('GeAi9K');
  });

  it('returns the input when it is a raw short code (not a URL)', () => {
    expect(extractShortCode('GeAi9K')).toBe('GeAi9K');
  });

  it('handles a URL with multiple path segments', () => {
    expect(extractShortCode('https://short.est/a/b/c')).toBe('c');
  });

  it('handles a URL with trailing slash', () => {
    expect(extractShortCode('https://short.est/AbCdEfG/')).toBe('AbCdEfG');
  });

  it('returns empty string for empty input', () => {
    expect(extractShortCode('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(extractShortCode('   ')).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(extractShortCode('  https://short.est/Code123  ')).toBe('Code123');
  });

  it('works with http scheme', () => {
    expect(extractShortCode('http://short.est/XyZ789')).toBe('XyZ789');
  });
});
