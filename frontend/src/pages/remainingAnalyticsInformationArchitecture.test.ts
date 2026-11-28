import { describe, expect, it } from 'vitest';
import analytics from './Analytics.tsx?raw';
import forecastEvidence from '../components/DemandForecastEvidence.tsx?raw';
import forecastUtils from '../components/forecastEvidenceUtils.ts?raw';

describe('remaining analytics information architecture', () => {
  it('removes repeated totals and metric-by-metric prose when the visual already carries the analysis', () => {
    expect(analytics).not.toContain('Order Records');
    expect(analytics).not.toContain('title={formatCurrency(totalInventoryValue)}');
    expect(analytics).not.toContain('monthlyMovementChartRows.reduce');
    expect(analytics).not.toContain('<InsightBreakdown');
    expect(analytics).toContain('Monthly Order Transactions');
    expect(analytics).toContain('Stock at Listed Prices by Category');
    expect(analytics).toContain('Monthly Stock Inflow &amp; Outflow');
    expect(analytics).toContain('Average gross order value in this range');
    expect(analytics).not.toContain('/* Key Metrics */');
  });

  it('uses a single-product visual forecast-versus-actual chart with an accessible data table', () => {
    expect(forecastEvidence).toContain('<ComposedChart data={chartData}');
    expect(forecastEvidence).toContain('Forecast vs actual sales');
    expect(forecastUtils).toContain('targetEstimate');
    expect(forecastUtils).toContain('positiveHistoryMonths');
    expect(forecastEvidence).toContain('Absolute error:');
    expect(forecastEvidence).toContain('className="sr-only"');
  });
});
