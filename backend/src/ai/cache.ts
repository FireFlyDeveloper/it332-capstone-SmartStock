import { createHash } from 'node:crypto';

interface CacheEntry<T> {
  dataFingerprint: string;
  value: T;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => item === undefined ? 'null' : stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const fields = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`);
    return `{${fields.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function createCacheFingerprint(value: unknown): string {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

/**
 * Process-local cache that stores one result per request scope and data version.
 * Callers must fingerprint their current canonical data before consulting it.
 */
export class DataAwareCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly latestRequestByScope = new Map<string, string>();

  constructor(private readonly maxEntries = 64) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error('maxEntries must be a positive integer');
    }
  }

  getOrCompute(scopeKey: string, dataFingerprint: string, compute: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(scopeKey);
    if (cached?.dataFingerprint === dataFingerprint) {
      this.entries.delete(scopeKey);
      this.entries.set(scopeKey, cached);
      return Promise.resolve(cached.value);
    }

    const requestKey = `${scopeKey}\u0000${dataFingerprint}`;
    const pending = this.inFlight.get(requestKey);
    if (pending) return pending;

    this.latestRequestByScope.set(scopeKey, requestKey);
    const request = Promise.resolve()
      .then(compute)
      .then((value) => {
        if (this.latestRequestByScope.get(scopeKey) === requestKey) {
          this.entries.delete(scopeKey);
          this.entries.set(scopeKey, { dataFingerprint, value });
          while (this.entries.size > this.maxEntries) {
            const oldestScope = this.entries.keys().next().value as string | undefined;
            if (oldestScope === undefined) break;
            this.entries.delete(oldestScope);
          }
        }
        return value;
      })
      .finally(() => {
        if (this.inFlight.get(requestKey) === request) this.inFlight.delete(requestKey);
        if (this.latestRequestByScope.get(scopeKey) === requestKey) this.latestRequestByScope.delete(scopeKey);
      });
    this.inFlight.set(requestKey, request);
    return request;
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
    this.latestRequestByScope.clear();
  }
}
