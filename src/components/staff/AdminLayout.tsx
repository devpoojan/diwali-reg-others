import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordModal } from '@/components/staff/ChangePasswordModal';
import { getEventSettings } from '@/services/eventSettingsService';
import type { EventSettings } from '@/types';
import { 
  LayoutDashboard, 
  Users, 
  Sliders, 
  ShieldAlert, 
  Search, 
  LogOut, 
  ArrowUpRight,
  Printer,
  KeyRound,
  MapPin,
  Sparkles
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle, actions }) => {
  const { currentUser, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);

  useEffect(() => {
    getEventSettings().then(setEventSettings).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Registrations Directory', path: '/admin/registrations', icon: Users },
    { label: 'Area-Wise Report (વિસ્તાર રિપોર્ટ)', path: '/admin/area-report', icon: MapPin },
    { label: 'Card Printing (કાર્ડ પ્રિન્ટ)', path: '/admin/printing', icon: Printer },
    { label: 'Registration Toggles', path: '/admin/settings', icon: Sliders },
    { label: 'Staff Accounts', path: '/admin/accounts', icon: ShieldAlert },
    { label: 'Setup Wizard (સેટઅપ)', path: '/admin/setup-wizard', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Brand & Profile Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2.5 group">
                <img
                  src={eventSettings?.logoUrl || '/anandotsav-logo.png'}
                  alt={`${eventSettings?.eventName || 'Event'} Logo`}
                  className="h-10 w-auto max-w-[50px] object-contain drop-shadow group-hover:scale-105 transition-transform"
                />
                <div>
                  <div className="font-display font-extrabold text-slate-900 text-base leading-none tracking-tight flex items-center gap-2">
                    <span>{eventSettings?.eventName || 'Anandotsav 2026'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                      Admin Command
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {eventSettings?.organizationName || 'Central Management System'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Actions & Profile */}
            <div className="flex items-center gap-3">
              <Link
                to="/volunteer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
                title="Switch to ground volunteer search mode"
              >
                <Search className="w-3.5 h-3.5 text-amber-600" />
                <span>Volunteer Station</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-900">{currentUser?.displayName || 'Administrator'}</div>
                  <div className="text-[10px] text-amber-600 font-bold uppercase">{role?.replace('_', ' ')}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                  title="Change Account Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Sign out of Admin Panel"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2.5 border-t border-slate-200 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Page Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Anandotsav 2026 &bull; Online Event Operations &amp; Administration
      </footer>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
};
