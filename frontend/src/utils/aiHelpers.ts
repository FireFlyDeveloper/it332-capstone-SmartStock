import type { Order, Product, DemandForecast } from '../types'

/**
 * Estimate demand from completed backend orders only. Require at least three
 * calendar months of order history and recent product sales; otherwise return
 * no estimate instead of displaying fabricated zero demand or confidence.
 */
export const generateDemandForecast = (
  products: Product[],
  orders: Order[],
): DemandForecast[] => {
  const monthlyTotals = new Map<string, Map<string, number>>()

  for (const order of orders) {
    if (order.orderStatus !== 'completed') continue
    const month = order.date.slice(0, 7)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) continue

    for (const item of order.items) {
      const productTotals = monthlyTotals.get(item.productId) ?? new Map<string, number>()
      productTotals.set(month, (productTotals.get(month) ?? 0) + item.quantity)
      monthlyTotals.set(item.productId, productTotals)
    }
  }

  const monthsWithOrders = [...new Set(
    orders
      .filter((order) => order.orderStatus === 'completed')
      .map((order) => order.date.slice(0, 7))
      .filter((month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month)),
  )].sort()

  if (monthsWithOrders.length === 0) return []

  const [startYear, startMonth] = monthsWithOrders[0].split('-').map(Number)
  const [endYear, endMonth] = monthsWithOrders[monthsWithOrders.length - 1].split('-').map(Number)
  const calendarMonths: string[] = []
  for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth);) {
    calendarMonths.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month === 13) {
      year += 1
      month = 1
    }
  }

  if (calendarMonths.length < 3) return []

  const recentMonths = calendarMonths.slice(-3)
  const previousMonths = calendarMonths.slice(-6, -3)

  return products.flatMap((product) => {
    const productTotals = monthlyTotals.get(product.id)
    const recentTotal = recentMonths.reduce((sum, month) => sum + (productTotals?.get(month) ?? 0), 0)
    if (recentTotal <= 0) return []

    const predictedDemand = Number((recentTotal / recentMonths.length).toFixed(1))
    const previousTotal = previousMonths.reduce((sum, month) => sum + (productTotals?.get(month) ?? 0), 0)
    const trend: DemandForecast['trend'] = previousMonths.length < 3 || previousTotal <= 0
      ? 'insufficient_history'
      : recentTotal > previousTotal * 1.1
        ? 'up'
        : recentTotal < previousTotal * 0.9
          ? 'down'
          : 'stable'

    return [{
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      predictedDemand,
      daysUntilStockout: predictedDemand > 0 ? Math.floor(product.stock / (predictedDemand / 30)) : null,
      recommendedReorderQty: Math.max(0, Math.ceil(predictedDemand * 1.5) - product.stock),
      trend,
      historyMonths: calendarMonths.length,
    }]
  })
}
