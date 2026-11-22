import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AnalyticsInsightsLoading } from './Analytics'
import analyticsSource from './Analytics.tsx?raw'

describe('Analytics insights loading', () => {
  it('keeps a pending insights request local instead of blocking the loaded page', () => {
    const html = renderToStaticMarkup(<AnalyticsInsightsLoading loading />)

    expect(html).toContain('role="status"')
    expect(html).toContain('Reviewing sales, purchases, and stock activity…')
    expect(html).not.toContain('fixed inset-0')
    expect(html).not.toContain('min-h-[100dvh]')
    expect(analyticsSource).not.toContain('aiInsightLoading && !aiInsight && <FullScreenLoading')
  })
})
