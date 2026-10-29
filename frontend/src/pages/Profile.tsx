import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Lock,
  Bell,
  Sliders,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Radio,
  Volume2,
  FileSpreadsheet,
  Globe,
  Clock,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { apiFetch, type ApiError } from '../api';
import { toast } from 'sonner';

type ProfileTab = 'profile' | 'security' | 'notifications' | 'settings';

interface NotificationPreferences {
  inApp: boolean;
  browserPush: boolean;
  emailDigest: boolean;
  soundAlerts: boolean;
  lowStockAlerts: boolean;
  orderStatusUpdates: boolean;
  deliveryDispatches: boolean;
  weeklyFinancialReport: boolean;
}

interface AppSettings {
  currency: 'PHP' | 'USD';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timezone: string;
  dataDensity: 'comfortable' | 'compact';
  autoRefreshInterval: number; // in seconds, 0 = manual
  defaultExportType: 'sales' | 'purchases' | 'inventory' | 'spending';
  defaultExportFormat: 'pdf' | 'xlsx' | 'csv';
}

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  inApp: true,
  browserPush: false,
  emailDigest: true,
  soundAlerts: true,
  lowStockAlerts: true,
  orderStatusUpdates: true,
  deliveryDispatches: true,
  weeklyFinancialReport: false,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  currency: 'PHP',
  dateFormat: 'YYYY-MM-DD',
  timezone: 'Asia/Manila (GMT+8)',
  dataDensity: 'comfortable',
  autoRefreshInterval: 30,
  defaultExportType: 'sales',
  defaultExportFormat: 'pdf',
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ProfileTab) || 'profile';

  const [activeTab, setActiveTab] = useState<ProfileTab>(
    ['profile', 'security', 'notifications', 'settings'].includes(initialTab) ? initialTab : 'profile'
  );

  // ── Profile Form State ──────────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password Form State ─────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);


  // ── Browser Notification State ──────────────────────────────────
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem('smartstock_notif_prefs');
      return stored ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(stored) } : DEFAULT_NOTIF_PREFS;
    } catch {
      return DEFAULT_NOTIF_PREFS;
    }
  });

  // ── App Settings State ──────────────────────────────────────────
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('smartstock_app_settings');
      return stored ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });

  // Keep search params in sync with tab changes
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Sync user info if auth updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');

    }
  }, [user]);

  // ── Password Strength Calculation ──────────────────────────────
  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    try {
      const response = await apiFetch<{ ok: boolean; user: { name: string } }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });

      updateUser({ name: response.user.name });
      toast.success('Profile information saved successfully!');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      // Attempt backend password change
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 400 || apiErr.status === 401) {
        toast.error(apiErr.message || 'Current password incorrect.');
      } else toast.error(apiErr.message || 'Could not update password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser notifications are not supported in this browser.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      if (result === 'granted') {
        toast.success('Browser notification permission granted.');
        setNotifPrefs((prev) => ({ ...prev, browserPush: true }));
        // Trigger a native test notification
        new Notification('Browser notification permission enabled', {
          body: 'This only confirms permission for local notifications shown by this page. It does not subscribe this browser to backend alerts.',
          icon: '/favicon.ico',
        });
      } else if (result === 'denied') {
        toast.error('Browser notifications were blocked. Please enable them in browser site settings.');
      }
    } catch {
      toast.error('Failed to request notification permission.');
    }
  };

  const handleTestPushNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('SmartStock browser preview', {
        body: 'This local preview does not verify server-side push delivery.',
      });
      toast.info('Local browser notification preview shown.');
    } else {
      toast.error('Grant browser notification permission before previewing a local notification.');
    }
  };

  const handleSaveNotifPrefs = () => {
    try {
      localStorage.setItem('smartstock_notif_prefs', JSON.stringify(notifPrefs));
      toast.success('Notification preferences saved on this browser. Server-side delivery is not configured.');
    } catch {
      toast.error('Could not save notification preferences in this browser.');
    }
  };

  const handleSaveAppSettings = () => {
    try {
      localStorage.setItem('smartstock_app_settings', JSON.stringify(appSettings));
      toast.success('Preferences saved on this browser.');
    } catch {
      toast.error('Could not save preferences in this browser.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* ── Page Header & Profile Hero Card ────────────────────────── */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with initial */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-1 shadow-md shadow-indigo-900/10 shrink-0">
            <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center font-black text-2xl sm:text-3xl text-[#4f46e5]">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {name || 'Staff User'}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-indigo-50 text-[#4f46e5] border border-indigo-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}
              >
                {user?.role || 'staff'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
              {email}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Authenticated session</span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-end gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            User ID: <span className="font-mono text-slate-600">{user?.id?.slice(0, 8) || '—'}</span>
          </span>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#f1f5f9] pb-2 overflow-x-auto">
        {[
          { key: 'profile', label: 'Profile Info', icon: UserIcon },
          { key: 'security', label: 'Change Password', icon: Lock },
          { key: 'notifications', label: 'Browser Notifications', icon: Bell },
          { key: 'settings', label: 'Preferences & Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key as ProfileTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/15'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Profile Information ──────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Personal &amp; Contact Details</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update the name associated with your account.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Login Account)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">Email is managed by organization admin</p>
              </div>


            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Change Password & Security ───────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure your SmartStock account uses a strong, unique password of at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                    placeholder="Minimum 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            step <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      Strength:{' '}
                      <span className={passwordStrength <= 2 ? 'text-amber-600' : 'text-emerald-600'}>
                        {passwordStrength <= 1
                          ? 'Weak'
                          : passwordStrength === 2
                          ? 'Fair'
                          : passwordStrength === 3
                          ? 'Good'
                          : 'Strong'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication & Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-400">Multi-factor authentication is not configured for this application.</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">This security feature is unavailable until server-side 2FA support is implemented.</p>
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Current Login Session</h4>
                  <p className="text-xs text-slate-400">Authenticated device info</p>
                </div>
              </div>

              <div className="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-700">Browser / device:</span>
                  <span className="text-slate-500 font-mono text-right truncate">{navigator.userAgent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Session Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Browser Notifications ────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Browser Notification Card */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 rounded-[28px] p-6 sm:p-8 border border-indigo-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/15">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">Browser Notifications</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      browserPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : browserPermission === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {browserPermission === 'granted'
                      ? 'Permission Granted'
                      : browserPermission === 'denied'
                      ? 'Blocked'
                      : 'Permission Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Receive local browser notifications when explicitly previewed here. Background and server-side event delivery are not configured.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {browserPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={() => void handleRequestPushPermission()}
                  className="btn-primary text-xs font-bold py-2.5 px-4 shadow-sm"
                >
                  Enable Browser Notifications
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3.5 shadow-2xs text-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span>Preview Local Notification</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed Notification Preferences */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Local Notification Preferences</h3>
              <p className="text-xs text-slate-400 mt-0.5">Saved only in this browser; these choices do not subscribe to backend events, send email digests, or control automated sound/alert delivery.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'lowStockAlerts',
                  label: 'Low Stock & Critical Inventory Thresholds',
                  desc: 'Local preference only; automated inventory threshold alerts are not configured.',
                  icon: AlertCircle,
                },
                {
                  key: 'orderStatusUpdates',
                  label: 'New Customer Orders & Processing Status',
                  desc: 'Local preference only; server-side order event alerts are not configured.',
                  icon: CheckCircle2,
                },
                {
                  key: 'deliveryDispatches',
                  label: 'Courier Dispatches & Live Tracking Updates',
                  desc: 'Local preference only; server-side dispatch and tracking alerts are not configured.',
                  icon: Smartphone,
                },
                {
                  key: 'soundAlerts',
                  label: 'Audio Chime for Urgent Notifications',
                  desc: 'Local preference only; event-triggered sound playback is not configured.',
                  icon: Volume2,
                },
                {
                  key: 'weeklyFinancialReport',
                  label: 'Weekly Financial & Inventory Summary Digest',
                  desc: 'Local preference only; scheduled email or weekly digest delivery is not configured.',
                  icon: FileSpreadsheet,
                },
              ].map((item) => {
                const isEnabled = Boolean(notifPrefs[item.key as keyof NotificationPreferences]);
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-[#4f46e5] flex items-center justify-center shadow-2xs shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNotifPrefs((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof NotificationPreferences],
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-[#4f46e5]' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotifPrefs}
                className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Notification Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Preferences & System Settings ─────────────────────── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Browser-Only Preferences</h3>
            <p className="text-xs text-slate-400 mt-0.5">Saved in this browser only. Current screens do not read these choices to change currency, date formatting, density, refresh behavior, or export output.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Currency */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Currency Representation</span>
                </label>
                <select
                  value={appSettings.currency}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, currency: e.target.value as 'PHP' | 'USD' }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value="PHP">PHP (₱) - Philippine Peso</option>
                  <option value="USD">USD ($) - US Dollar</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Date Display Format</span>
                </label>
                <select
                  value={appSettings.dateFormat}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, dateFormat: e.target.value as any }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 Standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                </select>
              </div>

              {/* Data Density */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Interface Density</span>
                </label>
                <select
                  value={appSettings.dataDensity}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, dataDensity: e.target.value as any }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value="comfortable">Comfortable (Standard spacing &amp; typography)</option>
                  <option value="compact">Compact (Higher data row density)</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Auto-Refresh Preference (Not Applied)</span>
                </label>
                <select
                  value={appSettings.autoRefreshInterval}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, autoRefreshInterval: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value={15}>Every 15 seconds</option>
                  <option value={30}>Every 30 seconds (Default)</option>
                  <option value={60}>Every 1 minute</option>
                  <option value={0}>Manual refresh only</option>
                </select>
              </div>

              {/* Default Export Report Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Default Export Report</span>
                </label>
                <select
                  value={appSettings.defaultExportType}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, defaultExportType: e.target.value as any }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value="sales">Sales Statement</option>
                  <option value="purchases">Purchases Summary</option>
                  <option value="inventory">Inventory Valuation</option>
                  <option value="spending">Spending Report</option>
                </select>
              </div>

              {/* Default Export Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>Default Export Format</span>
                </label>
                <select
                  value={appSettings.defaultExportFormat}
                  onChange={(e) =>
                    setAppSettings((prev) => ({ ...prev, defaultExportFormat: e.target.value as any }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none"
                >
                  <option value="pdf">PDF Document (Formatted)</option>
                  <option value="xlsx">Excel Spreadsheet (XLSX)</option>
                  <option value="csv">CSV (Comma-Separated)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAppSettings}
                className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Save System Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
