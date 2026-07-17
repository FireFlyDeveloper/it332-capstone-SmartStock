/**
 * Reports service — stable JSON report DTOs composed from analytics and stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { getAnnualPurchases, getSalesTrends } from '../analytics/service.js';
import { listProducts, type Product } from '../inventory/store.js';

function currentUtcYear() {
  return new Date().getUTCFullYear();
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildMonthlySalesReport() {
  const rows = getSalesTrends();
  return {
    report: 'monthly_sales' as const,
    totals: {
      months: rows.length,
      transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      grossSales: roundTwo(rows.reduce((sum, row) => sum + row.grossSales, 0)),
    },
    rows,
  };
}

export function buildAnnualPurchasesReport(year = currentUtcYear()) {
  const rows = getAnnualPurchases(year);
  return {
    report: 'annual_purchases' as const,
    year,
    totals: {
      groups: rows.length,
      transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      totalQuantity: rows.reduce((sum, row) => sum + row.totalQuantity, 0),
      totalCost: roundTwo(rows.reduce((sum, row) => sum + row.totalCost, 0)),
    },
    rows,
  };
}

function stockStatus(product: Product): 'low_stock' | 'healthy' {
  return product.stock <= product.threshold ? 'low_stock' : 'healthy';
}

export function buildInventoryEvaluationReport() {
  const rows = listProducts().map((product) => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    stock: product.stock,
    unit: product.unit,
    unitPrice: product.price,
    inventoryValue: roundTwo(product.stock * product.price),
    threshold: product.threshold,
    stockStatus: stockStatus(product),
  }));

  return {
    report: 'inventory_evaluation' as const,
    totals: {
      products: rows.length,
      totalStock: rows.reduce((sum, row) => sum + row.stock, 0),
      totalInventoryValue: roundTwo(rows.reduce((sum, row) => sum + row.inventoryValue, 0)),
      lowStockCount: rows.filter((row) => row.stockStatus === 'low_stock').length,
    },
    rows,
  };
}

export function buildSpendingReport(year = currentUtcYear()) {
  const purchaseRows = getAnnualPurchases(year);
  const totalSpend = roundTwo(purchaseRows.reduce((sum, row) => sum + row.totalCost, 0));
  const rows = purchaseRows.map((row) => ({
    materialType: row.materialType,
    supplier: row.supplier,
    totalSpend: row.totalCost,
    shareOfSpend: totalSpend === 0 ? 0 : roundTwo((row.totalCost / totalSpend) * 100),
  }));

  return {
    report: 'spending' as const,
    year,
    totals: {
      groups: rows.length,
      totalSpend,
    },
    rows,
  };
}
