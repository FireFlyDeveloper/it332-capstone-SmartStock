import type { Role } from '../components/AuthContext';

const adminOnlyPrefixes = ['/admin', '/analytics', '/reports'];

export function getPostLoginPath(pathname: string | undefined, role: Role | null): string {
  if (!pathname || pathname === '/login') return '/';
  if (pathname === '/admin') return role === 'admin' ? '/admin/staff' : '/';

  const requestedAdminRoute = adminOnlyPrefixes.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
  if (requestedAdminRoute && role !== 'admin') return '/';

  return pathname;
}
