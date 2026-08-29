/**
 * Tiny in-memory (module-scoped) cache for the learner class browser so
 * flipping between tabs / pages you've already loaded doesn't re-hit the API.
 * Lives for the SPA session; entries expire after TTL_MS; cleared outright when
 * the learner enrolls or unenrolls (that moves a class between the two tabs).
 */
const TTL_MS = 60_000;

interface Entry<T> {
  value: T;
  at: number;
}

const store = new Map<string, Entry<unknown>>();

export function getCachedClasses<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > TTL_MS) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCachedClasses<T>(key: string, value: T): void {
  store.set(key, { value, at: Date.now() });
}

export function clearClassBrowserCache(): void {
  store.clear();
}
