import { useEffect, useState } from 'react'
import { getDemandForecastBacktest, type DemandForecastBacktestResponse, type DemandForecastProduct } from '../api'

interface Props {
  products: DemandForecastProduct[]
}

function quantity(value: number, unit: string): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`
}

export default function DemandForecastEvidence({ products }: Props) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.productId ?? '')
  const [backtest, setBacktest] = useState<DemandForecastBacktestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedProduct = products.find((product) => product.productId === selectedProductId) ?? products[0]

  useEffect(() => {
    if (selectedProduct && selectedProduct.productId !== selectedProductId) {
      setSelectedProductId(selectedProduct.productId)
    }
  }, [selectedProduct, selectedProductId])

  useEffect(() => {
    if (!selectedProduct) return
    let cancelled = false
    setLoading(true)
    setError('')
    setBacktest(null)
    getDemandForecastBacktest({ productId: selectedProduct.productId, months: 6, historyMonths: 12 })
      .then((result) => { if (!cancelled) setBacktest(result) })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load forecast validation.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedProduct?.productId])

  if (!selectedProduct) return null

  return (
    <section aria-labelledby="forecast-evidence-heading" className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id="forecast-evidence-heading" className="font-bold text-slate-900">Check a product’s forecast against actual sales</h4>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
            Each past month is forecast using only the preceding 12 complete UTC months. Sales are delivered orders grouped by order-created month.
          </p>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          Product
          <select
            aria-label="Product for forecast validation"
            className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={selectedProduct.productId}
            onChange={(event) => setSelectedProductId(event.target.value)}
          >
            {products.map((product) => <option key={product.productId} value={product.productId}>{product.name} ({product.sku})</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Current stock</p><p className="mt-1 font-bold text-slate-900">{quantity(selectedProduct.currentStock, selectedProduct.unit)}</p></div>
        <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Restock level</p><p className="mt-1 font-bold text-slate-900">{quantity(selectedProduct.reorderPoint, selectedProduct.unit)}</p></div>
        <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Next-month estimate</p><p className="mt-1 font-bold text-slate-900">{selectedProduct.forecastQuantity === null ? 'Unavailable' : quantity(selectedProduct.forecastQuantity, selectedProduct.unit)}</p></div>
        <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Suggested restock</p><p className="mt-1 font-bold text-slate-900">{selectedProduct.recommendedOrderQuantity === null ? 'Unavailable' : quantity(selectedProduct.recommendedOrderQuantity, selectedProduct.unit)}</p></div>
        <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">SES settings</p><p className="mt-1 font-bold text-slate-900">α = 0.3 · one month</p></div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <caption className="sr-only">Historical forecast versus actual sales for {selectedProduct.name}</caption>
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Target month</th>
              <th scope="col" className="px-3 py-2 text-right">Forecast</th>
              <th scope="col" className="px-3 py-2 text-right">Actual sales</th>
              <th scope="col" className="px-3 py-2 text-right">Absolute error</th>
              <th scope="col" className="px-3 py-2 text-right">History months with sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={5} role="status" className="px-3 py-5 text-center text-slate-500">Checking historical months…</td></tr>}
            {!loading && error && <tr><td colSpan={5} role="alert" className="px-3 py-5 text-center text-rose-700">{error}</td></tr>}
            {!loading && backtest?.periods.map((period) => (
              <tr key={period.month}>
                <th scope="row" className="px-3 py-2 text-left font-semibold text-slate-800">{period.month}</th>
                <td className="px-3 py-2 text-right text-slate-700">{period.forecastQuantity === null ? 'Not enough history' : quantity(period.forecastQuantity, selectedProduct.unit)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{quantity(period.actualQuantity, selectedProduct.unit)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{period.absoluteError === null ? '—' : quantity(period.absoluteError, selectedProduct.unit)}</td>
                <td className="px-3 py-2 text-right text-slate-700">{period.positiveHistoryMonths} / {backtest.minimumPositiveMonths} required</td>
              </tr>
            ))}
            {!loading && !error && backtest?.periods.every((period) => period.forecastQuantity === null) && (
              <tr><td colSpan={5} className="px-3 py-5 text-center text-slate-600">Not enough prior sales history to backtest this product yet. No accuracy score is reported.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!loading && !error && backtest && (
        <p className="mt-3 text-sm text-slate-700">
          Mean absolute error (MAE): <strong>{backtest.summary.meanAbsoluteError === null ? 'not available' : quantity(backtest.summary.meanAbsoluteError, selectedProduct.unit)}</strong>
          {' '}across {backtest.summary.evaluatedMonths} evaluated month{backtest.summary.evaluatedMonths === 1 ? '' : 's'}.
          {' '}Backtest months use no future sales data; this score describes historical fit, not a guarantee of future accuracy.
        </p>
      )}
    </section>
  )
}
