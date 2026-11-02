import { describe, expect, it } from 'vitest';
import { compareObservedPolicyPeriods } from './policyPeriodComparison.js';
import type { PolicyPerformancePeriod } from '../api';

const period = (overrides: Partial<PolicyPerformancePeriod> = {}): PolicyPerformancePeriod => ({
  startedAt: '2026-01-01T00:00:00.000Z',
  endedAt: null,
  reorderPoint: 10,
  trackingDays: 30,
  timeWeightedAverageOnHand: 5,
  daysAtOrBelowReorderPoint: 6,
  percentTimeAtOrBelowReorderPoint: 20,
  outOfStockDays: 2,
  ...overrides,
});

describe('observed stock-policy period comparison', () => {
  it('compares consecutive periods using normalized stockout time', () => {
    expect(compareObservedPolicyPeriods(
      period({ trackingDays: 60, outOfStockDays: 4, percentTimeAtOrBelowReorderPoint: 20, timeWeightedAverageOnHand: 5 }),
      period({ trackingDays: 90, outOfStockDays: 12, percentTimeAtOrBelowReorderPoint: 30, timeWeightedAverageOnHand: 7 }),
    )).toEqual({
      percentTimeAtOrBelowDelta: 10,
      outOfStockDaysPer30Delta: 2,
      averageOnHandDelta: 2,
    });
  });

  it('returns no comparison for the first tracked period and nulls metrics without coverage', () => {
    expect(compareObservedPolicyPeriods(undefined, period())).toBeNull();
    expect(compareObservedPolicyPeriods(
      period({ trackingDays: 0, percentTimeAtOrBelowReorderPoint: null, timeWeightedAverageOnHand: null }),
      period({ trackingDays: 0, percentTimeAtOrBelowReorderPoint: null, timeWeightedAverageOnHand: null }),
    )).toEqual({
      percentTimeAtOrBelowDelta: null,
      outOfStockDaysPer30Delta: null,
      averageOnHandDelta: null,
    });
  });
});
