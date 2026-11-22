import { describe, expect, it } from 'vitest';
import { NotificationAlertTracker, isUrgentNotification, playUrgentNotificationSound } from './notificationSound';

describe('notification sound rules', () => {
  it('marks only critical stock alerts as urgent', () => {
    expect(isUrgentNotification({ type: 'stock', severity: 'critical' })).toBe(true);
    expect(isUrgentNotification({ type: 'stock', severity: 'warning' })).toBe(false);
    expect(isUrgentNotification({ type: 'order', severity: 'critical' })).toBe(false);
    expect(isUrgentNotification({ type: 'delivery', severity: 'critical' })).toBe(false);
  });

  it('does not sound before a complete baseline, and only sounds for new or escalated critical stock alerts', () => {
    const oldCritical = { id: 'old-stock', type: 'stock', severity: 'critical' };
    const tracker = new NotificationAlertTracker();

    expect(tracker.observe([oldCritical], [oldCritical]).shouldSound).toBe(false);
    tracker.seed(['old-stock'], [oldCritical]);
    expect(tracker.observe([oldCritical], [oldCritical]).shouldSound).toBe(false);

    const newCritical = { id: 'new-stock', type: 'stock', severity: 'critical' };
    expect(tracker.observe([newCritical], [oldCritical, newCritical]).shouldSound).toBe(true);

    const escalationTracker = new NotificationAlertTracker();
    const warning = { id: 'escalating-stock', type: 'stock', severity: 'warning' };
    escalationTracker.seed(['escalating-stock'], [warning]);
    expect(escalationTracker.observe([], [{ ...warning, severity: 'critical' }]).shouldSound).toBe(true);
  });

  it('does not throw when audio is unavailable', () => {
    expect(() => playUrgentNotificationSound()).not.toThrow();
  });
});
