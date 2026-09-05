/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  PROLINK DATABASE COLLISION HANDLER & RETRY ENGINE               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Catches database unique constraint violations (PostgreSQL error 23505),
 * regenerates identifiers, and retries with jittered exponential backoff.
 */

import { generateUUID } from '../security/distributedId';

export interface CollisionRetryOptions {
  maxRetries?: number;        // Maximum number of collision retries (default: 3)
  baseDelayMs?: number;       // Base delay in milliseconds (default: 100ms)
  maxDelayMs?: number;        // Maximum delay cap in milliseconds (default: 1500ms)
  scope?: string;             // Optional label for error diagnostics
}

/**
 * Checks if a given error or Supabase response represents a primary key or unique violation.
 * PostgreSQL code: 23505 = unique_violation
 */
export function isUniqueViolation(error: any): boolean {
  if (!error) return false;
  if (error.code === '23505') return true;
  const msg = (error.message || error.details || '').toLowerCase();
  return (
    msg.includes('duplicate key') ||
    msg.includes('unique constraint') ||
    msg.includes('already exists') ||
    msg.includes('23505')
  );
}

/**
 * Wraps a database insert/upsert task with collision-detection and automatic ID re-generation.
 *
 * @param task Callback receiving the current attempt index and a newly generated UUID
 * @param options Retry options
 */
export async function withCollisionRetry<T>(
  task: (attempt: number, freshId: string) => Promise<T>,
  options: CollisionRetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 1500;
  const scope = options.scope ?? 'Database';

  let attempt = 0;

  while (attempt <= maxRetries) {
    const currentId = generateUUID();

    try {
      const result: any = await task(attempt, currentId);

      // Check if the result is a Supabase response with an error
      if (result && result.error && isUniqueViolation(result.error)) {
        if (attempt >= maxRetries) {
          console.error(`[${scope}] Max collision retries (${maxRetries}) exhausted:`, result.error);
          return result;
        }

        attempt++;
        const jitter = Math.random() * 40;
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);

        console.warn(`[${scope}] ID Collision detected (Code 23505). Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delay)}ms with new ID...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      return result;
    } catch (err: any) {
      if (isUniqueViolation(err) && attempt < maxRetries) {
        attempt++;
        const jitter = Math.random() * 40;
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);

        console.warn(`[${scope}] ID Collision caught in exception. Retrying attempt ${attempt}/${maxRetries} in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      throw err;
    }
  }

  throw new Error(`[${scope}] Collision retry loop terminated unexpectedly.`);
}
