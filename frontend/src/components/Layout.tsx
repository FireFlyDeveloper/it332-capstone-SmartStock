/**
 * Layout - app shell with sidebar + topbar + content area. Adapted from the
 * Capstone Layout: uses the IT332 useAuth() user for the profile section and
 * the local React Router instance for nav.
 */

import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  Database,
} from 'lucide-react'
import { useAuth } from './AuthContext'

interface LayoutProps {
  children: ReactNode
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  { icon: Truck, label: 'Delivery', path: '/delivery' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', requiresAnalytics: true },
  { icon: FileText, label: 'Reports', path: '/reports' },
]

export function Layout({ children }: LayoutProps) {
  const { user, logout, canViewAnalytics } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const visibleMenuItems = menuItems.filter((item) => !item.requiresAnalytics || canViewAnalytics)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell flex min-h-[100dvh]">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          app-sidebar fixed inset-y-0 left-0 z-50 w-72
          transform transition-transform duration-200 ease-out lg:static
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <div className="panel-muted flex items-center gap-3 p-3">
              <div className="icon-tile h-11 w-11 shrink-0">
                <Package className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-[0.08em] text-text">SMARTSTOCK</h1>
                <p className="text-xs font-medium text-text-muted">Glassram operations</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Primary navigation">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex w-full items-center gap-3 rounded-[var(--radius-input)] px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent-hover shadow-[inset_3px_0_0_var(--accent)]'
                      : 'text-text-muted hover:bg-surface-2 hover:text-text'
                  }`
                }
              >
                <item.icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="app-topbar sticky top-0 z-30 flex min-h-16 items-center justify-between border-b px-4 py-3 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="btn-secondary h-10 w-10 p-0 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-text sm:text-lg">SmartStock</h2>
                <span
                  title="This is a demo build. Data is mock data."
                  className="chip hidden sm:inline-flex"
                >
                  <Database className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Demo build
                </span>
              </div>
              <p className="hidden text-xs text-text-muted sm:block">Inventory, orders, delivery, and reports</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-text">{user?.name || 'Guest'}</p>
              <p className="text-xs capitalize text-text-muted">{user?.role || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary h-10 gap-2 border-danger-border px-3 text-danger hover:bg-danger-soft"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-7 lg:py-7">{children}</main>
      </div>
    </div>
  )
}
