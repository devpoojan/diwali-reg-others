import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import confetti from 'canvas-confetti';
import { CheckCircle2, UserPlus, Home, Heart, Star, Share2, Copy, Check, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import { getVistarFromRegistrationCode } from '@/services/registrationService';
import type { Vistar, DepartmentCategory } from '@/types';

interface SuccessLocationState {
  childName?: string;
  category?: DepartmentCategory;
  vistar?: Vistar;
  mobileNumber?: string;
  registrationCode?: string;
  houseNumber?: string;
  societyName?: string;
  area?: string;
}

export const SuccessPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navState = (location.state as SuccessLocationState) || {};

  // Fallback to cached state in sessionStorage in case user refreshes or reloads page
  const [pageState] = useState<SuccessLocationState>(() => {
    if (navState.registrationCode || navState.childName) {
      return navState;
    }
    try {
      const saved = sessionStorage.getItem('last_registered_child');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return navState;
  });

  const queryVistar = searchParams.get('vistar');
  
  // Reliably resolve vistar: query param > state > registration code prefix (C- -> Chandlodiya, V- -> Vadaj)
  const resolvedVistar: Vistar = (
    (queryVistar === 'CHANDLODIYA' || queryVistar === 'VADAJ')
      ? queryVistar
      : pageState.vistar || getVistarFromRegistrationCode(pageState.registrationCode)
  );

  const { childName, category, registrationCode, houseNumber, societyName, area } = pageState;
  const vistar = resolvedVistar;
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const isVadaj = vistar === 'VADAJ';
  const eventDateText = isVadaj ? '૦૧/૧૧/૨૦૨૬ (રવિવાર)' : '૩૧/૧૦/૨૦૨૬ (શનિવાર)';
  const venueText = isVadaj ? 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ' : 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા';
  const vistarLabel = isVadaj ? 'વાડજ (Vadaj)' : 'ચાંદલોડિયા (Chandlodiya)';
  const centerTitle = isVadaj ? 'વાડજ' : 'ચાંદલોડિયા';
  const organizerText = isVadaj ? 'BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૫' : 'BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૯';
  const mapUrl = isVadaj 
    ? 'https://maps.app.goo.gl/7LLXNeLZWiTBakbx6' 
    : 'https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad';

  const centerPath = isVadaj ? '/vadaj' : '/chandlodiya';
  const currentLink = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}${centerPath}`
    : `https://anandotsav.web.app${centerPath}`;

  const shareMessage =
    `🌸 *જય સ્વામિનારાયણ!* 🌸\n\n` +
    `🎉 *BAPS આનંદોત્સવ ૨૦૨૬ — ${centerTitle}* 🎉\n` +
    `🎈 *બાળ-બાલિકાઓ માટે આનંદનો ભવ્ય ઉત્સવ!* 🎈\n\n` +
    `💁🏻‍♂️ *આનંદોત્સવમાં માણવા મળશે...*\n\n` +
    `🎯🎳 મજેદાર ગેમ્સ\n` +
    `🎢🎠 આનંદદાયક રાઇડ્સ\n` +
    `🍬🍫 સ્વાદિષ્ટ પ્રસાદ\n` +
    `🎁🎉 જોરદાર ઇનામો\n\n` +
    `💥 *આ સમગ્ર આનંદોત્સવ સંપૂર્ણ નિઃશુલ્ક છે!* 💥\n\n` +
    `📅 *તારીખ:* ${eventDateText}\n` +
    `⏰ *સમય:* સાંજે ૫:૦૦ થી ૮:૦૦\n` +
    `🏛️ *સ્થળ:* ${venueText}\n\n` +
    `📍 *ગૂગલ મેપ:*\n${mapUrl}\n\n` +
    `📝 *આજે જ નિઃશુલ્ક રજિસ્ટ્રેશન કરાવો!*\n` +
    `🔗 ${currentLink}\n\n` +
    `👦👧 *મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો!*\n\n` +
    `🥳 *જો જો... ચૂકી ન જતા!* 🎈\n\n` +
    `🙏 *${organizerText}*`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  const handleCopyShareMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyId = () => {
    if (!registrationCode) return;
    navigator.clipboard.writeText(registrationCode);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2500);
  };

  useEffect(() => {
    // Scroll window immediately to top when success screen opens
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Festive celebration on successful registration
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: category === 'BAL' ? ['#2563EB', '#60A5FA', '#F59E0B', '#8B5CF6'] : ['#E11D48', '#FB7185', '#F59E0B', '#8B5CF6'],
      });
    } catch {
      // Confetti fallback
    }
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-pink-50/50 to-blue-50/60 text-slate-900 pb-16">
      <PublicNavbar />

      <main className="max-w-xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8">
        <div className="clay-wonderland-card p-4 sm:p-10 text-center relative overflow-hidden">

          {/* Official Anandotsav Logo */}
          <div className="flex justify-center mb-3 sm:mb-5">
            <img
              src="/anandotsav-logo.png"
              alt="Anandotsav 2026 Logo"
              className="h-14 sm:h-20 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform"
            />
          </div>

          {/* Animated Success Badge */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h1 className="font-gujarati text-xl sm:text-3xl font-black text-slate-900 mb-1">
            {t('અભિનંદન! રજીસ્ટ્રેશન સફળતાપૂર્વક થઈ ગયું છે!', 'Registration Successful!')}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 my-2.5 sm:my-3">
            {childName && (
              <span className="px-3.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs sm:text-sm font-black border border-purple-200 shadow-sm">
                {childName}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-purple-900 text-white text-xs font-bold shadow-sm">
              🏛️ {vistarLabel}
            </span>
            {category && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase text-white ${category === 'BAL' ? 'bg-blue-600' : 'bg-rose-600'
                }`}>
                {category === 'BAL' ? t('👦 બાળ', 'BAL') : t('👧 બાલિકા', 'BLK')}
              </span>
            )}
            {(area || societyName || houseNumber) && (
              <span className="w-full text-center flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-purple-50/80 px-3 py-1 rounded-xl border border-purple-200/70 mt-1">
                <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{[houseNumber, societyName, area].filter(Boolean).join(', ')}</span>
              </span>
            )}
          </div>

          {/* Balak Registration ID Card (Prominently shown as requested) */}
          {registrationCode && (
            <div className="my-3.5 sm:my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400 shadow-md text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800 mb-1.5 font-gujarati">
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>{t('તમારું રજીસ્ટ્રેશન આઈડી (Registration ID)', 'Your Child Registration ID')}</span>
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>

              {/* Huge, bold, beautiful Registration Code Display */}
              <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-5 py-2.5 rounded-2xl bg-white border-2 border-amber-300 shadow-inner my-2">
                <span className="font-mono text-2xl sm:text-4xl font-black text-amber-950 tracking-wider">
                  {registrationCode}
                </span>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title={t('આઈડી કોપી કરો', 'Copy ID')}
                >
                  {idCopied ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>

              {idCopied && (
                <div className="text-[11px] font-black text-emerald-700 animate-in fade-in">
                  ✓ {t('આઈડી કોપી થઈ ગયું!', 'ID copied to clipboard!')}
                </div>
              )}

              <p className="text-xs text-amber-900 font-bold mt-2 font-gujarati leading-relaxed">
                {t(
                  '📸 કૃપા કરીને આ આઈડી યાદ રાખો અથવા સ્ક્રીનશોટ પાડી લો. ઉત્સવના કાઉન્ટર પર આ આઈડી અથવા મોબાઈલ નંબર જણાવવાથી તરત કાર્ડ મળશે!',
                  '📸 Please remember this ID or take a screenshot. Present this ID or mobile number at the event counter to get your games card!'
                )}
              </p>
            </div>
          )}

          {/* WhatsApp Share to Friends (Placed Prominently at Top as requested) */}
          <div className="my-3.5 sm:my-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 shadow-sm text-center">
            <div className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5 font-gujarati">
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('મિત્રોને પણ સાથે લઈ આવો!', 'Invite Friends!')}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[48px] py-3.5 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-700 shadow-md active:scale-95 tap-bounce transition-all flex items-center justify-center gap-2 font-gujarati cursor-pointer"
              >
                <span className="text-lg">📲</span>
                <span>{t('વોટ્સએપ પર મિત્રો સાથે શેર કરો', 'Share on WhatsApp')}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyShareMessage}
                className="min-h-[48px] py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm active:scale-95 tap-bounce transition-all flex items-center justify-center gap-1.5 font-gujarati cursor-pointer"
                title="Copy share message text"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-black">{t('કોપી થયું!', 'Copied!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>{t('મેસેજ કોપી કરો', 'Copy Message')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Venue & Event Schedule Notice */}
          <div className="bg-purple-50/80 rounded-2xl border border-purple-200/90 p-4 my-4 text-left">
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📍 {t('તમારા ઉત્સવની તારીખ અને સ્થળ:', 'Your Event Schedule & Venue:')}</span>
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-900">📅 {t('તારીખ:', 'Date:')}</span>
                <span className="font-black text-slate-900">{eventDateText}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-900">⏰ {t('સમય:', 'Time:')}</span>
                <span className="font-bold text-slate-950">{t('સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી', '05:00 PM to 08:00 PM')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-900">🏛️ {t('સ્થળ:', 'Venue:')}</span>
                <span className="font-bold text-slate-900">{venueText}</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex justify-end">
              <a
                href={isVadaj ? 'https://maps.app.goo.gl/7LLXNeLZWiTBakbx6' : 'https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 hover:text-purple-950 bg-white px-2.5 py-1 rounded-lg border border-purple-200/80 shadow-xs transition-colors"
              >
                <span>📍 {t('ગૂગલ મેપ પર જુઓ', 'Open in Google Maps')}</span>
              </a>
            </div>
          </div>

          {/* Official PRD Card Pickup Copy in Gujarati */}
          <div className="my-4 sm:my-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50/90 border border-amber-200/90 text-left shadow-sm">
            <div className="font-gujarati text-xs sm:text-base font-black text-amber-950 mb-2 flex items-center gap-2">
              <span className="text-base sm:text-lg">🎟️</span>
              <span>{t('ગેમ્સ કાર્ડ મેળવવા માટે સરળ માર્ગદર્શન:', 'How to collect physical games card:')}</span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
              <div className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">૧</span>
                <span>{t(`ઉત્સવના દિવસે (${eventDateText}) ${venueText} ખાતે પધારો.`, `Arrive on event day at ${venueText}.`)}</span>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">૨</span>
                <span>
                  {registrationCode
                    ? t(`એન્ટ્રી કાઉન્ટર પર વોલેન્ટિયરને તમારું આઈડી (${registrationCode}) અથવા નામ જણાવો.`, `State your ID (${registrationCode}) or mobile number at the entry counter.`)
                    : (category === 'BLK'
                        ? t('એન્ટ્રી કાઉન્ટર પર વોલેન્ટિયરને તમારો મોબાઈલ નંબર અથવા બાલિકાનું નામ જણાવો.', "State your mobile number or girl's name at the entry counter.")
                        : t('એન્ટ્રી કાઉન્ટર પર વોલેન્ટિયરને તમારો મોબાઈલ નંબર અથવા બાળકનું નામ જણાવો.', 'State your mobile number or child name at the entry counter.')
                      )
                  }
                </span>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">૩</span>
                <span className="text-emerald-950 font-bold">{t('વોલેન્ટિયર તરત જ ફિઝિકલ કાર્ડ આપશે અને ઉત્સવની રમતો શરૂ!', 'Collect your physical card immediately and start the games!')}</span>
              </div>
            </div>
          </div>

          {/* Poster Slogan Reminder */}
          <div className="font-gujarati text-sm sm:text-base font-black text-purple-900 mb-4 sm:mb-6 flex items-center justify-center gap-1.5 sm:gap-2">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
            <span>{t('મિત્રોને પણ કહેજો, આવવાનું ભૂલતા નહીં!', "Tell your friends too, don't forget to come!")}</span>
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-6 sm:mb-8 flex items-center justify-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>
              {category === 'BLK'
                ? t('અમે આપનું અને આપની બાલિકાનું ઉત્સવમાં હાર્દિક સ્વાગત કરીએ છીએ!', 'We look forward to welcoming you to the celebrations!')
                : t('અમે આપનું અને આપના બાળકનું ઉત્સવમાં હાર્દિક સ્વાગત કરીએ છીએ!', 'We look forward to welcoming you to the celebrations!')
              }
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <Link
              to={vistar ? `/register?vistar=${vistar}` : '/register'}
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="flex-1 min-h-[46px] py-3.5 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md active:scale-95 tap-bounce transition-all flex items-center justify-center gap-2 font-gujarati"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {category === 'BLK'
                  ? t('બીજી બાલિકાનું રજીસ્ટ્રેશન કરો', 'Register Another Girl')
                  : t('બીજા બાળકનું રજીસ્ટ્રેશન કરો', 'Register Another Child')
                }
              </span>
            </Link>

            <Link
              to="/"
              className="min-h-[46px] py-3.5 px-6 rounded-xl text-sm font-black text-slate-700 bg-white hover:bg-slate-100 active:scale-95 tap-bounce border border-slate-300 transition-colors flex items-center justify-center gap-1.5 font-gujarati"
            >
              <Home className="w-4 h-4" />
              <span>{t('હોમ પેજ પર જાઓ', 'Home')}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-purple-100 text-center text-xs text-slate-600 bg-white/40 mt-8">
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
