import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import InsightBreakdown from './InsightBreakdown'
import type { AnalyticsInsightKey } from '../api'

const cases: Array<[AnalyticsInsightKey, string, string]> = [
  ['monthlySalesTransactions', 'Monthly sales & transactions', 'Interpretation for monthly sales and transactions.'],
  ['annualPurchasedMaterials', 'Annual purchased materials', 'Interpretation for annual purchased materials.'],
  ['inventoryMovement', 'Inventory movement', 'Interpretation for inventory movement.'],
  ['demandForecast', 'Demand forecast', 'Interpretation for demand forecast.'],
  ['stockPolicyPerformance', 'Observed stock-policy history', 'Interpretation for observed stock-policy history.'],
  ['orderRecordsPerMonth', 'Order records per month', 'Interpretation for order records per month.'],
  ['monthlyGrossOrderValue', 'Monthly gross order value', 'Interpretation for monthly gross order value.'],
  ['topOrderedProducts', 'Top ordered products', 'Interpretation for top ordered products.'],
  ['stockStatus', 'Stock status', 'Interpretation for stock status.'],
  ['stockAtListedPricesByCategory', 'Stock at listed prices by category', 'Interpretation for stock at listed prices by category.'],
  ['mostOrderedProducts', 'Most ordered products', 'Interpretation for most ordered products.'],
  ['fewestOrderedProducts', 'Fewest ordered products · bottom 5', 'Interpretation for fewest ordered products.'],
  ['salesEstimateNextMonth', 'Sales estimate for next month', 'Interpretation for next month sales estimate.'],
  ['stockAlerts', 'Stock alerts', 'Interpretation for stock alerts.'],
]

describe('InsightBreakdown', () => {
  it('renders the 14 product-friendly labels in the required order', () => {
    const interpretations = Object.fromEntries(cases.map(([key, , text]) => [key, text])) as Record<AnalyticsInsightKey, string>
    const html = renderToStaticMarkup(<InsightBreakdown interpretations={interpretations} />)
    const positions = cases.map(([, label]) => html.indexOf(label.replace('&', '&amp;')))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
  })

  it('renders all 14 interpretation strings', () => {
    const interpretations = Object.fromEntries(cases.map(([key, , text]) => [key, text])) as Record<AnalyticsInsightKey, string>
    const html = renderToStaticMarkup(<InsightBreakdown interpretations={interpretations} />)

    for (const [, , text] of cases) expect(html).toContain(text)
  })

  it('handles an older API response without interpretations', () => {
    const html = renderToStaticMarkup(<InsightBreakdown />)

    expect(html).toContain('Detailed metric interpretations are unavailable from the current API version.')
  })

  it('shows the local per-product quantity, listed price, and estimated sales value', () => {
    const interpretations = Object.fromEntries(cases.map(([key, , text]) => [key, text])) as Record<AnalyticsInsightKey, string>
    const html = renderToStaticMarkup(<InsightBreakdown interpretations={interpretations} forecastProducts={[{
      productId: 'p-1', sku: 'SKU-1', name: 'Clear Glass Panel', category: 'glass', unit: 'sqm', price: 100,
      currentStock: 4, reorderPoint: 2, history: [], positiveMonths: 3, forecastQuantity: 2.24,
      status: 'available', stockCoverageDays: 20, recommendedOrderQuantity: 0, policyAssessment: 'adequate',
    }]} />)

    expect(html).toContain('Clear Glass Panel')
    expect(html).toContain('2.24 sqm')
    expect(html).toContain('Listed price:')
    expect(html).toContain('Estimated sales value:')
    expect(html).toContain('square metres')
  })
})
