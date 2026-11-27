import { describe, expect, it } from 'vitest';
import dashboard from './Dashboard.tsx?raw';
import analytics from './Analytics.tsx?raw';
import routes from '../App.tsx?raw';

describe('dashboard and analytics information architecture', () => {
  it('keeps historical charts in Analytics instead of duplicating them on Dashboard', () => {
    expect(dashboard).not.toMatch(/<AreaChart|<BarChart|getAnalyticsSalesTrends/);
    expect(dashboard).toContain("{user?.role === 'admin' && (");
    expect(dashboard).toContain('to="/analytics"');
    expect(dashboard).toContain('Open Analytics');
    expect(analytics).toContain('Monthly Gross Sales');
    expect(analytics).toContain('Monthly Gross Order Value');
    expect(analytics).toMatch(/<AreaChart/);
  });

  it('keeps dashboard actions focused without a second Analytics promo panel', () => {
    expect(dashboard).not.toContain('OperationsInsightsBanner');
    expect(dashboard).toContain('<QuickActionsGrid />');
  });

  it('keeps the current low-stock indicator on the operational Dashboard only', () => {
    expect(dashboard).toContain('label="LOW STOCK"');
    expect(analytics).not.toContain('Active Low Stock Items');
  });

  it('keeps the Analytics route restricted to administrators', () => {
    expect(routes).toMatch(/path="\/analytics"[\s\S]*?allowedRoles=\{\['admin'\]\}/);
  });
});
