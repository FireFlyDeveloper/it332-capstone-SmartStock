import { describe, expect, it } from 'vitest';
import { profileTabPath, resolveProfileTab } from '../utils/profileTabs';

describe('profile route tabs', () => {
  it('resolves every profile-menu destination, including changes while the page stays mounted', () => {
    expect(resolveProfileTab('profile')).toBe('profile');
    expect(resolveProfileTab('security')).toBe('security');
    expect(resolveProfileTab('notifications')).toBe('notifications');
    expect(resolveProfileTab('settings')).toBe('settings');
    expect(resolveProfileTab(null)).toBe('profile');
    expect(resolveProfileTab('unknown')).toBe('profile');
    expect(profileTabPath('profile')).toBe('/profile');
    expect(profileTabPath('security')).toBe('/profile?tab=security');
    expect(profileTabPath('notifications')).toBe('/profile?tab=notifications');
    expect(profileTabPath('settings')).toBe('/profile?tab=settings');
  });
});
