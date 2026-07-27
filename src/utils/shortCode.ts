/**
 * Normalize input to a short code.
 * Accepts either a full short URL ("http://short.est/GeAi9K") or a raw code ("GeAi9K").
 * Returns the trailing path segment of the URL, or the trimmed input if not a URL.
 */
export function extractShortCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Try to parse as a URL. If it works, take the last non-empty path segment.
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  } catch {
    // Not a URL — fall through to return the trimmed input as a raw code.
  }
  return trimmed;
}

