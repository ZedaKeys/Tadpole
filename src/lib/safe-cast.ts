/**
 * Safe casting utilities for rendering live game state values.
 * Prevents React error #31 ("Objects are not valid as a React child")
 * when the Lua mod or bridge sends unexpected data shapes.
 */

export function safeStr(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

export function safeNum(val: unknown, fallback = 0): number {
  return typeof val === 'number' && isFinite(val) ? val : fallback;
}
