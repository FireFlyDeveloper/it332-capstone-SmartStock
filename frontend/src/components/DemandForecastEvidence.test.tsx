import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import DemandForecastEvidence from './DemandForecastEvidence'
import { buildForecastChartData, forecastTargetMonth } from './forecastEvidenceUtils'
import type { DemandForecastBacktestPeriod, DemandForecastProduct } from '../api'

const product: DemandForecastProduct = {
  productId: 'p-1', sku: 'SKU-1', name: 'Clear Glass Panel', category: 'glass', unit: 'sqm', price: 100,
  currentStock: 4, reorderPoint: 2,
  history: [{ month: '2026-08', quantity: 5 }, { month: '2026-09', quantity: 7 }],
  positiveMonths: 3, forecastQuantity: 6.25, status: 'available', stockCoverageDays: 19,
  recommendedOrderQuantity: 5, policyAssessment: 'adequate',
}

const backtestPeriods: DemandForecastBacktestPeriod[] = [
  { month: '2026-09', positiveHistoryMonths: 3, forecastQuantity: 5.5, actualQuantity: 7, absoluteError: 1.5 },
  { month: '2026-10', positiveHistoryMonths: 4, forecastQuantity: 6, actualQuantity: 4, absoluteError: 2 },
]

describe('DemandForecastEvidence', () => {
  it('plots historical actuals, historical forecasts, and the next-month estimate on one product chart', () => {
    const chart = buildForecastChartData(backtestPeriods, '2026-11', product.forecastQuantity, 3, 12, 3)

    expect(chart).toEqual([
      { month: '2026-09', forecastQuantity: 5.5, actualQuantity: 7, absoluteError: 1.5, positiveHistoryMonths: 3, historyMonths: 12, minimumPositiveMonths: 3, isFutureEstimate: false },
      { month: '2026-10', forecastQuantity: 6, actualQuantity: 4, absoluteError: 2, positiveHistoryMonths: 4, historyMonths: 12, minimumPositiveMonths: 3, isFutureEstimate: false },
      { month: '2026-11', forecastQuantity: 6.25, actualQuantity: null, absoluteError: null, positiveHistoryMonths: 3, historyMonths: 12, minimumPositiveMonths: 3, isFutureEstimate: true },
    ])
  })

  it('uses the current calendar month as the next target after the last complete history month', () => {
    expect(forecastTargetMonth('2026-11-28T23:45:00.000Z')).toBe('2026-11')
    expect(forecastTargetMonth('not-a-date')).toBe('Forecast target')
  })

  it('uses a visual forecast heading and product selector instead of duplicated forecast prose and metric tiles', () => {
    const html = renderToStaticMarkup(<DemandForecastEvidence products={[product]} />)

    expect(html).toContain('Forecast vs actual sales')
    expect(html).toContain('Clear Glass Panel (SKU-1)')
    expect(html).toContain('Product for forecast validation')
    expect(html).not.toContain('Next-month estimate</p>')
    expect(html).not.toContain('Suggested restock</p>')
    expect(html).toContain('preceding 12 complete UTC months')
  })
})
