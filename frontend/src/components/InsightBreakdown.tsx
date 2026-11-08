import type { AnalyticsInsightKey, DemandForecastProduct } from '../api'

const INSIGHT_LABELS: Array<[AnalyticsInsightKey, string]> = [
  ['monthlySalesTransactions', 'Monthly sales & transactions'],
  ['annualPurchasedMaterials', 'Annual purchased materials'],
  ['inventoryMovement', 'Inventory movement'],
  ['demandForecast', 'Demand forecast'],
  ['stockPolicyPerformance', 'Observed stock-policy history'],
  ['orderRecordsPerMonth', 'Order records per month'],
  ['monthlyGrossOrderValue', 'Monthly gross order value'],
  ['topOrderedProducts', 'Top ordered products'],
  ['stockStatus', 'Stock status'],
  ['stockAtListedPricesByCategory', 'Stock at listed prices by category'],
  ['mostOrderedProducts', 'Most ordered products'],
  ['fewestOrderedProducts', 'Fewest ordered products · bottom 5'],
  ['salesEstimateNextMonth', 'Sales estimate for next month'],
  ['stockAlerts', 'Stock alerts'],
]

const hasCompleteInterpretations = (interpretations?: Partial<Record<AnalyticsInsightKey, string>>): interpretations is Record<AnalyticsInsightKey, string> => {
  if (!interpretations) return false
  return INSIGHT_LABELS.every(([key]) => {
    const text = interpretations[key]
    return typeof text === 'string' && text.trim().length > 0
  })
}

type InsightBreakdownProps = {
  interpretations?: Partial<Record<AnalyticsInsightKey, string>>
  forecastProducts?: DemandForecastProduct[]
  forecastLoading?: boolean
}

const formatMoney = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)

export default function InsightBreakdown({ interpretations, forecastProducts = [], forecastLoading = false }: InsightBreakdownProps) {
  if (!hasCompleteInterpretations(interpretations)) {
    return <p role="status" className="rounded-xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm text-slate-600">Detailed metric interpretations are unavailable from the current API version.</p>
  }

  return (
    <details className="rounded-xl border border-indigo-100 bg-white/70">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-indigo-800">
        View interpretations for each metric
      </summary>
      <dl className="grid gap-3 border-t border-indigo-100 px-4 py-4 sm:grid-cols-2">
        {INSIGHT_LABELS.map(([key, label]) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm leading-6 text-slate-700">{interpretations[key]}</dd>
            {key === 'salesEstimateNextMonth' && (
              <div className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-slate-700">
                <p className="text-xs text-slate-600">Product estimates · value uses current listed price, not a guaranteed sale.</p>
                {forecastLoading ? <p className="mt-2 text-xs">Loading product-level estimates…</p> : forecastProducts.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {forecastProducts.map((product) => {
                      const quantity = product.forecastQuantity ?? 0
                      return <li key={product.productId} className="border-t border-violet-100 pt-2 first:border-0 first:pt-0">
                        <span className="font-semibold">{product.name}</span> — {quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {product.unit}
                        <span className="block text-xs text-slate-600">Listed price: {formatMoney(product.price)} / {product.unit} · Estimated sales value: {formatMoney(quantity * product.price)}</span>
                      </li>
                    })}
                  </ul>
                ) : <p className="mt-2 text-xs">Product-level estimates are unavailable right now.</p>}
                <p className="mt-2 text-xs text-slate-500">“pcs” means pieces; “sqm” means square metres. Each row names the product using that unit.</p>
              </div>
            )}
          </div>
        ))}
      </dl>
    </details>
  )
}
