import { describe, expect, it } from 'vitest';
import { getPostLoginPath } from './postLoginPath';

describe('post-login route selection', () => {
  it('sends staff to a safe page when stale state points at the admin root', () => {
    expect(getPostLoginPath('/admin', 'staff')).toBe('/');
  });

  it('sends staff away from admin-only routes', () => {
    expect(getPostLoginPath('/admin/staff', 'staff')).toBe('/');
    expect(getPostLoginPath('/analytics', 'staff')).toBe('/');
    expect(getPostLoginPath('/reports', 'staff')).toBe('/');
  });

  it('sends an admin from the admin root to the implemented staff-management route', () => {
    expect(getPostLoginPath('/admin', 'admin')).toBe('/admin/staff');
  });

  it('preserves a valid requested route and defaults invalid login destinations to home', () => {
    expect(getPostLoginPath('/orders', 'staff')).toBe('/orders');
    expect(getPostLoginPath('/login', 'staff')).toBe('/');
    expect(getPostLoginPath(undefined, 'admin')).toBe('/');
  });
});
