import { generateShortCode, SHORT_CODE_PATTERN } from './shortCodeGen';

describe('generateShortCode', () => {
  it('generates a code of default length 7', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
  });

  it('generates a code of custom length', () => {
    const code = generateShortCode(12);
    expect(code).toHaveLength(12);
  });

  it('contains only characters from the URL-safe alphabet', () => {
    const code = generateShortCode();
    expect(code).toMatch(SHORT_CODE_PATTERN);
  });

  it('excludes ambiguous characters (0, O, 1, l, I)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateShortCode();
      expect(code).not.toContain('0');
      expect(code).not.toContain('O');
      expect(code).not.toContain('1');
      expect(code).not.toContain('l');
      expect(code).not.toContain('I');
    }
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode());
    }
    expect(codes.size).toBeGreaterThan(1);
  });

  it('SHORT_CODE_PATTERN matches generated codes', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShortCode();
      expect(SHORT_CODE_PATTERN.test(code)).toBe(true);
    }
  });

  it('SHORT_CODE_PATTERN rejects invalid codes', () => {
    expect(SHORT_CODE_PATTERN.test('')).toBe(false);
    expect(SHORT_CODE_PATTERN.test('short12')).toBe(false);
    expect(SHORT_CODE_PATTERN.test('ABCDEF1')).toBe(false);
    expect(SHORT_CODE_PATTERN.test('ABCDEFG8')).toBe(false);
  });
});
