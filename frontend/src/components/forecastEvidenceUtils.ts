import type { DemandForecastBacktestPeriod } from '../api'

export interface ForecastChartPoint {
  month: string
  forecastQuantity: number | null
  actualQuantity: number | null
  absoluteError: number | null
  positiveHistoryMonths: number
  historyMonths: number
  minimumPositiveMonths: number
  isFutureEstimate: boolean
}

export function buildForecastChartData(
  periods: DemandForecastBacktestPeriod[],
  targetMonth: string,
  targetEstimate: number | null,
  targetPositiveHistoryMonths: number,
  historyMonths: number,
  minimumPositiveMonths: number,
): ForecastChartPoint[] {
  return [
    ...periods.map((period) => ({
      month: period.month,
      forecastQuantity: period.forecastQuantity,
      actualQuantity: period.actualQuantity,
      absoluteError: period.absoluteError,
      positiveHistoryMonths: period.positiveHistoryMonths,
      historyMonths,
      minimumPositiveMonths,
      isFutureEstimate: false,
    })),
    {
      month: targetMonth,
      forecastQuantity: targetEstimate,
      actualQuantity: null,
      absoluteError: null,
      positiveHistoryMonths: targetPositiveHistoryMonths,
      historyMonths,
      minimumPositiveMonths,
      isFutureEstimate: true,
    },
  ]
}

export function forecastTargetMonth(generatedAt: string): string {
  const generatedDate = new Date(generatedAt)
  if (Number.isNaN(generatedDate.getTime())) return 'Forecast target'
  return new Date(Date.UTC(generatedDate.getUTCFullYear(), generatedDate.getUTCMonth(), 1)).toISOString().slice(0, 7)
}
