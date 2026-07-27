import { randomBytes } from 'crypto';

/**
 * URL-safe short-code generation.
 *
 * Alphabet: 56 chars (lowercase + uppercase + digits), with ambiguous
 * characters removed (0/O, 1/l/I). 7 chars from a 56-char alphabet
 * gives 56^7 ≈ 1.7e11 possible codes — collision-resistant for
 * any realistic in-memory app.
 *
 * Uses Node's crypto.randomBytes for cryptographic randomness.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const ALPHABET_LEN = ALPHABET.length;
const CODE_LENGTH = 7;

export function generateShortCode(length: number = CODE_LENGTH): string {
  // Rejection sampling would be perfect but adds complexity; a tiny modulo
  // bias on a 56-char alphabet with 256 % 56 = 32 wasted bytes is acceptable
  // for this use case.
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET_LEN];
  }
  return out;
}

export const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

