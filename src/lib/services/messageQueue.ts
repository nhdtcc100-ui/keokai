/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  PROLINK MESSAGE QUEUE — Reliable Delivery Engine               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Architecture (inspired by WhatsApp/Telegram):
 *
 *  1. OUTBOX MODEL: Every message is stored locally FIRST before sending.
 *  2. IDEMPOTENCY KEY: Each message has a unique clientId to prevent duplicates.
 *  3. EXPONENTIAL BACKOFF: Retry delays: 1s → 2s → 4s → 8s → 30s (max).
 *  4. ONLINE DETECTION: Resumes queue automatically when network returns.
 *  5. PERSISTENCE: Queue survives page refresh via localStorage.
 *
 * Message States:
 *   pending   → Not yet sent to server
 *   sending   → Currently attempting to send
 *   sent      → Confirmed by server (has real DB id)
 *   failed    → Max retries exceeded
 */

import { supabase } from '../supabase';

export interface QueuedMessage {
  clientId: string;       // Unique idempotency key (temp-TIMESTAMP-RANDOM)
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;      // ISO — used for ordering
  retries: number;        // How many times we've tried
  nextRetryAt: number;    // Timestamp of next allowed retry
  status: 'pending' | 'sending' | 'failed';
}

const QUEUE_KEY = 'prolink_msg_outbox';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

// ── Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped) ────────────────
function backoffDelay(retries: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, retries), MAX_DELAY_MS);
}

// ── Persist queue to localStorage ─────────────────────────────────────────
function saveQueue(queue: QueuedMessage[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

// ── Load queue from localStorage ───────────────────────────────────────────
function loadQueue(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Message Queue Singleton ────────────────────────────────────────────────
class MessageQueueService {
  private queue: QueuedMessage[] = loadQueue();
  private processing = false;
  private processorTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Array<(queue: QueuedMessage[]) => void> = [];
  private onSuccessCallback: ((clientId: string, realMsg: any) => void) | null = null;
  private onFailCallback: ((clientId: string) => void) | null = null;

  constructor() {
    // Resume on network reconnection
    window.addEventListener('online', () => {
      console.log('[MsgQueue] Network back — flushing queue...');
      this.flush();
    });

    // Process on init (in case of queued messages from previous session)
    if (this.queue.filter(m => m.status === 'pending').length > 0) {
      setTimeout(() => this.flush(), 500);
    }
  }

  /** Register callbacks for UI state updates */
  setCallbacks(
    onSuccess: (clientId: string, realMsg: any) => void,
    onFail: (clientId: string) => void
  ) {
    this.onSuccessCallback = onSuccess;
    this.onFailCallback = onFail;
  }

  /** Add a message to the outbox */
  enqueue(msg: Omit<QueuedMessage, 'retries' | 'nextRetryAt' | 'status'>): void {
    const queued: QueuedMessage = {
      ...msg,
      retries: 0,
      nextRetryAt: Date.now(),
      status: 'pending'
    };
    this.queue.push(queued);
    saveQueue(this.queue);
    this.notify();
    this.flush();
  }

  /** Get current queue state (for UI) */
  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  /** Check if a message is in queue by clientId */
  isPending(clientId: string): boolean {
    return this.queue.some(m => m.clientId === clientId && m.status !== 'failed');
  }

  /** Remove a failed message from queue (after user sees it) */
  remove(clientId: string): void {
    this.queue = this.queue.filter(m => m.clientId !== clientId);
    saveQueue(this.queue);
    this.notify();
  }

  /** Clear the entire queue (e.g., on logout) */
  clear(): void {
    this.queue = [];
    saveQueue(this.queue);
    this.notify();
  }

  /** Subscribe to queue state changes */
  subscribe(listener: (queue: QueuedMessage[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const snapshot = [...this.queue];
    this.listeners.forEach(l => l(snapshot));
  }

  /** Flush pending messages — the core processing loop */
  flush(): void {
    if (this.processing) return;
    if (this.processorTimer) {
      clearTimeout(this.processorTimer);
      this.processorTimer = null;
    }
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;

    const now = Date.now();
    const pending = this.queue.find(
      m => m.status === 'pending' && m.nextRetryAt <= now
    );

    if (!pending) {
      // Schedule next check for the soonest nextRetryAt
      const soonest = this.queue
        .filter(m => m.status === 'pending')
        .map(m => m.nextRetryAt)
        .sort((a, b) => a - b)[0];

      if (soonest) {
        const wait = Math.max(soonest - now, 100);
        this.processorTimer = setTimeout(() => this.processNext(), wait);
      }
      return;
    }

    this.processing = true;
    pending.status = 'sending';
    saveQueue(this.queue);
    this.notify();

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: pending.senderId,
          receiver_id: pending.receiverId,
          content: pending.content,
        }])
        .select()
        .single();

      if (error) throw error;

      // ✅ SUCCESS: remove from queue, notify success
      console.log(`[MsgQueue] ✅ Sent: ${pending.clientId.slice(-8)}`);
      this.queue = this.queue.filter(m => m.clientId !== pending.clientId);
      saveQueue(this.queue);
      this.notify();
      this.onSuccessCallback?.(pending.clientId, data);

    } catch (err) {
      pending.retries += 1;
      const delay = backoffDelay(pending.retries);

      if (pending.retries >= MAX_RETRIES) {
        // ❌ PERMANENT FAILURE after max retries
        console.warn(`[MsgQueue] ❌ Permanent fail after ${MAX_RETRIES} retries: ${pending.clientId.slice(-8)}`);
        pending.status = 'failed';
        saveQueue(this.queue);
        this.notify();
        this.onFailCallback?.(pending.clientId);
      } else {
        // 🔄 RETRY with backoff
        console.warn(`[MsgQueue] ⏳ Retry ${pending.retries}/${MAX_RETRIES} in ${delay}ms: ${pending.clientId.slice(-8)}`);
        pending.status = 'pending';
        pending.nextRetryAt = Date.now() + delay;
        saveQueue(this.queue);
        this.notify();
      }
    }

    this.processing = false;

    // Process next message immediately if more are pending
    const hasMore = this.queue.some(m => m.status === 'pending' && m.nextRetryAt <= Date.now());
    if (hasMore) {
      setImmediate(() => this.processNext());
    } else {
      // Schedule for the soonest retry
      const soonest = this.queue
        .filter(m => m.status === 'pending')
        .map(m => m.nextRetryAt)
        .sort((a, b) => a - b)[0];

      if (soonest) {
        const wait = Math.max(soonest - Date.now(), 100);
        this.processorTimer = setTimeout(() => this.processNext(), wait);
      }
    }
  }
}

// ── Polyfill setImmediate for browser ─────────────────────────────────────
function setImmediate(fn: () => void): void {
  setTimeout(fn, 0);
}

export const messageQueue = new MessageQueueService();
