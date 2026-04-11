import { get, set, del } from 'idb-keyval';

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const val = await get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch {
    // Silently fail
  }
}

async function idbRemove(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    // Silently fail
  }
}

async function dualSave<T>(key: string, value: T): Promise<void> {
  safeSet(key, value);
  await idbSet(key, value);
}

async function dualLoad<T>(key: string): Promise<T | null> {
  const local = safeGet<T>(key);
  if (local !== null) return local;
  return idbGet<T>(key);
}

export { safeGet, safeSet, safeRemove, idbGet, idbSet, idbRemove, dualSave, dualLoad };
