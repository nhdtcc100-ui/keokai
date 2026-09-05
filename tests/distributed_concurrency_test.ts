/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  PROLINK DISTRIBUTED ARCHITECTURE & CONCURRENCY TEST SUITE       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Validates:
 * 1. UUID v4 correctness and 0 collision across 1,000 generations
 * 2. ULID lexicographical sortability & format
 * 3. Keyed Async Mutex serialization (preventing race conditions)
 * 4. Idempotency Engine in-flight deduplication & TTL caching
 * 5. Collision Retry logic on PostgreSQL error 23505
 */

import { generateUUID, generateULID, isValidUUID, isValidULID, generateDistributedId } from '../src/lib/security/distributedId';
import { withMutex } from '../src/lib/services/concurrencyMutex';
import { idempotencyEngine, withIdempotency } from '../src/lib/services/idempotencyEngine';
import { withCollisionRetry, isUniqueViolation } from '../src/lib/services/collisionHandler';

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 Starting ProLink Distributed Architecture Tests...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: UUID v4 Format & Uniqueness ────────────────────────────────
  console.log('--- 1. Testing UUID v4 Generation ---');
  const sampleUUID = generateUUID();
  assert(isValidUUID(sampleUUID), `Generated UUID is valid RFC4122: ${sampleUUID}`);

  const uuidSet = new Set<string>();
  const TOTAL_UUIDS = 1000;
  for (let i = 0; i < TOTAL_UUIDS; i++) {
    uuidSet.add(generateUUID());
  }
  assert(uuidSet.size === TOTAL_UUIDS, `Zero collision over ${TOTAL_UUIDS} generated UUIDs`);

  // ── TEST 2: ULID Format & Lexicographical Sortability ──────────────────
  console.log('\n--- 2. Testing ULID Generation & Sortability ---');
  const sampleULID = generateULID();
  assert(isValidULID(sampleULID), `Generated ULID is valid 26-char Base32: ${sampleULID}`);

  const ulid1 = generateULID(1700000000000);
  const ulid2 = generateULID(1700000005000);
  assert(ulid1 < ulid2, `ULID generated at t+5000ms correctly sorts after earlier ULID`);

  const prefixed = generateDistributedId('post');
  assert(prefixed.startsWith('post_') && isValidUUID(prefixed.replace('post_', '')), `Distributed ID with prefix works correctly`);

  // ── TEST 3: Keyed Async Mutex Serialization ────────────────────────────
  console.log('\n--- 3. Testing Keyed Async Mutex Serialization ---');
  const executionOrder: number[] = [];
  const mutexKey = 'test_resource_user_1';

  async function delayedTask(id: number, delayMs: number) {
    return withMutex(mutexKey, async () => {
      executionOrder.push(id * 10); // Start marker
      await new Promise(res => setTimeout(res, delayMs));
      executionOrder.push(id * 10 + 1); // End marker
      return id;
    });
  }

  // Launch 3 tasks concurrently
  await Promise.all([
    delayedTask(1, 30),
    delayedTask(2, 20),
    delayedTask(3, 10),
  ]);

  // If mutex works, each task must complete (start then end) before the next starts:
  // [10, 11, 20, 21, 30, 31]
  const isSerialized = 
    executionOrder[0] === 10 && executionOrder[1] === 11 &&
    executionOrder[2] === 20 && executionOrder[3] === 21 &&
    executionOrder[4] === 30 && executionOrder[5] === 31;
  assert(isSerialized, `Mutex strictly serialized 3 concurrent tasks: ${JSON.stringify(executionOrder)}`);

  // ── TEST 4: Idempotency Engine Deduplication & Caching ─────────────────
  console.log('\n--- 4. Testing Idempotency Engine ---');
  let mutationExecCount = 0;
  const idempotencyKey = idempotencyEngine.generateKey('test_action', 'user_42', { action: 'pay' });

  async function mockMutation() {
    return withIdempotency(idempotencyKey, async () => {
      mutationExecCount++;
      await new Promise(res => setTimeout(res, 20));
      return { success: true, timestamp: Date.now() };
    }, { ttlMs: 2000 });
  }

  // Execute 3 identical requests simultaneously (simulate double/triple click)
  const results = await Promise.all([
    mockMutation(),
    mockMutation(),
    mockMutation()
  ]);

  assert(mutationExecCount === 1, `Underlying database mutation executed exactly once (execCount=${mutationExecCount})`);
  assert(results[0].timestamp === results[1].timestamp && results[1].timestamp === results[2].timestamp, `All 3 callers received the identical response signature`);

  // Subsequent call within TTL should return cached result
  const cachedCall = await mockMutation();
  assert(cachedCall.timestamp === results[0].timestamp && mutationExecCount === 1, `Subsequent call within TTL returned cached response without database re-execution`);

  // ── TEST 5: Database Collision Retry Logic ─────────────────────────────
  console.log('\n--- 5. Testing Collision Retry Logic (Code 23505) ---');
  assert(isUniqueViolation({ code: '23505' }), `isUniqueViolation correctly identifies PostgreSQL 23505`);
  assert(isUniqueViolation({ message: 'duplicate key value violates unique constraint "jobs_pkey"' }), `isUniqueViolation identifies duplicate key message`);

  let collisionAttempts = 0;
  const passedIds: string[] = [];

  const retryResult = await withCollisionRetry(async (attempt, freshId) => {
    collisionAttempts++;
    passedIds.push(freshId);

    // Fail first 2 attempts with collision, succeed on 3rd
    if (attempt < 2) {
      return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
    }

    return { data: { id: freshId, status: 'created' }, error: null };
  }, { maxRetries: 3, baseDelayMs: 10 });

  assert(collisionAttempts === 3, `Retry loop executed 3 attempts until success (attempts=${collisionAttempts})`);
  assert(retryResult.error === null && retryResult.data.status === 'created', `Operation eventually succeeded with status created`);
  assert(passedIds.length === 3 && passedIds[0] !== passedIds[1] && passedIds[1] !== passedIds[2], `Each retry attempt received a fresh, unique UUID`);

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
