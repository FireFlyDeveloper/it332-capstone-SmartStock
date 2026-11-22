import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleDebouncedValue } from './debounce';

describe('scheduleDebouncedValue', () => {
  afterEach(() => vi.useRealTimers());

  it('publishes only the latest search value after the debounce period', () => {
    vi.useFakeTimers();
    const onValue = vi.fn();

    const cancelFirst = scheduleDebouncedValue('g', 300, onValue);
    vi.advanceTimersByTime(100);
    cancelFirst();
    scheduleDebouncedValue('glass', 300, onValue);

    vi.advanceTimersByTime(299);
    expect(onValue).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onValue).toHaveBeenCalledTimes(1);
    expect(onValue).toHaveBeenCalledWith('glass');
  });
});
