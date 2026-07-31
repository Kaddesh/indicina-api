import { randomBytes } from 'crypto';

/**
 * URL-safe short-code generation.
 *
 * Alphabet: 56 chars (lowercase + uppercase + digits), with ambiguous
 * characters removed (0/O, 1/l/I). 7 chars from a 56-char alphabet
 * gives 56^7 ≈ 1.7e11 possible codes — collision-resistant for
 * any realistic in-memory app.
 *
 * Uses Node's crypto.randomBytes with rejection sampling to avoid
 * modulo bias.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const ALPHABET_LEN = ALPHABET.length;
const CODE_LENGTH = 7;

// Rejection threshold: largest multiple of ALPHABET_LEN within [0, 255).
// Values ≥ MAX_VALID are discarded to ensure uniform distribution.
const MAX_VALID = 256 - (256 % ALPHABET_LEN); // 224

export function generateShortCode(length: number = CODE_LENGTH): string {
  let out = '';
  while (out.length < length) {
    const bytes = randomBytes(length - out.length);
    for (const b of bytes) {
      if (out.length >= length) break;
      if (b < MAX_VALID) {
        out += ALPHABET[b % ALPHABET_LEN];
      }
    }
  }
  return out;
}

/** Regex matching exactly what generateShortCode produces. */
export const SHORT_CODE_PATTERN = /^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{7}$/;

/**
 * String pattern for Express route param constraints.
 * Use it as: app.get('/:url_path(PATTERN_STRING)', handler)
 * The pattern is a string because Express' path-to-regexp compiles it.
 */
export const SHORT_CODE_ROUTE_PATTERN =
  '[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{7}';
