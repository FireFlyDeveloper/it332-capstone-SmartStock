import { describe, expect, it, vi } from 'vitest';
import { createCacheFingerprint, DataAwareCache } from './cache.js';

describe('data-aware AI cache', () => {
  it('reuses an unchanged result and replaces it when its data fingerprint changes', async () => {
    const cache = new DataAwareCache<string>(2);
    const generateFirst = vi.fn().mockResolvedValue('first');

    await expect(cache.getOrCompute('range', 'data-a', generateFirst)).resolves.toBe('first');
    await expect(cache.getOrCompute('range', 'data-a', generateFirst)).resolves.toBe('first');
    expect(generateFirst).toHaveBeenCalledTimes(1);

    const generateUpdated = vi.fn().mockResolvedValue('updated');
    await expect(cache.getOrCompute('range', 'data-b', generateUpdated)).resolves.toBe('updated');
    await expect(cache.getOrCompute('range', 'data-b', generateUpdated)).resolves.toBe('updated');
    expect(generateUpdated).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent generation for the same scope and data', async () => {
    const cache = new DataAwareCache<string>();
    let resolveGeneration: ((value: string) => void) | undefined;
    const generate = vi.fn(() => new Promise<string>((resolve) => { resolveGeneration = resolve; }));

    const first = cache.getOrCompute('range', 'data-a', generate);
    const second = cache.getOrCompute('range', 'data-a', generate);
    await Promise.resolve();
    expect(generate).toHaveBeenCalledTimes(1);
    resolveGeneration?.('shared');
    await expect(Promise.all([first, second])).resolves.toEqual(['shared', 'shared']);
  });

  it('does not cache failed generations and serializes object keys consistently', async () => {
    const cache = new DataAwareCache<string>();
    const failed = vi.fn().mockRejectedValueOnce(new Error('provider failed'));
    await expect(cache.getOrCompute('range', 'data-a', failed)).rejects.toThrow('provider failed');

    const retry = vi.fn().mockResolvedValue('retry');
    await expect(cache.getOrCompute('range', 'data-a', retry)).resolves.toBe('retry');
    expect(retry).toHaveBeenCalledTimes(1);
    expect(createCacheFingerprint({ a: 1, b: 2 })).toBe(createCacheFingerprint({ b: 2, a: 1 }));
  });

  it('bounds the number of cached scopes with least-recently-used eviction', async () => {
    const cache = new DataAwareCache<string>(2);
    const generate = (value: string) => vi.fn().mockResolvedValue(value);
    await cache.getOrCompute('a', '1', generate('a1'));
    await cache.getOrCompute('b', '1', generate('b1'));
    await cache.getOrCompute('a', '1', generate('unused')); // Refresh A's recency.
    await cache.getOrCompute('c', '1', generate('c1'));

    const regenerateB = generate('b2');
    await cache.getOrCompute('b', '1', regenerateB);
    expect(regenerateB).toHaveBeenCalledTimes(1);
  });
});
