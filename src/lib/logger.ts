/**
 * 🛡️ Structured Production Logger & Error Tracking
 * Redacts sensitive fields, produces clean readable console output in DEV,
 * and outputs structured JSON lines in PROD for log aggregators (e.g. Datadog, Pino, Sentry).
 */

const isProd = import.meta.env.PROD;

const SENSITIVE_FIELDS = [
  'password',
  'pass',
  'token',
  'jwt',
  'secret',
  'apiKey',
  'authorization',
  'bearer',
  'cookie'
];

function sanitizeLogData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  debug: (msg: string, ...meta: unknown[]) => {
    if (!isProd) {
      console.debug('[DEBUG] ' + msg, ...meta.map(sanitizeLogData));
    }
  },

  info: (msg: string, ...meta: unknown[]) => {
    if (!isProd) {
      console.info('[INFO] ' + msg, ...meta.map(sanitizeLogData));
    }
  },

  warn: (msg: string, ...meta: unknown[]) => {
    console.warn('[WARN] ' + msg, ...meta.map(sanitizeLogData));
  },

  error: (msg: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    if (isProd) {
      console.error(
        JSON.stringify({
          level: 'ERROR',
          timestamp,
          message: msg,
          error: error instanceof Error ? error.message : String(error || '')
        })
      );
    } else {
      console.error(`[ERROR] ${timestamp} — ${msg}`, error);
    }
  }
};
