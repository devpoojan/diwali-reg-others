import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getEventSettings } from '@/services/eventSettingsService';
import type { EventSettings } from '@/types';

export const PublicNavbar: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<EventSettings | null>(null);

  useEffect(() => {
    getEventSettings().then(setSettings).catch(() => {});
  }, []);

  const logoSrc = settings?.logoUrl || '/anandotsav-logo.png';
  const title = settings?.eventName || 'Anandotsav 2026';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-purple-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <img
            src={logoSrc}
            alt={`${title} Logo`}
            className="h-8 sm:h-11 w-auto max-w-[50px] sm:max-w-[70px] object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="font-display font-extrabold text-slate-900 tracking-tight text-sm sm:text-lg leading-tight flex items-center gap-1">
            <span>{title}</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow active:scale-95 transition-all"
          >
            {t('રજીસ્ટર કરો ➜', 'Register Now ➜')}
          </Link>
        </div>
      </div>
    </header>
  );
};
