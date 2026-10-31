import type { AnalyticsInsightKey } from '../api'

const INSIGHT_LABELS: Array<[AnalyticsInsightKey, string]> = [
  ['monthlySalesTransactions', 'Monthly sales & transactions'],
  ['annualPurchasedMaterials', 'Annual purchased materials'],
  ['inventoryMovement', 'Inventory movement'],
  ['demandForecast', 'Demand forecast'],
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
}

export default function InsightBreakdown({ interpretations }: InsightBreakdownProps) {
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
          </div>
        ))}
      </dl>
    </details>
  )
}
