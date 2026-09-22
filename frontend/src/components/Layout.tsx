/**
 * Layout — Soft Professional App Shell
 *
 * Spec:
 * - Fixed-width sidebar (280px), #0f172a background, 1px solid #1e293b borders
 * - Top logo 40x40px rounded-xl box + brand title
 * - Grouped navigation under uppercase labels (GESTION, FINANCES)
 * - Navigation items: 13px font, text-slate-400, right-aligned chevron
 * - Active state: Background #4f46e5, white text, shadow-[0_10px_15px_-3px_rgba(79,70,229,0.4)]
 * - Sticky Header: 80px height, #ffffff, border-bottom 1px solid #f1f5f9
 * - Search bar 400px width, #f8fafc bg, rounded-2xl, leading search icon
 * - Right icon group: notifications with red dot
 * - Profile component: Avatar + Name + Role
 */

import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  Compass,
  BarChart3,
  FileText,
  ChevronRight,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

interface LayoutProps {
  children: ReactNode;
}

interface NavGroup {
  label: string;
  items: {
    icon: React.ElementType;
    label: string;
    path: string;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'MANAGEMENT',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Package, label: 'Inventory', path: '/inventory' },
      { icon: ShoppingBag, label: 'Orders', path: '/orders' },
      { icon: Truck, label: 'Deliveries', path: '/delivery' },
    ],
  },
  {
    label: 'FINANCES & ANALYTICS',
    items: [
      { icon: Compass, label: 'Live Tracking', path: '/tracking' },
      { icon: BarChart3, label: 'AI Analytics', path: '/analytics' },
      { icon: FileText, label: 'Reports & Sales', path: '/reports' },
    ],
  },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 280px Fixed-width Dark Navy Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[280px] min-w-[280px] bg-[#0f172a] border-r border-[#1e293b]
          flex flex-col justify-between
          transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          dark-scrollbar overflow-y-auto
        `}
      >
        <div className="flex flex-col flex-1">
          {/* Top Logo & Brand Section */}
          <div className="h-[80px] px-6 flex items-center justify-between border-b border-[#1e293b]">
            <NavLink to="/" className="flex items-center gap-3 group">
              {/* 40x40px rounded-xl logo box */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4f46e5] to-[#6366f1] flex items-center justify-center shadow-lg shadow-indigo-950/60 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[17px] text-white tracking-[-0.02em] leading-tight">
                  SMARTSTOCK
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Glass &amp; Aluminum
                </span>
              </div>
            </NavLink>

            {/* Close button for mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation */}
          <div className="px-4 py-6 space-y-6 flex-1">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1.5">
                {/* Group label */}
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400/80 mb-2">
                  {group.label}
                </p>

                {group.items.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl
                        text-[13px] font-medium transition-all duration-300
                        ${
                          isActive
                            ? 'bg-[#4f46e5] text-white shadow-[0_10px_15px_-3px_rgba(79,70,229,0.4)] font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }
                      `}
                    >
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-all ${
                          isActive
                            ? 'text-white opacity-100 translate-x-0'
                            : 'text-slate-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5'
                        }`}
                      />
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>


        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[280px] min-w-0">
        {/* Sticky Header: 80px height, #ffffff, border-bottom #f1f5f9 */}
        <header className="sticky top-0 z-30 h-[80px] bg-white border-b border-[#f1f5f9] px-4 lg:px-8 flex items-center justify-between shadow-[0_1px_3px_rgb(0_0_0/0.02)]">
          {/* Left: Mobile Toggle + 400px Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* 400px Search Bar with #f8fafc background, rounded-2xl */}
            <div className="relative w-full max-w-[400px] hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, orders, trucks, SKUs..."
                className="w-full h-11 pl-10 pr-12 text-xs bg-[#f8fafc] border border-slate-200/80 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Profile Component: Avatar + Name + Role */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-sm">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-extrabold text-sm text-[#4f46e5]">
                    {user?.name ? user.name[0].toUpperCase() : 'K'}
                  </div>
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-extrabold text-[13px] text-slate-900 leading-tight">
                    {user?.name || 'Kim Saludes'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {user?.role ? `${user.role} Manager` : 'Super Admin'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* Profile dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#f1f5f9] shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name || 'Kim Saludes'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@smartstock.local'}</p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/analytics');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      General Analytics
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Fluid Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
