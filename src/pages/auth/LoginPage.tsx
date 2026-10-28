import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, AlertCircle, ArrowLeft, Loader2, ArrowRight, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface RoleButtonOption {
  id: string;
  name: string;
  gujarati: string;
  badge: string;
  emoji: string;
  desc: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  activeRing: string;
  badgeBg: string;
}

const ROLE_OPTIONS: RoleButtonOption[] = [
  {
    id: 'bal',
    name: 'Bal Volunteer',
    gujarati: 'બાલ વિભાગ સ્વયંસેવક',
    badge: 'BAL VOLUNTEER',
    emoji: '👦',
    desc: 'Search, walk-in registration & card distribution for boys',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50/90',
    activeText: 'text-blue-950',
    activeRing: 'ring-2 ring-blue-500',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'blk',
    name: 'Balika Volunteer',
    gujarati: 'બાલિકા વિભાગ સ્વયંસેવક',
    badge: 'BLK VOLUNTEER',
    emoji: '👧',
    desc: 'Search, walk-in registration & card distribution for girls',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-50/90',
    activeText: 'text-rose-950',
    activeRing: 'ring-2 ring-rose-500',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'admin',
    name: 'Event Admin',
    gujarati: 'એડમિન કંટ્રોલ સેન્ટર',
    badge: 'ADMIN COMMAND',
    emoji: '🛠️',
    desc: 'Event analytics, card printing, accounts & global settings',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50/90',
    activeText: 'text-amber-950',
    activeRing: 'ring-2 ring-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<string>('bal');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect intelligently based on role
  React.useEffect(() => {
    if (isAuthenticated) {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/volunteer');
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(selectedRole, password);
      // Navigation is handled reactively by useEffect above once role resolves
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(msg);
      setLoading(false);
    }
  };

  const currentOption = ROLE_OPTIONS.find((r) => r.id === selectedRole) || (
    selectedRole === 'superadmin' ? {
      id: 'superadmin',
      name: 'Super Admin',
      gujarati: 'સુપર એડમિન',
      badge: 'SUPER ADMIN',
      emoji: '👑',
      desc: 'Master system authority & full administrative control',
      activeBorder: 'border-purple-500',
      activeBg: 'bg-purple-50/90',
      activeText: 'text-purple-950',
      activeRing: 'ring-2 ring-purple-500',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    } : ROLE_OPTIONS[0]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Website</span>
        </Link>

        <div className="flex justify-center mb-3">
          <img
            src="/anandotsav-logo.png"
            alt="Anandotsav 2026 Logo"
            className="h-20 w-auto object-contain drop-shadow-md"
          />
        </div>

        <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Shield className="w-5 h-5" />
        </div>

        <h1 className="text-center font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Staff &amp; Operations Portal
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500 font-medium">
          Select your role below and enter your password to sign in
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection Buttons (No Dropdown) */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 text-left">
                Select Your Role (તમારો રોલ પસંદ કરો) *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const isSelected = selectedRole === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(opt.id);
                        setError(null);
                      }}
                      disabled={loading}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                        isSelected
                          ? `${opt.activeBorder} ${opt.activeBg} ${opt.activeRing} shadow-md`
                          : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{opt.emoji}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-100" />
                          )}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 leading-tight">
                          {opt.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {opt.gujarati}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60">
                        <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border ${opt.badgeBg}`}>
                          {opt.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Context Banner */}
              <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">{currentOption.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      Signing in as {currentOption.name}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${currentOption.badgeBg}`}>
                      {currentOption.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                    {currentOption.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Password (પાસવર્ડ) *
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder={`Enter password for ${currentOption.name}...`}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs transition-colors"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {currentOption.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Super Admin Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Need master access?</span>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('superadmin');
                setError(null);
              }}
              className={`font-bold transition-colors cursor-pointer ${
                selectedRole === 'superadmin' ? 'text-purple-700 underline' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In as Super Admin 👑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
