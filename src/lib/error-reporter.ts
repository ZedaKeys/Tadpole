/**
 * ErrorReporter — Client-side error logging and reporting for Tadpole.
 *
 * - Reports errors to PocketBase (https://pb.gohanlab.uk/api/collections/tadpole_errors/records)
 * - Stores last 50 errors in localStorage as backup
 * - Deduplicates repeated reports for the same error message
 * - Never blocks or crashes the app — all operations are fire-and-forget with try/catch
 *
 * PocketBase collection setup (admin UI):
 *   Collection: tadpole_errors
 *   Fields: source(text), message(text), stack(text), url(text), userAgent(text), metadata(json), version(text), timestamp(date)
 *   Rules: create = public (or authenticated), read/list/update/delete = admin only
 */

import { VERSION } from './version';

const PB_ENDPOINT = 'https://pb.gohanlab.uk/api/collections/tadpole_errors/records';
const LOCAL_STORAGE_KEY = 'tadpole-error-log';
const MAX_LOCAL_ERRORS = 50;
const DEDUPE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 3000;

interface ErrorRecord {
  source: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  version?: string;
  timestamp: string;
}

interface StoredError {
  id: string;
  source: string;
  message: string;
  stack?: string;
  url?: string;
  timestamp: string;
  reported: boolean;
}

// Simple hash for deduplication
function hashMessage(msg: string): string {
  let hash = 0;
  for (let i = 0; i < msg.length; i++) {
    const char = msg.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export class ErrorReporter {
  private static recentReports: Map<string, number> = new Map(); // hash -> timestamp

  /**
   * Report an error. Safe to call anywhere — never throws.
   */
  static report(error: Error | unknown, extra?: { source?: string; metadata?: Record<string, unknown> }): void {
    try {
      const source = extra?.source ?? 'app';
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      const stack = error instanceof Error ? error.stack : undefined;

      // Save locally first (always succeeds)
      ErrorReporter.saveLocalError({ source, message, stack });

      // Check deduplication
      const hash = hashMessage(message);
      const now = Date.now();
      const lastReported = ErrorReporter.recentReports.get(hash);
      if (lastReported && now - lastReported < DEDUPE_INTERVAL_MS) {
        return; // Already reported this error recently
      }

      // Mark as reported
      ErrorReporter.recentReports.set(hash, now);

      // Build record
      const record: ErrorRecord = {
        source,
        message,
        stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        metadata: extra?.metadata,
        version: VERSION,
        timestamp: new Date().toISOString(),
      };

      // Fire and forget
      ErrorReporter.sendToPocketBase(record);
    } catch {
      // Never let error reporting crash the app
    }
  }

  private static saveLocalError(err: { source: string; message: string; stack?: string }): void {
    try {
      const errors = ErrorReporter.getLocalErrorsInternal();
      errors.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: err.source,
        message: err.message,
        stack: err.stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
        reported: false,
      });
      // Keep only last MAX_LOCAL_ERRORS
      if (errors.length > MAX_LOCAL_ERRORS) {
        errors.length = MAX_LOCAL_ERRORS;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(errors));
    } catch {
      // Silently fail
    }
  }

  private static getLocalErrorsInternal(): StoredError[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as StoredError[];
    } catch {
      return [];
    }
  }

  /**
   * Get all locally stored errors. Never throws.
   */
  static getLocalErrors(): StoredError[] {
    return ErrorReporter.getLocalErrorsInternal();
  }

  /**
   * Clear all locally stored errors. Never throws.
   */
  static clearLocalErrors(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }

  /**
   * Get a formatted string of all local errors for sharing/debugging.
   */
  static getFormattedErrors(): string {
    const errors = ErrorReporter.getLocalErrors();
    if (errors.length === 0) return 'No errors recorded.';
    return errors.map((e, i) => {
      const lines = [`[${i + 1}] ${e.source} — ${e.message}`];
      if (e.url) lines.push(`    URL: ${e.url}`);
      lines.push(`    Time: ${e.timestamp}`);
      if (e.stack) lines.push(`    Stack: ${e.stack.split('\n').slice(0, 3).join('\n    ')}`);
      return lines.join('\n');
    }).join('\n\n');
  }

  private static sendToPocketBase(record: ErrorRecord): void {
    try {
      if (typeof fetch === 'undefined') return;

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        : null;

      fetch(PB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        signal: controller?.signal,
        keepalive: true,
      }).catch(() => {
        // Network error, PocketBase unreachable — error already stored locally
      }).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    } catch {
      // Never throw
    }
  }
}

/**
 * Convenience: report an error from anywhere (non-blocking).
 */
export function reportError(error: Error | unknown, extra?: { source?: string; metadata?: Record<string, unknown> }): void {
  ErrorReporter.report(error, extra);
}
