import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Radio, 
  Star,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import type { EventSettings, Vistar } from '@/types';

interface HomePageProps {
  dedicatedVistar?: Vistar;
}

export const HomePage: React.FC<HomePageProps> = ({ dedicatedVistar }) => {
  const { t } = useLanguage();
  const [broadcast, setBroadcast] = useState<{ active: boolean; message: string }>({ active: false, message: '' });
  const [settings, setSettings] = useState<EventSettings | null>(null);

  const isChandlodiyaOnly = dedicatedVistar === 'CHANDLODIYA';
  const isVadajOnly = dedicatedVistar === 'VADAJ';
  const isDedicated = Boolean(dedicatedVistar);

  const registerUrl = dedicatedVistar ? `/register?vistar=${dedicatedVistar}` : '/register';
  const ctaButtonLabel = t('રજીસ્ટર કરો', 'Register Now');
  const mobileCtaLabel = t('રજીસ્ટર કરો ➜', 'Register Now ➜');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'eventSettings', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as EventSettings;
        setSettings(data);
        setBroadcast({
          active: Boolean(data.broadcastActive && data.broadcastAnnouncement),
          message: data.broadcastAnnouncement || '',
        });
      }
    });
    return () => unsub();
  }, []);

  const isRegistrationClosed = useMemo(() => {
    if (!settings) return false;
    if (settings.publicRegistrationEnabled === false) return true;
    if (settings.automaticClosingAt) {
      const deadline = new Date(settings.automaticClosingAt).getTime();
      if (!isNaN(deadline) && Date.now() >= deadline) return true;
    }
    return false;
  }, [settings]);

  const [copiedShare, setCopiedShare] = useState(false);

  const siteOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://anandotsav.web.app';

  const detailedClosedShareMessage = isChandlodiyaOnly
    ? `🌸 *જય સ્વામિનારાયણ!* 🌸\n\n` +
      `🎉 *BAPS આનંદોત્સવ ૨૦૨૬ — ચાંદલોડિયા* 🎉\n` +
      `🎈 *બાળ-બાલિકાઓ માટે આનંદનો ભવ્ય ઉત્સવ!* 🎈\n\n` +
      `💁🏻‍♂️ *આનંદોત્સવમાં માણવા મળશે...*\n\n` +
      `🎯🎳 મજેદાર ગેમ્સ\n` +
      `🎢🎠 આનંદદાયક રાઇડ્સ\n` +
      `🍬🍫 સ્વાદિષ્ટ પ્રસાદ\n` +
      `🎁🎉 જોરદાર ઇનામો\n\n` +
      `💥 *આ સમગ્ર આનંદોત્સવ સંપૂર્ણ નિઃશુલ્ક છે!* 💥\n\n` +
      `✨ *અગત્યની સૂચના:*\n` +
      `👉 *તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!*\n` +
      `સ્થળ પર જ ઓન-ધ-સ્પોટ કાઉન્ટર પરથી દરેક બાળકને ફિઝિકલ પ્રવેશ કાર્ડ મળી રહેશે.\n\n` +
      `────────────────────\n` +
      `🏛️ *ચાંદલોડિયા ઉત્સવ તારીખ, સમય અને સ્થળ:*\n` +
      `📅 તારીખ: ૩૧/૧૦/૨૦૨૬ (શનિવાર)\n` +
      `⏰ સમય: સાંજે ૫:૦૦ થી ૮:૦૦\n` +
      `🏛️ સ્થળ: ${settings?.chandlodiyaVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા, અમદાવાદ'}\n\n` +
      `📍 *ગૂગલ મેપ:*\nhttps://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad\n\n` +
      `👦👧 *મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો!*\n\n` +
      `🥳 *જો જો... ચૂકી ન જતા!* 🎈\n\n` +
      `🙏 *BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૯*\n` +
      `🌐 *સંપૂર્ણ વિગતો માટે જુઓ:* ${siteOrigin}/chandlodiya`
    : isVadajOnly
    ? `🌸 *જય સ્વામિનારાયણ!* 🌸\n\n` +
      `🎉 *BAPS આનંદોત્સવ ૨૦૨૬ — વાડજ* 🎉\n` +
      `🎈 *બાળ-બાલિકાઓ માટે આનંદનો ભવ્ય ઉત્સવ!* 🎈\n\n` +
      `💁🏻‍♂️ *આનંદોત્સવમાં માણવા મળશે...*\n\n` +
      `🎯🎳 મજેદાર ગેમ્સ\n` +
      `🎢🎠 આનંદદાયક રાઇડ્સ\n` +
      `🍬🍫 સ્વાદિષ્ટ પ્રસાદ\n` +
      `🎁🎉 જોરદાર ઇનામો\n\n` +
      `💥 *આ સમગ્ર આનંદોત્સવ સંપૂર્ણ નિઃશુલ્ક છે!* 💥\n\n` +
      `✨ *અગત્યની સૂચના:*\n` +
      `👉 *તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!*\n` +
      `સ્થળ પર જ ઓન-ધ-સ્પોટ કાઉન્ટર પરથી દરેક બાળકને ફિઝિકલ પ્રવેશ કાર્ડ મળી રહેશે.\n\n` +
      `────────────────────\n` +
      `🏛️ *વાડજ ઉત્સવ તારીખ, સમય અને સ્થળ:*\n` +
      `📅 તારીખ: ૦૧/૧૧/૨૦૨૬ (રવિવાર)\n` +
      `⏰ સમય: સાંજે ૫:૦૦ થી ૮:૦૦\n` +
      `🏛️ સ્થળ: ${settings?.vadajVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ, અમદાવાદ'}\n\n` +
      `📍 *ગૂગલ મેપ:*\nhttps://maps.app.goo.gl/7LLXNeLZWiTBakbx6\n\n` +
      `👦👧 *મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો!*\n\n` +
      `🥳 *જો જો... ચૂકી ન જતા!* 🎈\n\n` +
      `🙏 *BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૫*\n` +
      `🌐 *સંપૂર્ણ વિગતો માટે જુઓ:* ${siteOrigin}/vadaj`
    : `🌸 *જય સ્વામિનારાયણ!* 🌸\n\n` +
      `🎉 *BAPS આનંદોત્સવ ૨૦૨૬* 🎉\n` +
      `🎈 *બાળ-બાલિકાઓ માટે આનંદનો ભવ્ય ઉત્સવ!* 🎈\n\n` +
      `💁🏻‍♂️ *આનંદોત્સવમાં માણવા મળશે...*\n\n` +
      `🎯🎳 મજેદાર ગેમ્સ\n` +
      `🎢🎠 આનંદદાયક રાઇડ્સ\n` +
      `🍬🍫 સ્વાદિષ્ટ પ્રસાદ\n` +
      `🎁🎉 જોરદાર ઇનામો\n\n` +
      `💥 *આ સમગ્ર આનંદોત્સવ સંપૂર્ણ નિઃશુલ્ક છે!* 💥\n\n` +
      `✨ *અગત્યની સૂચના:*\n` +
      `👉 *તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!*\n` +
      `કોઈપણ બાળકે ચિંતા કરવાની જરૂર નથી — ઉત્સવના દિવસે સ્થળ પર જ ઓન-ધ-સ્પોટ કાઉન્ટર પરથી દરેક બાળકને ફિઝિકલ પ્રવેશ કાર્ડ મળી રહેશે.\n\n` +
      `────────────────────\n` +
      `🏛️ *ઉત્સવ તારીખ, સમય અને સ્થળની વિગત:*\n\n` +
      `📍 *૧. ચાંદલોડિયા સંસ્કારધામ*\n` +
      `📅 તારીખ: ૩૧/૧૦/૨૦૨૬ (શનિવાર) • સમય: સાંજે ૫:૦૦ થી ૮:૦૦\n` +
      `🏛️ સ્થળ: ${settings?.chandlodiyaVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા, અમદાવાદ'}\n` +
      `🗺️ ગૂગલ મેપ: https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad\n\n` +
      `📍 *૨. વાડજ સંસ્કારધામ*\n` +
      `📅 તારીખ: ૦૧/૧૧/૨૦૨૬ (રવિવાર) • સમય: સાંજે ૫:૦૦ થી ૮:૦૦\n` +
      `🏛️ સ્થળ: ${settings?.vadajVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ, અમદાવાદ'}\n` +
      `🗺️ ગૂગલ મેપ: https://maps.app.goo.gl/7LLXNeLZWiTBakbx6\n\n` +
      `👦👧 *મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો!*\n\n` +
      `🥳 *જો જો... ચૂકી ન જતા!* 🎈\n\n` +
      `🙏 *BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૫ & ૧૯*\n` +
      `🌐 *સંપૂર્ણ વિગતો માટે જુઓ:* ${siteOrigin}`;

  const closedWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(detailedClosedShareMessage)}`;

  const handleCopyClosedMessage = () => {
    navigator.clipboard.writeText(detailedClosedShareMessage);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Minimal landing screen for the root homepage (/) showing only Anandotsav logo and Area names
  if (!isDedicated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-pink-50/50 to-blue-50/60 text-slate-900 flex flex-col justify-between overflow-x-hidden">
        <PublicNavbar />

        {/* Live Ground Broadcast Notice */}
        {broadcast.active && (
          <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 shadow-md flex items-center justify-center gap-2.5 text-center sticky top-16 z-30 animate-fadeIn">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-white uppercase text-[10px] tracking-wider font-black">
              <Radio className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>{t('લાઈવ સૂચના', 'Live Announcement')}</span>
            </span>
            <span className="font-semibold">{broadcast.message}</span>
          </div>
        )}

        {/* Main Minimal Area Selection Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-3.5 py-5 sm:py-12 max-w-lg mx-auto w-full text-center relative z-10 font-gujarati">
          {/* Decorative glows */}
          <div className="absolute top-1/4 -left-12 w-48 h-48 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -right-12 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />

          {/* Official 3D Anandotsav 2026 Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-8 flex justify-center"
          >
            <img
              src="/anandotsav-logo.png"
              alt="Anandotsav 2026 Logo"
              className="w-full max-w-[220px] xs:max-w-[300px] sm:max-w-[420px] h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-300"
            />
          </motion.div>

          {/* Area Selection Title */}
          <div className="mb-4 sm:mb-6">
            <span className="text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-100/90 border border-purple-200/90 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-1.5 sm:mb-2.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{t('વિસ્તાર પસંદગી', 'Area Selection')}</span>
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 mb-1">
              {t('તમારો વિસ્તાર પસંદ કરો', 'Select Your Area')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold">
              {t('નીચે આપેલા કેન્દ્રોમાંથી આપનો વિસ્તાર પસંદ કરો', 'Choose your center below to continue')}
            </p>
          </div>

          {/* The Two Big Area Cards */}
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Chandlodiya Area Card */}
            <Link
              to="/chandlodiya"
              className="group block p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-[0_10px_25px_rgba(147,51,234,0.35)] hover:shadow-[0_16px_35px_rgba(147,51,234,0.45)] active:scale-[0.98] transition-all transform text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    🏛️
                  </span>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black leading-tight">
                      {t('૧. ચાંદલોડિયા (Chandlodiya)', '1. Chandlodiya')}
                    </h2>
                    <p className="text-[11px] sm:text-sm text-purple-100 font-bold mt-0.5 sm:mt-1">
                      📅 ૩૧/૧૦/૨૦૨૬ (શનિવાર) • સાંજે ૫:૦૦ થી ૮:૦૦
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1.5 transition-transform shrink-0" />
              </div>
            </Link>

            {/* Vadaj Area Card */}
            <Link
              to="/vadaj"
              className="group block p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_16px_35px_rgba(37,99,235,0.45)] active:scale-[0.98] transition-all transform text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    🏛️
                  </span>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black leading-tight">
                      {t('૨. વાડજ (Vadaj)', '2. Vadaj')}
                    </h2>
                    <p className="text-[11px] sm:text-sm text-cyan-100 font-bold mt-0.5 sm:mt-1">
                      📅 ૦૧/૧૧/૨૦૨૬ (રવિવાર) • સાંજે ૫:૦૦ થી ૮:૦૦
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1.5 transition-transform shrink-0" />
              </div>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-purple-100 text-center text-xs text-slate-600 bg-white/40">
          <p className="font-gujarati font-extrabold text-sm sm:text-base text-slate-900">
            {t('આનંદોત્સવ ૨૦૨૬', 'Anandotsav 2026')}
          </p>
          <p className="mt-1 text-xs sm:text-sm font-extrabold text-purple-900">
            Organized By : BAPS Bal Pravrutti, Ahmedabad-15 &amp; 19
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-pink-50/50 to-blue-50/60 text-slate-900 overflow-x-hidden pb-20 sm:pb-8">
      <PublicNavbar />

      {/* Live Ground Broadcast Notice */}
      {broadcast.active && (
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white font-bold text-xs sm:text-sm py-2 px-4 shadow-md flex items-center justify-center gap-2 text-center sticky top-16 z-30 animate-fadeIn">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/25 text-white uppercase text-[10px] tracking-wider font-black">
            <Radio className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>{t('લાઈવ સૂચના', 'Live Announcement')}</span>
          </span>
          <span className="font-semibold">{broadcast.message}</span>
        </div>
      )}

      {/* Registration Closed Notice Banner */}
      {isRegistrationClosed && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm py-2 px-4 shadow-md flex items-center justify-center gap-2 text-center sticky top-16 z-30 animate-fadeIn font-gujarati border-b border-amber-300">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 uppercase text-[10px] tracking-wider font-black shadow-xs">
            ✨ <span>{t('સૂચના', 'Notice')}</span>
          </span>
          <span className="font-black text-slate-950 sm:text-sm">
            {t(
              'તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!',
              'You can register directly by coming to the venue!'
            )}
          </span>
        </div>
      )}

      {/* Hero Poster Wonderland Theme Section */}
      <section className="pt-2 sm:pt-8 pb-1 sm:pb-3 px-3 sm:px-6 max-w-5xl mx-auto text-center relative">
        
        {/* Floating Playful 3D Orbs / Star Accents */}
        <div className="absolute top-6 left-2 sm:left-12 w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-300 shadow-lg blur-[0.5px] opacity-75 animate-bounce pointer-events-none" style={{ animationDuration: '3.5s' }} />
        <div className="absolute top-12 right-2 sm:right-16 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 shadow-lg blur-[0.5px] opacity-75 animate-bounce pointer-events-none" style={{ animationDuration: '4.2s' }} />

        {/* The Grand 3D Theater / Playground Archway */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="clay-wonderland-arch max-w-3xl mx-auto p-3 sm:p-8 text-white relative shadow-2xl mb-2 sm:mb-5"
        >
          {/* Illuminated Theater Bulbs along the Arch */}
          <div className="flex items-center justify-between max-w-[200px] sm:max-w-xl mx-auto mb-1.5 sm:mb-3 px-2">
            {[...Array(7)].map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-yellow-300 bulb-glow inline-block"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>

          {/* Dedicated Center Pill Badge if single-center view */}
          {isDedicated && (
            <div className="mb-1.5 sm:mb-2.5 inline-flex items-center gap-1.5 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wide shadow-md font-gujarati animate-bounce" style={{ animationDuration: '2.5s' }}>
              <span>🏛️</span>
              <span>
                {isChandlodiyaOnly ? 'ચાંદલોડિયા સંસ્કારધામ વિશેષ' : 'વાડજ સંસ્કારધામ વિશેષ'}
              </span>
            </div>
          )}

          {/* Catchphrase */}
          <div className="font-gujarati text-lg sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] leading-tight mb-0.5 sm:mb-1.5">
            {t('બાળમિત્રો, તૈયાર છો ને?', 'Young Friends, Are You Ready?')}
          </div>

          <p className="font-gujarati text-[11px] sm:text-base font-bold text-yellow-200 drop-shadow-md mb-1.5 sm:mb-3">
            {t('તમારો મનગમતો ઉત્સવ આવી રહ્યો છે!', 'Your favorite festival is coming soon!')}
          </p>

          {/* Official 3D Anandotsav 2026 Logo */}
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="relative my-1.5 sm:my-3 flex justify-center"
          >
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-300/30 via-pink-400/30 to-cyan-300/30 rounded-full blur-2xl -z-10" />
            <img
              src="/anandotsav-logo.png"
              alt="Anandotsav 2026 Logo"
              className="w-full max-w-[200px] xs:max-w-[260px] sm:max-w-[440px] md:max-w-[520px] h-auto object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-transform duration-300"
            />
          </motion.div>

          {/* Dedicated Center Highlight Schedule Ribbon */}
          {isDedicated && (
            <div className="mt-1.5 sm:mt-3 p-2 sm:p-3 rounded-xl bg-black/35 backdrop-blur-md border border-white/30 text-[11px] sm:text-xs text-yellow-100 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 font-bold shadow-lg">
              <span className="flex items-center gap-1">
                <span>📅</span>
                <span className="font-black text-white">{isChandlodiyaOnly ? '૩૧/૧૦/૨૦૨૬ (શનિવાર)' : '૦૧/૧૧/૨૦૨૬ (રવિવાર)'}</span>
              </span>
              <span className="hidden sm:inline text-purple-300">•</span>
              <span className="flex items-center gap-1">
                <span>⏰</span>
                <span>સાંજે ૫:૦૦ થી ૮:૦૦</span>
              </span>
              <span className="hidden sm:inline text-purple-300">•</span>
              <span className="flex items-center gap-1">
                <span>📍</span>
                <span className="text-white font-extrabold">{isChandlodiyaOnly ? 'BAPS સંસ્કારધામ, ચાંદલોડિયા' : 'BAPS સંસ્કારધામ, વાડજ'}</span>
              </span>
            </div>
          )}

          {/* Bottom Invitation Callout */}
          <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-purple-400/30">
            <div className="font-gujarati text-xs sm:text-lg font-black text-white drop-shadow-md mb-1 sm:mb-1.5 flex items-center justify-center gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 fill-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{t('મિત્રોને પણ કહેજો, આવવાનું ભૂલતા નહીં!', "Tell your friends too, don't forget to come!")}</span>
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 fill-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            {/* Sub-tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs font-bold text-white shadow-inner">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>{t('BAPS શ્રી સ્વામિનારાયણ મંદિર • વાર્ષિક દિવાળી મહોત્સવ', 'BAPS Shri Swaminarayan Mandir • Annual Diwali Utsav')}</span>
            </div>
          </div>
        </motion.div>

        {/* Grand Single Registration CTA Section */}
        <div className="max-w-xl mx-auto mt-1.5 mb-1 sm:my-3 text-center px-1 font-gujarati">
          <Link
            to={registerUrl}
            className="group relative inline-flex items-center justify-center w-full max-w-lg py-3 sm:py-4 px-5 sm:px-8 rounded-xl sm:rounded-2xl text-base sm:text-2xl font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 shadow-[0_10px_22px_rgba(147,51,234,0.35)] hover:shadow-[0_16px_35px_rgba(147,51,234,0.45)] active:scale-[0.98] transition-all duration-200"
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-2xl">📝</span>
              <span>{ctaButtonLabel}</span>
              <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </Link>

          <div className="font-gujarati text-[11px] sm:text-sm font-bold text-purple-900 mt-1 sm:mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span>👦 {t('બાળ', 'Bal')}</span>
            <span className="text-purple-400">•</span>
            <span>👧 {t('બાલિકા', 'Balika')}</span>
            <span className="text-purple-400">•</span>
            <span className="text-slate-600 font-medium">{t('નિઃશુલ્ક પ્રવેશ અને ગેમ્સ કાર્ડ', 'Free Entry & Games Card')}</span>
          </div>

          {/* Direct Scroll Down Prompt Guide for Mobile Visitors */}
          <div className="mt-2 sm:mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                document.getElementById('event-details')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100/90 hover:bg-purple-200 text-purple-950 border border-purple-200 shadow-xs text-[10px] sm:text-xs font-black active:scale-95 transition-all cursor-pointer group"
            >
              <span>👇</span>
              <span>{t('ઉત્સવ વિગત, સમય અને સ્થળ નીચે જુઓ', 'View Details, Timing & Venue Below')}</span>
              <ChevronDown className="w-3 h-3 text-purple-700 animate-bounce group-hover:translate-y-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Event Details and Key Instructions in Gujarati (NO TOP MARGIN GAP) */}
      <section id="event-details" className="scroll-mt-14 sm:scroll-mt-20 pt-1 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
        <div className="clay-wonderland-card p-4 sm:p-8 text-left">
          <h2 className="font-gujarati text-lg sm:text-2xl font-black text-purple-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>
              {isDedicated
                ? (isChandlodiyaOnly ? 'ચાંદલોડિયા ઉત્સવ વિગત અને સૂચનાઓ' : 'વાડજ ઉત્સવ વિગત અને સૂચનાઓ')
                : t('ઉત્સવ માહિતી અને અગત્યની સૂચનાઓ', 'Event Information & Instructions')}
            </span>
          </h2>

          <div className={`grid grid-cols-1 ${!isDedicated ? 'md:grid-cols-2' : ''} gap-3 sm:gap-4 mb-5 pt-1`}>
            {/* Chandlodiya Schedule Card (shown if all or Chandlodiya only) */}
            {(!isDedicated || isChandlodiyaOnly) && (
              <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/80 p-5 rounded-2xl border-2 border-purple-200/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                    🏛️ ચાંદલોડિયા (Chandlodiya)
                  </span>
                  {!isDedicated && (
                    <Link
                      to="/chandlodiya"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 hover:text-purple-950 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-xs transition-colors"
                    >
                      <span>વિસ્તાર લિંક ➜</span>
                    </Link>
                  )}
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-800">
                  <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 shadow-xs flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900 block">તારીખ:</span>
                      <span className="font-black text-slate-950 text-sm sm:text-base">૩૧/૧૦/૨૦૨૬ (શનિવાર)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">સમય: </span>
                      <span className="font-bold text-purple-950">સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">સ્થળ: </span>
                      <span className="font-bold text-slate-900">BAPS સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-purple-200/60 mt-2">
                    {isChandlodiyaOnly && (
                      <Link
                        to="/register?vistar=CHANDLODIYA"
                        className="inline-flex items-center gap-1 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                      >
                        <span>📝 {t('રજીસ્ટર કરો ➜', 'Register Now ➜')}</span>
                      </Link>
                    )}
                    <a
                      href="https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 hover:text-purple-950 bg-purple-100 hover:bg-purple-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <span>📍 {t('ચાંદલોડિયા ગૂગલ મેપ', 'Chandlodiya Map')}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Vadaj Schedule Card (shown if all or Vadaj only) */}
            {(!isDedicated || isVadajOnly) && (
              <div className="bg-gradient-to-br from-blue-50/90 to-purple-50/80 p-5 rounded-2xl border-2 border-blue-200/80 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                    🏛️ વાડજ (Vadaj)
                  </span>
                  {!isDedicated && (
                    <Link
                      to="/vadaj"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-950 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs transition-colors"
                    >
                      <span>વિસ્તાર લિંક ➜</span>
                    </Link>
                  )}
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-800">
                  <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 shadow-xs flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900 block">તારીખ:</span>
                      <span className="font-black text-slate-950 text-sm sm:text-base">૦૧/૧૧/૨૦૨૬ (રવિવાર)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">સમય: </span>
                      <span className="font-bold text-blue-950">સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">સ્થળ: </span>
                      <span className="font-bold text-slate-900">BAPS સ્વામિનારાયણ સંસ્કારધામ, વાડજ</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200/60 mt-2">
                    {isVadajOnly && (
                      <Link
                        to="/register?vistar=VADAJ"
                        className="inline-flex items-center gap-1 text-xs font-black text-white bg-blue-700 hover:bg-blue-800 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                      >
                        <span>📝 {t('રજીસ્ટર કરો ➜', 'Register Now ➜')}</span>
                      </Link>
                    )}
                    <a
                      href="https://maps.app.goo.gl/7LLXNeLZWiTBakbx6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <span>📍 {t('વાડજ ગૂગલ મેપ', 'Vadaj Map')}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4-Step How to Get Games Card Visual Roadmap */}
          <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-100">
              <h3 className="font-gujarati font-black text-slate-900 text-sm sm:text-lg flex items-center gap-2">
                <span className="text-lg">🎟️</span>
                <span>{t('ગેમ્સ કાર્ડ કેવી રીતે મેળવવું?', 'How Physical Games Card Distribution Works:')}</span>
              </h3>
              <span className="text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                સરળ ૪ સ્ટેપ માર્ગદર્શન
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-purple-50/70 border border-purple-100/90 hover:bg-purple-50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                  ૧
                </span>
                <div>
                  <div className="font-gujarati font-black text-slate-900 text-xs sm:text-sm">
                    {t('ઓનલાઈન રજીસ્ટ્રેશન કરો', 'Register Online')}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-snug">
                    {t('અહીં બાળકની વિગતો ભરીને રજીસ્ટ્રેશન કન્ફર્મ કરો.', 'Fill in the form to register your child online.')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-purple-50/70 border border-purple-100/90 hover:bg-purple-50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                  ૨
                </span>
                <div>
                  <div className="font-gujarati font-black text-slate-900 text-xs sm:text-sm">
                    {t('ઉત્સવમાં મંદિર ગ્રાઉન્ડ પધારો', 'Arrive at the Venue')}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-snug">
                    {t('ઉત્સવના દિવસે મંદિર ગ્રાઉન્ડ પર પહોંચો.', 'Reach the Mandir Ground on event day.')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-purple-50/70 border border-purple-100/90 hover:bg-purple-50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                  ૩
                </span>
                <div>
                  <div className="font-gujarati font-black text-slate-900 text-xs sm:text-sm">
                    {t('કાઉન્ટર પર મોબાઈલ નંબર જણાવો', 'State Registered Mobile')}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-snug">
                    {t('એન્ટ્રી કાઉન્ટર પર બાળકનું નામ અથવા મોબાઈલ જણાવો.', 'Tell volunteer registered mobile number or name.')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                  ૪
                </span>
                <div>
                  <div className="font-gujarati font-black text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{t('ફિઝિકલ કાર્ડ મેળવો & રમત શરૂ!', 'Receive Card & Play!')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-emerald-800 font-medium mt-0.5 leading-snug">
                    {t('વોલેન્ટિયર તરત જ ફિઝિકલ કાર્ડ આપશે અને ઉત્સવ શરૂ!', 'Volunteer gives the card right away to start games!')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Register Action */}
            <div className="mt-6 pt-5 border-t border-purple-100 text-center font-gujarati space-y-4">
              <div>
                <Link
                  to={registerUrl}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 shadow-md active:scale-95 transition-all"
                >
                  <span>📝 {ctaButtonLabel} ➜</span>
                </Link>
              </div>

              {/* Detailed WhatsApp Share Card on Home when closed */}
              {isRegistrationClosed && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 shadow-sm text-left max-w-xl mx-auto">
                  <div className="font-black text-sm text-emerald-950 flex items-center gap-1.5 mb-1">
                    <span className="text-lg">📲</span>
                    <span>{t('વોટ્સએપ પર સંપૂર્ણ વિગતો સાથે શેર કરો', 'Share Full Event Details on WhatsApp')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-emerald-800 font-medium mb-3">
                    {t(
                      'તારીખ, સમય, ગૂગલ મેપ લિંક અને ઓન-ધ-સ્પોટ પ્રવેશની સંપૂર્ણ માહિતી બાળમિત્રો સાથે શેર કરો!',
                      'Share full event details with dates, venues, timings, Google Maps links, and on-spot entry instructions for children!'
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <a
                      href={closedWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="text-base">📲</span>
                      <span>{t('વોટ્સએપ પર શેર કરો (WhatsApp)', 'Share on WhatsApp')}</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyClosedMessage}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedShare ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-black">{t('કોપી થઈ ગયું! ✓', 'Copied! ✓')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-emerald-700" />
                          <span>{t('મેસેજ કોપી કરો', 'Copy Message')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-Only Sticky Floating Quick-Register Bar */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 pb-safe pointer-events-none">
        <div className="mobile-float-bar p-2 rounded-2xl flex items-center justify-between gap-2 shadow-2xl pointer-events-auto">
          <div className="pl-2">
            <div className="font-gujarati text-[11px] font-black text-purple-950 leading-tight">
              {isChandlodiyaOnly ? 'ચાંદલોડિયા આનંદોત્સવ' : isVadajOnly ? 'વાડજ આનંદોત્સવ' : t('આનંદોત્સવ ૨૦૨૬', 'Anandotsav 2026')}
            </div>
            <div className="text-[10px] text-purple-700 font-bold">
              {isChandlodiyaOnly ? '૩૧/૧૦ શનિવાર' : isVadajOnly ? '૦૧/૧૧ રવિવાર' : '👦 બાળ • 👧 બાલિકા'}
            </div>
          </div>
          <Link
            to={registerUrl}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 shadow-md active:scale-95 transition-all tap-bounce flex items-center gap-1.5 shrink-0"
          >
            <span>📝 {mobileCtaLabel}</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-purple-100 text-center text-xs text-slate-600 bg-white/40">
        <p className="font-gujarati font-extrabold text-sm sm:text-base text-slate-900">
          {t('આનંદોત્સવ ૨૦૨૬', 'Anandotsav 2026')}
        </p>
        <p className="mt-1 text-xs sm:text-sm font-extrabold text-purple-900">
          Organized By : BAPS Bal Pravrutti, Ahmedabad-15 &amp; 19
        </p>
      </footer>
    </div>
  );
};

