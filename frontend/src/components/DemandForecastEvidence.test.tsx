import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import DemandForecastEvidence from './DemandForecastEvidence'
import type { DemandForecastProduct } from '../api'

const product: DemandForecastProduct = {
  productId: 'p-1', sku: 'SKU-1', name: 'Clear Glass Panel', category: 'glass', unit: 'sqm', price: 100,
  currentStock: 4, reorderPoint: 2,
  history: [{ month: '2026-08', quantity: 5 }, { month: '2026-09', quantity: 7 }],
  positiveMonths: 3, forecastQuantity: 6.25, status: 'available', stockCoverageDays: 19,
  recommendedOrderQuantity: 5, policyAssessment: 'adequate',
}

describe('DemandForecastEvidence', () => {
  it('renders a single-product forecast-to-stock evidence panel without changing the AI flow', () => {
    const html = renderToStaticMarkup(<DemandForecastEvidence products={[product]} />)

    expect(html).toContain('Check a product’s forecast against actual sales')
    expect(html).toContain('Clear Glass Panel (SKU-1)')
    expect(html).toContain('Current stock')
    expect(html).toContain('4 sqm')
    expect(html).toContain('Restock level')
    expect(html).toContain('6.25 sqm')
    expect(html).toContain('Suggested restock')
    expect(html).toContain('5 sqm')
    expect(html).toContain('Actual sales')
    expect(html).toContain('order-created month')
  })
})
