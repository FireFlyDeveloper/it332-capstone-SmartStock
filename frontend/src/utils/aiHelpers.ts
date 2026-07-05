/**
 * AI helpers — pure functions, copied verbatim from the Capstone frontend.
 * The "AI" predictions here are simple heuristics (sufficient for the UI
 * until a real /analytics/* endpoint lands). No backend dependency.
 *
 * Last touched: 2026-07-07
 */

import type {
  Product,
  Order,
  Delivery,
  DemandForecast,
  DeliveryPrediction,
  AIRecommendation,
} from '../types'

// Simulated AI Demand Forecasting
// In production, this would use actual ML models
export const generateDemandForecast = (
  products: Product[],
  orders: Order[],
): DemandForecast[] => {
  return products.slice(0, 8).map((product) => {
    // Calculate average monthly demand from historical orders
    const productOrders = orders.filter(
      (o) => o.items.some((item) => item.productId === product.id) && o.orderStatus === 'completed',
    )

    const totalQty = productOrders.reduce((sum, o) => {
      const item = o.items.find((i) => i.productId === product.id)
      return sum + (item?.quantity || 0)
    }, 0)

    // Simulate AI prediction with some randomness
    const avgMonthlyDemand =
      productOrders.length > 0 ? totalQty / 3 : Math.floor(Math.random() * 20) + 5
    const predictedDemand = Math.floor(avgMonthlyDemand * (1 + (Math.random() * 0.4 - 0.2)))
    const dailyDemand = predictedDemand / 30
    const daysUntilStockout = dailyDemand > 0 ? Math.floor(product.stock / dailyDemand) : 999

    // Random trend simulation
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable']
    const trend = trends[Math.floor(Math.random() * trends.length)]

    // Confidence based on data availability
    const confidence = Math.min(95, 60 + productOrders.length * 10)

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      predictedDemand,
      daysUntilStockout: daysUntilStockout === 999 ? -1 : daysUntilStockout,
      recommendedReorderQty: Math.floor(predictedDemand * 1.5),
      confidence,
      trend,
    }
  })
}

// Simulated AI Delivery ETA Prediction
export const generateDeliveryPredictions = (deliveries: Delivery[]): DeliveryPrediction[] => {
  return deliveries
    .filter((d) => !['delivered', 'failed'].includes(d.status))
    .map((delivery) => {
      // Simulate AI prediction factors
      const factors = [
        'Traffic patterns',
        'Weather conditions',
        'Historical delivery data',
        'Route optimization',
      ].slice(0, Math.floor(Math.random() * 3) + 2)

      // Add some random time variance from current time
      const now = new Date()
      const variance = Math.floor(Math.random() * 120) + 30 // 30-150 minutes
      now.setMinutes(now.getMinutes() + variance)

      return {
        deliveryId: delivery.id,
        predictedArrival: now.toISOString(),
        confidence: Math.floor(Math.random() * 20) + 75,
        factors,
      }
    })
}

// Generate AI Recommendations
export const generateAIRecommendations = (forecasts: DemandForecast[]): AIRecommendation[] => {
  const recommendations: AIRecommendation[] = []

  // Low stock recommendations
  const lowStockItems = forecasts.filter((f) => f.daysUntilStockout > 0 && f.daysUntilStockout < 14)
  lowStockItems.slice(0, 3).forEach((item) => {
    recommendations.push({
      id: `rec-${item.productId}-stock`,
      type: 'restock',
      priority: item.daysUntilStockout < 7 ? 'high' : 'medium',
      title: `Restock ${item.productName}`,
      description: `AI predicts stockout in ${item.daysUntilStockout} days based on demand patterns`,
      action: `Order ${item.recommendedReorderQty} units`,
      estimatedImpact: `Prevent ${item.predictedDemand * 2} in lost sales`,
      timestamp: new Date().toISOString(),
    })
  })

  // High demand trend recommendations
  const trendingUp = forecasts.filter((f) => f.trend === 'up' && f.confidence > 70)
  trendingUp.slice(0, 2).forEach((item) => {
    recommendations.push({
      id: `rec-${item.productId}-demand`,
      type: 'demand',
      priority: 'medium',
      title: `Increase ${item.productName} stock`,
      description: `AI detects 15% demand increase for this item. Consider increasing inventory.`,
      action: `Increase stock by ${Math.floor(item.currentStock * 0.3)} units`,
      estimatedImpact: `Capture additional ${(item.predictedDemand * 0.15 * item.currentStock).toFixed(0)} in potential sales`,
      timestamp: new Date().toISOString(),
    })
  })

  // Pricing recommendations based on demand
  const highDemand = forecasts.filter((f) => f.daysUntilStockout < 10)
  if (highDemand.length > 0) {
    recommendations.push({
      id: 'rec-pricing-demand',
      type: 'pricing',
      priority: 'low',
      title: 'Consider premium pricing',
      description: 'Several items showing high demand - consider temporary price adjustment',
      action: 'Review pricing strategy',
      estimatedImpact: 'Potential 5-10% revenue increase',
      timestamp: new Date().toISOString(),
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

// Get AI insight summary
export const getAIInsights = (
  forecasts: DemandForecast[],
  recommendations: AIRecommendation[],
) => {
  const highPriorityRecs = recommendations.filter((r) => r.priority === 'high').length
  const criticalStock = forecasts.filter((f) => f.daysUntilStockout > 0 && f.daysUntilStockout < 7)
    .length
  const trendingUp = forecasts.filter((f) => f.trend === 'up').length

  return {
    summary: `${highPriorityRecs} urgent actions needed. ${criticalStock} items critically low. ${trendingUp} items trending up.`,
    alertLevel: criticalStock > 0 ? 'high' : highPriorityRecs > 0 ? 'medium' : 'low',
  } as const
}
