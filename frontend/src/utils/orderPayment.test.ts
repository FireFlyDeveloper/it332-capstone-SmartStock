import { describe, expect, it } from 'vitest';
import { canRecordOrderPayment } from './orderPayment';

describe('canRecordOrderPayment', () => {
  it('allows recording a remaining balance after delivery is complete', () => {
    expect(canRecordOrderPayment({ orderStatus: 'completed', paidAmount: 0, total: 100 })).toBe(true);
  });

  it('does not allow payment on cancelled or fully-paid orders', () => {
    expect(canRecordOrderPayment({ orderStatus: 'cancelled', paidAmount: 0, total: 100 })).toBe(false);
    expect(canRecordOrderPayment({ orderStatus: 'completed', paidAmount: 100, total: 100 })).toBe(false);
  });
});
