import { describe, expect, it } from 'vitest';
import inventory from './Inventory.tsx?raw';
import orders from './Orders.tsx?raw';
import delivery from './Delivery.tsx?raw';
import reports from './Reports.tsx?raw';
import dailySales from './DailySales.tsx?raw';
import analytics from './Analytics.tsx?raw';

describe('remaining analytics information architecture', () => {
  it('keeps historical visualizations on Analytics rather than operational list pages', () => {
    const operationalPages = [inventory, orders, delivery, reports, dailySales];
    for (const page of operationalPages) {
      expect(page).not.toMatch(/<(?:AreaChart|BarChart|LineChart|PieChart|ComposedChart)\b/);
    }
    expect(analytics).toMatch(/<(?:AreaChart|BarChart|LineChart|PieChart|ComposedChart)\b/);
  });

  it('keeps repeated-looking counts beside their task data and filters', () => {
    expect(inventory.indexOf('/* Stats */')).toBeLessThan(inventory.indexOf('{/* Products Table */}'));
    expect(orders.indexOf('Total Orders')).toBeLessThan(orders.indexOf('/* ── Order cards'));
    expect(delivery.indexOf('Delivery Orders')).toBeLessThan(delivery.indexOf('Deliveries Grid'));
    expect(dailySales).toContain('summary totals do not change with list filters');
  });
});
