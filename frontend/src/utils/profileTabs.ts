export type ProfileTab = 'profile' | 'security' | 'notifications' | 'settings';

const PROFILE_TABS = new Set<ProfileTab>(['profile', 'security', 'notifications', 'settings']);

export function resolveProfileTab(value: string | null): ProfileTab {
  return value && PROFILE_TABS.has(value as ProfileTab) ? value as ProfileTab : 'profile';
}

export function profileTabPath(tab: ProfileTab): string {
  return tab === 'profile' ? '/profile' : `/profile?tab=${encodeURIComponent(tab)}`;
}
