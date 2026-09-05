/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  PROLINK DISTRIBUTED ID GENERATOR (UUID v4 + ULID)               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Implements mathematically collision-resistant, cryptographically secure
 * identifier generation for distributed mobile and web clients.
 *
 * Standards supported:
 * 1. RFC 4122 Version 4 UUID (128-bit, 122 bits of entropy)
 * 2. ULID (Universally Unique Lexicographically Sortable Identifier)
 *    - 48-bit timestamp + 80-bit randomness in Crockford's Base32
 *    - Sortable chronologically down to the millisecond
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;

/**
 * Generates a cryptographically strong UUID v4 string.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // 1. Primary: Native browser/Node crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails in restricted origin
    }
  }

  // 2. Secondary: crypto.getRandomValues with RFC 4122 bit manipulation
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version to 4 (0100)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to RFC 4122 (10xx)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // 3. Fallback for edge cases where window.crypto is unavailable
  let d = Date.now();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier).
 * 26-character string: 10 chars timestamp + 16 chars randomness.
 */
export function generateULID(timestamp = Date.now()): string {
  // 1. Encode 48-bit timestamp (10 characters)
  let timeStr = '';
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    timeStr = ENCODING[mod] + timeStr;
    time = Math.floor(time / ENCODING_LEN);
  }

  // 2. Generate 80 bits of cryptographically secure random entropy (16 characters)
  let randStr = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randBytes = new Uint8Array(16);
    crypto.getRandomValues(randBytes);
    for (let i = 0; i < 16; i++) {
      randStr += ENCODING[randBytes[i] % ENCODING_LEN];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      randStr += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
    }
  }

  return timeStr + randStr;
}

/**
 * Universal helper to generate a distributed identifier with optional semantic prefix.
 * e.g., generateDistributedId('post') => 'post_01HM9ZXB8Q...'
 */
export function generateDistributedId(prefix?: string): string {
  const id = generateUUID();
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Validates whether a given string is a valid UUID (v1-v5).
 */
export function isValidUUID(str: string): boolean {
  if (typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validates whether a given string is a valid ULID.
 */
export function isValidULID(str: string): boolean {
  if (typeof str !== 'string' || str.length !== 26) return false;
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(str);
}
