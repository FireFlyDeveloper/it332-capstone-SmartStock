import type { PolicyPerformancePeriod } from '../api';

export interface ObservedPolicyPeriodComparison {
  percentTimeAtOrBelowDelta: number | null;
  outOfStockDaysPer30Delta: number | null;
  averageOnHandDelta: number | null;
}

function outOfStockDaysPer30(period: PolicyPerformancePeriod): number | null {
  if (period.trackingDays <= 0) return null;
  return period.outOfStockDays / period.trackingDays * 30;
}

export function compareObservedPolicyPeriods(
  previous: PolicyPerformancePeriod | undefined,
  current: PolicyPerformancePeriod,
): ObservedPolicyPeriodComparison | null {
  if (!previous) return null;
  const previousStockoutRate = outOfStockDaysPer30(previous);
  const currentStockoutRate = outOfStockDaysPer30(current);
  return {
    percentTimeAtOrBelowDelta: previous.percentTimeAtOrBelowReorderPoint === null || current.percentTimeAtOrBelowReorderPoint === null
      ? null
      : current.percentTimeAtOrBelowReorderPoint - previous.percentTimeAtOrBelowReorderPoint,
    outOfStockDaysPer30Delta: previousStockoutRate === null || currentStockoutRate === null
      ? null
      : currentStockoutRate - previousStockoutRate,
    averageOnHandDelta: previous.timeWeightedAverageOnHand === null || current.timeWeightedAverageOnHand === null
      ? null
      : current.timeWeightedAverageOnHand - previous.timeWeightedAverageOnHand,
  };
}
