import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';

export const StaffNavbar: React.FC = () => {
  const { currentUser, categoryAccess, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDepartmentBadge = () => {
    if (categoryAccess === 'BAL_ONLY') {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black">
          👦 BAL
        </span>
      );
    }
    if (categoryAccess === 'BLK_ONLY') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black">
          👧 BLK
        </span>
      );
    }
    return (
      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black">
        BAL &amp; BLK
      </span>
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-11 sm:h-14">
          {/* Brand & Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link to="/volunteer" className="flex items-center gap-1 sm:gap-2.5">
              <img
                src="/anandotsav-logo.png"
                alt="Anandotsav 2026"
                className="h-6 sm:h-8 w-auto object-contain drop-shadow"
              />
              <span className="font-display font-extrabold text-sm sm:text-base text-slate-900">Anandotsav</span>
            </Link>
            <div className="flex items-center">{getDepartmentBadge()}</div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                to="/volunteer"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive('/volunteer') ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </Link>

              <Link
                to="/volunteer/quick-register"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive('/volunteer/quick-register') ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Walk-in</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive('/admin') 
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs font-extrabold' 
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Mobile Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                title="Admin Command"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title={`Logged in as ${currentUser?.displayName || 'Staff'}`}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
