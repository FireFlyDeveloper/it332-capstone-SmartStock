import { useEffect, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDemandForecastBacktest, type DemandForecastBacktestResponse, type DemandForecastProduct } from '../api'
import { buildForecastChartData, forecastTargetMonth, type ForecastChartPoint } from './forecastEvidenceUtils'

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
  const activeProductId = selectedProduct?.productId

  useEffect(() => {
    if (selectedProduct && selectedProduct.productId !== selectedProductId) {
      setSelectedProductId(selectedProduct.productId)
    }
  }, [selectedProduct, selectedProductId])

  useEffect(() => {
    if (!activeProductId) return
    let cancelled = false
    setLoading(true)
    setError('')
    setBacktest(null)
    getDemandForecastBacktest({ productId: activeProductId, months: 6, historyMonths: 12 })
      .then((result) => { if (!cancelled) setBacktest(result) })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load forecast validation.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeProductId])

  if (!selectedProduct) return null

  const chartData = backtest
    ? buildForecastChartData(
      backtest.periods,
      forecastTargetMonth(backtest.generatedAt),
      selectedProduct.forecastQuantity,
      selectedProduct.positiveMonths,
      backtest.historyMonths,
      backtest.minimumPositiveMonths,
    )
    : []

  return (
    <section aria-labelledby="forecast-evidence-heading" className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id="forecast-evidence-heading" className="font-bold text-slate-900">Forecast vs actual sales</h4>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
            Select one product to compare past estimates with actual sales and see the next-month estimate. Each backtest uses only the preceding 12 complete UTC months; sales are delivered orders grouped by order-created month.
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

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3" aria-label={`Forecast chart for ${selectedProduct.name}`}>
        {loading ? <p role="status" className="py-16 text-center text-sm text-slate-500">Checking historical months…</p>
          : error ? <p role="alert" className="py-16 text-center text-sm text-rose-700">{error}</p>
            : backtest && chartData.length > 0 ? <>
              <p className="mb-2 text-xs font-semibold text-slate-600">Monthly quantity · {selectedProduct.unit}</p>
              <div className="h-64 min-w-0" role="img" aria-label={`Monthly forecast compared with actual sales for ${selectedProduct.name}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals tick={{ fontSize: 11 }} width={54} />
                    <Tooltip content={({ active, payload }) => {
                      const point = payload?.[0]?.payload as ForecastChartPoint | undefined
                      if (!active || !point) return null
                      const eligible = point.positiveHistoryMonths >= point.minimumPositiveMonths
                      return <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
                        <p className="mb-2 font-bold text-slate-900">{point.month}{point.isFutureEstimate ? ' · forecast target' : ''}</p>
                        <p>Actual sales: {point.actualQuantity === null ? 'not available yet' : quantity(point.actualQuantity, selectedProduct.unit)}</p>
                        <p>Forecast: {point.forecastQuantity === null ? 'unavailable' : quantity(point.forecastQuantity, selectedProduct.unit)}</p>
                        <p>Absolute error: {point.absoluteError === null ? '—' : quantity(point.absoluteError, selectedProduct.unit)}</p>
                        <p className="mt-2 text-slate-600">History: {point.positiveHistoryMonths}/{point.historyMonths} positive months (minimum {point.minimumPositiveMonths}); {eligible ? 'eligible' : 'insufficient history'}</p>
                      </div>
                    }} />
                    <Legend />
                    <Bar dataKey="actualQuantity" name="Actual sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Line dataKey="forecastQuantity" name="Forecast" type="monotone" stroke="#7c3aed" strokeWidth={3} connectNulls={false} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <table className="sr-only">
                <caption>Forecast and actual monthly quantities for {selectedProduct.name}, in {selectedProduct.unit}</caption>
                <thead><tr><th>Month</th><th>Forecast</th><th>Actual sales</th><th>Absolute error</th><th>Positive history months</th><th>History window months</th><th>Eligibility</th></tr></thead>
                <tbody>{chartData.map((point) => <tr key={point.month}>
                  <th scope="row">{point.month}{point.isFutureEstimate ? ' (next-month estimate)' : ''}</th>
                  <td>{point.forecastQuantity === null ? 'Unavailable' : quantity(point.forecastQuantity, selectedProduct.unit)}</td>
                  <td>{point.actualQuantity === null ? 'Not available yet' : quantity(point.actualQuantity, selectedProduct.unit)}</td>
                  <td>{point.absoluteError === null ? '—' : quantity(point.absoluteError, selectedProduct.unit)}</td>
                  <td>{point.positiveHistoryMonths}</td>
                  <td>{point.historyMonths}</td>
                  <td>{point.positiveHistoryMonths >= point.minimumPositiveMonths ? 'Eligible' : 'Insufficient history'}</td>
                </tr>)}</tbody>
              </table>
              <p className="mt-3 text-xs text-slate-600">
                Historical fit only—not a guarantee. Mean absolute error: <strong>{backtest.summary.meanAbsoluteError === null ? 'not available' : quantity(backtest.summary.meanAbsoluteError, selectedProduct.unit)}</strong> across {backtest.summary.evaluatedMonths} evaluated month{backtest.summary.evaluatedMonths === 1 ? '' : 's'}.
              </p>
            </>
              : <p className="py-16 text-center text-sm text-slate-600">No forecast-validation months are available yet.</p>}
      </div>
    </section>
  )
}
