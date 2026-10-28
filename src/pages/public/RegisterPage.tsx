import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { createRegistration } from '@/services/registrationService';
import type { DepartmentCategory, Vistar, EventSettings } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar,
  Building2,
  Users,
  Clock,
  MapPin,
  Sparkles,
  User,
  Phone,
  X,
  Copy,
  Check,
  Home
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'eventSettings', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as EventSettings;
        setEventSettings(data);

        let closed = false;
        // Check manual toggle
        if (data.publicRegistrationEnabled === false) {
          closed = true;
        }
        // Check automatic closing date/time
        if (data.automaticClosingAt) {
          const deadline = new Date(data.automaticClosingAt).getTime();
          if (!isNaN(deadline) && Date.now() >= deadline) {
            closed = true;
          }
        }
        setIsRegistrationClosed(closed);
      }
      setSettingsLoading(false);
    });
    return () => unsub();
  }, []);

  const [copiedShare, setCopiedShare] = useState(false);

  const siteOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://anandotsav.web.app';

  const paramCategory = searchParams.get('category');
  const validParamCategory = paramCategory === 'BLK' ? 'BLK' : paramCategory === 'BAL' ? 'BAL' : null;

  const paramVistar = searchParams.get('vistar');
  const validParamVistar: Vistar | null = paramVistar === 'CHANDLODIYA' ? 'CHANDLODIYA' : paramVistar === 'VADAJ' ? 'VADAJ' : null;

  // Selected Vistar (Area) - Chandlodiya is first by default
  const [vistar, setVistar] = useState<Vistar>(validParamVistar || 'CHANDLODIYA');
  // Selected Category
  const [category, setCategory] = useState<DepartmentCategory>(validParamCategory || 'BAL');

  const detailedClosedShareMessage = validParamVistar === 'CHANDLODIYA'
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
      `🏛️ સ્થળ: ${eventSettings?.chandlodiyaVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા, અમદાવાદ'}\n\n` +
      `📍 *ગૂગલ મેપ:*\nhttps://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad\n\n` +
      `👦👧 *મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો!*\n\n` +
      `🥳 *જો જો... ચૂકી ન જતા!* 🎈\n\n` +
      `🙏 *BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૯*\n` +
      `🌐 *સંપૂર્ણ વિગતો માટે જુઓ:* ${siteOrigin}/chandlodiya`
    : validParamVistar === 'VADAJ'
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
      `🏛️ સ્થળ: ${eventSettings?.vadajVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ, અમદાવાદ'}\n\n` +
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
      `🏛️ સ્થળ: ${eventSettings?.chandlodiyaVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા, અમદાવાદ'}\n` +
      `🗺️ ગૂગલ મેપ: https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad\n\n` +
      `📍 *૨. વાડજ સંસ્કારધામ*\n` +
      `📅 તારીખ: ૦૧/૧૧/૨૦૨૬ (રવિવાર) • સમય: સાંજે ૫:૦૦ થી ૮:૦૦\n` +
      `🏛️ સ્થળ: ${eventSettings?.vadajVenue || 'BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ, અમદાવાદ'}\n` +
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

  // Sequential Flow Steps: 'VISTAR' -> 'VIBHAG' -> 'FORM' (Direct Registration in Step 3)
  const [step, setStep] = useState<'VISTAR' | 'VIBHAG' | 'FORM'>(() => {
    if (validParamCategory && validParamVistar) return 'FORM';
    if (validParamVistar) return 'VIBHAG';
    return 'VISTAR';
  });

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [otherArea, setOtherArea] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [societyName, setSocietyName] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scroll to top immediately on step change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [step]);

  // Sync vistar from query param if available
  useEffect(() => {
    if (validParamVistar) {
      setVistar(validParamVistar);
      setStep(prev => prev === 'VISTAR' ? 'VIBHAG' : prev);
    }
  }, [validParamVistar]);

  // Keep selectedArea consistent if vistar changes
  useEffect(() => {
    const validAreas = vistar === 'VADAJ' 
      ? ['Vadaj', 'Nirnayanagar', 'OTHER']
      : ['Chandlodiya', 'Ognaj', 'Tragad', 'OTHER'];
    if (selectedArea && !validAreas.includes(selectedArea)) {
      setSelectedArea('');
      setOtherArea('');
    }
  }, [vistar, selectedArea]);

  const fullName = `${firstName.trim()} ${fatherName.trim()} ${surname.trim()}`;

  // English letters validation helper
  const hasNonEnglish = (str: string) => /[^A-Za-z\s.'-]/.test(str);

  // English address validation helper (letters, numbers, spaces, common punctuation)
  const hasNonEnglishAddress = (str: string) => /[^A-Za-z0-9\s.,/#'()\-&]/.test(str);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    const englishNameRegex = /^[A-Za-z\s.'-]+$/;

    if (!firstName.trim()) {
      setErrorMessage(
        category === 'BLK'
          ? t("કૃપા કરીને બાલિકાનું નામ અંગ્રેજીમાં દાખલ કરો.", "Please enter girl's first name in English.")
          : t("કૃપા કરીને બાળકનું નામ અંગ્રેજીમાં દાખલ કરો.", "Please enter child's first name in English.")
      );
      return false;
    }
    if (!englishNameRegex.test(firstName.trim())) {
      setErrorMessage(
        category === 'BLK'
          ? t("બાલિકાનું નામ ફક્ત અંગ્રેજી અક્ષરો (A–Z) માં લખો.", "Girl's first name must only contain English letters (A–Z).")
          : t("બાળકનું નામ ફક્ત અંગ્રેજી અક્ષરો (A–Z) માં લખો.", "Child's first name must only contain English letters (A–Z).")
      );
      return false;
    }

    if (!fatherName.trim()) {
      setErrorMessage(t("કૃપા કરીને પિતાનું નામ અંગ્રેજીમાં દાખલ કરો.", "Please enter father's name in English."));
      return false;
    }
    if (!englishNameRegex.test(fatherName.trim())) {
      setErrorMessage(t("પિતાનું નામ ફક્ત અંગ્રેજી અક્ષરો (A–Z) માં લખો.", "Father's name must only contain English letters (A–Z)."));
      return false;
    }

    if (!surname.trim()) {
      setErrorMessage(t("કૃપા કરીને અટક અંગ્રેજીમાં દાખલ કરો.", "Please enter surname in English."));
      return false;
    }
    if (!englishNameRegex.test(surname.trim())) {
      setErrorMessage(t("અટક ફક્ત અંગ્રેજી અક્ષરો (A–Z) માં લખો.", "Surname must only contain English letters (A–Z)."));
      return false;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMessage(t("કૃપા કરીને ૧૦ અંકનો સાચો મોબાઈલ નંબર દાખલ કરો.", "Please enter a valid 10-digit mobile number."));
      return false;
    }

    // 1. House Number (First)
    if (!houseNumber.trim()) {
      setErrorMessage(t("કૃપા કરીને ઘર નંબર / ફ્લેટ નંબર અંગ્રેજીમાં દાખલ કરો.", "Please enter house / flat number in English."));
      return false;
    }
    if (hasNonEnglishAddress(houseNumber.trim())) {
      setErrorMessage(t("ઘર નંબર ફક્ત અંગ્રેજી (A–Z, 0-9) માં લખો.", "House number must only contain English letters and digits."));
      return false;
    }

    // 2. Society Name (First)
    if (!societyName.trim()) {
      setErrorMessage(t("કૃપા કરીને સોસાયટીનું નામ અંગ્રેજીમાં દાખલ કરો.", "Please enter society / apartment name in English."));
      return false;
    }
    if (hasNonEnglishAddress(societyName.trim())) {
      setErrorMessage(t("સોસાયટીનું નામ ફક્ત અંગ્રેજી (A–Z, 0-9) માં લખો.", "Society name must only contain English letters and digits."));
      return false;
    }

    // 3. Area / Locality (Second)
    if (!selectedArea) {
      setErrorMessage(t("કૃપા કરીને તમારો વિસ્તાર પસંદ કરો.", "Please select your area."));
      return false;
    }

    if (selectedArea === 'OTHER' && !otherArea.trim()) {
      setErrorMessage(t("કૃપા કરીને તમારા વિસ્તારનું નામ અંગ્રેજીમાં લખો.", "Please enter your area name in English."));
      return false;
    }
    if (selectedArea === 'OTHER' && hasNonEnglishAddress(otherArea.trim())) {
      setErrorMessage(t("વિસ્તારનું નામ ફક્ત અંગ્રેજી (A–Z) માં લખો.", "Area name must only contain English letters."));
      return false;
    }

    return true;
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const finalArea = selectedArea === 'OTHER' ? otherArea.trim() : selectedArea;

    try {
      const result = await createRegistration({
        category,
        vistar,
        firstName: firstName.trim(),
        fatherName: fatherName.trim(),
        surname: surname.trim(),
        mobileNumber: mobileNumber.replace(/\D/g, ''),
        source: 'ONLINE',
        houseNumber: houseNumber.trim(),
        societyName: societyName.trim(),
        area: finalArea,
      });

      const successState = {
        childName: fullName,
        category,
        vistar,
        mobileNumber: mobileNumber.replace(/\D/g, ''),
        registrationCode: result.registrationCode,
        houseNumber: houseNumber.trim(),
        societyName: societyName.trim(),
        area: finalArea,
      };

      try {
        sessionStorage.setItem('last_registered_child', JSON.stringify(successState));
        sessionStorage.setItem('last_registered_vistar', vistar);
      } catch {
        // ignore
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(`/success?vistar=${vistar}`, {
        state: successState,
      });
    } catch (err: unknown) {
      console.error('Registration submission error:', err);
      const msg = err instanceof Error ? err.message : t('રજીસ્ટ્રેશન પૂર્ણ કરવામાં તકલીફ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.', 'Unable to complete registration. Please try again.');
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 text-slate-900 pb-16">
      <PublicNavbar />

      {settingsLoading ? (
        <div className="max-w-md mx-auto px-4 pt-20 text-center font-gujarati">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">{t('માહિતી ચકાસી રહ્યા છીએ...', 'Checking registration status...')}</p>
        </div>
      ) : isRegistrationClosed ? (
        <main className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-gujarati">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="clay-wonderland-card p-5 sm:p-8 text-center relative overflow-hidden"
          >
            {/* Soft decorative background glows */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

            {/* Official Anandotsav Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/anandotsav-logo.png"
                alt="Anandotsav 2026"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>

            {/* Festive Welcoming Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 text-purple-900 text-xs sm:text-sm font-black shadow-xs mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{t('સ્થળ પર સીધો પ્રવેશ • Walk-in Entry Welcome', 'Direct Venue Entry • Walk-in Welcome')}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            {/* Warm Welcoming Headline */}
            <h1 className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug mb-2">
              {t('આનંદોત્સવ સ્થળ પર આપનું હાર્દિક સ્વાગત છે!', 'Welcome to Anandotsav 2026!')}
            </h1>

            {/* Prominent Highlighted Suchna Box (User Requested) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-lg border-2 border-amber-300 ring-2 ring-amber-300/40 my-4 text-left relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                    <span>✨ {t('અગત્યની સૂચના', 'Important Notice')}</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-950 leading-snug">
                    {t(
                      'તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!',
                      'You can register directly by coming to the venue!'
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-relaxed pt-0.5">
                    {t(
                      'કોઈપણ બાળકે ચિંતા કરવાની જરૂર નથી — ઉત્સવના દિવસે સ્થળ પર ઓન-ધ-સ્પોટ કાઉન્ટર પરથી દરેક બાળકને ફિઝિકલ પ્રવેશ કાર્ડ મળી રહેશે.',
                      'No child will miss out — physical entry cards will be issued directly at the venue counter on event day.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Interactive Feature Benefit Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 text-left">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/80 border border-amber-200 shadow-xs">
                <div className="text-xl mb-1">🎟️</div>
                <div className="font-black text-slate-900 text-xs sm:text-sm">{t('નિઃશુલ્ક પ્રવેશ કાર્ડ', 'Free Entry Card')}</div>
                <div className="text-[11px] text-slate-600 font-medium">{t('સ્થળ પર તરત મળશે', 'Instant at venue')}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/80 border border-purple-200 shadow-xs">
                <div className="text-xl mb-1">🎯</div>
                <div className="font-black text-slate-900 text-xs sm:text-sm">{t('રોમાંચક રમતો', 'Exciting Games')}</div>
                <div className="text-[11px] text-slate-600 font-medium">{t('ધમાકેદાર ગેમ્સ સ્ટોલ્સ', 'Fun games & stalls')}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-red-50/80 border border-rose-200 shadow-xs">
                <div className="text-xl mb-1">🏆</div>
                <div className="font-black text-slate-900 text-xs sm:text-sm">{t('આકર્ષક ઇનામો', 'Exciting Prizes')}</div>
                <div className="text-[11px] text-slate-600 font-medium">{t('રમતોમાં વિજેતા માટે', 'For game winners')}</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/80 border border-indigo-200 shadow-xs">
                <div className="text-xl mb-1">🎪</div>
                <div className="font-black text-slate-900 text-xs sm:text-sm">{t('ધમાકેદાર મનોરંજન', 'Fun & Celebration')}</div>
                <div className="text-[11px] text-slate-600 font-medium">{t('બાળમિત્રો સંગે ઉત્સવ', 'Festive activities')}</div>
              </div>
            </div>

            {/* How to Collect Card on Event Day (3 Clean Steps) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-purple-200/90 text-left mb-6 shadow-xs">
              <div className="font-black text-xs sm:text-sm text-purple-950 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>{t('સ્થળ પર પ્રવેશ મેળવવા માટે સરળ ૩ સ્ટેપ:', '3 Simple Steps to Collect Card at Venue:')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">૧</span>
                  <span className="font-bold leading-snug">{t('આપના વિસ્તાર મુજબ ૩૧/૧૦ અથવા ૦૧/૧૧ ના રોજ પધારો.', 'Arrive at your center on 31/10 or 01/11.')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">૨</span>
                  <span className="font-bold leading-snug">{t('કાઉન્ટર પર બાળકનું નામ અથવા મોબાઈલ નંબર જણાવો.', 'Give child name or mobile at the counter.')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">૩</span>
                  <span className="font-bold text-emerald-950 leading-snug">{t('ફિઝિકલ કાર્ડ મેળવી ઉત્સવની રમતો માણો!', 'Collect physical card and enjoy games!')}</span>
                </div>
              </div>
            </div>

            {/* Festival Centers & Timing Grid */}
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs sm:text-sm font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>{t('આનંદોત્સવ સ્થળ અને સમયની વિગત', 'Festival Venues & Timings')}</span>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {t('૨ ભવ્ય સ્થળો', '2 Centers')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Chandlodiya Center Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-700 text-white font-extrabold text-[11px] shadow-xs">
                        🏛️ {t('૧. ચાંદલોડિયા સંસ્કારધામ', '1. Chandlodiya Sanskardham')}
                      </span>
                      <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                        {t('શનિવાર', 'Saturday')}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-800">
                      <div className="font-black text-purple-950 text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{t('૩૧ ઓક્ટોબર ૨૦૨૬ • શનિવાર', '31 October 2026 • Saturday')}</span>
                      </div>
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{eventSettings?.chandlodiyaTime || t('સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી', '05:00 PM to 08:00 PM')}</span>
                      </div>
                      <div className="font-bold text-slate-700 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>{eventSettings?.chandlodiyaVenue || t('BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા, અમદાવાદ', 'BAPS Shri Swaminarayan Sanskardham, Chandlodiya, Ahmedabad')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-purple-100 flex justify-end">
                    <a
                      href="https://maps.google.com/?q=BAPS+Shri+Swaminarayan+Sanskardham+Chandlodiya+Ahmedabad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-700 hover:text-purple-950 bg-purple-100 hover:bg-purple-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <span>📍 {t('ચાંદલોડિયા ગૂગલ મેપ', 'Chandlodiya Map')}</span>
                    </a>
                  </div>
                </div>

                {/* Vadaj Center Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-700 text-white font-extrabold text-[11px] shadow-xs">
                        🏛️ {t('૨. વાડજ સંસ્કારધામ', '2. Vadaj Sanskardham')}
                      </span>
                      <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                        {t('રવિવાર', 'Sunday')}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-800">
                      <div className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{t('૦૧ નવેમ્બર ૨૦૨૬ • રવિવાર', '01 November 2026 • Sunday')}</span>
                      </div>
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{eventSettings?.vadajTime || t('સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી', '05:00 PM to 08:00 PM')}</span>
                      </div>
                      <div className="font-bold text-slate-700 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{eventSettings?.vadajVenue || t('BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ, અમદાવાદ', 'BAPS Shri Swaminarayan Sanskardham, Vadaj, Ahmedabad')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-blue-100 flex justify-end">
                    <a
                      href="https://maps.app.goo.gl/7LLXNeLZWiTBakbx6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <span>📍 {t('વાડજ ગૂગલ મેપ', 'Vadaj Map')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Share Card to invite friends with detailed message */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 shadow-sm mb-6 text-left">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-black text-sm sm:text-base text-emerald-950 flex items-center gap-1.5">
                    <span className="text-lg">📲</span>
                    <span>{t('વોટ્સએપ પર સંપૂર્ણ વિગતો સાથે શેર કરો', 'Share Full Event Details on WhatsApp')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-emerald-800 font-medium mt-0.5">
                    {t(
                      'બંને સ્થળો, તારીખ, સમય, ગૂગલ મેપ લિંક અને ઓન-ધ-સ્પોટ પ્રવેશની સંપૂર્ણ માહિતી બાળમિત્રો સાથે શેર કરો!',
                      'Share full event details with dates, venues, timings, Google Maps links, and on-spot entry instructions for children!'
                    )}
                  </div>
                </div>
              </div>

              {/* Message preview snippet */}
              <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-[11px] sm:text-xs text-slate-700 leading-relaxed font-sans mb-3 max-h-32 overflow-y-auto select-all">
                <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                  <span>📋</span>
                  <span>{t('વોટ્સએપ મેસેજ પ્રિવ્યુ:', 'WhatsApp Message Preview:')}</span>
                </div>
                <div className="whitespace-pre-line text-slate-600 font-gujarati text-[11px] sm:text-xs">
                  {detailedClosedShareMessage}
                </div>
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

            {/* Navigation Button */}
            <div>
              <Link
                to="/"
                className="w-full min-h-[48px] py-3.5 px-4 rounded-xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md active:scale-95 tap-bounce transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🏠 {t('મુખ્ય પેજ પર પાછા જાઓ', 'Back to Home Page')}</span>
              </Link>
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="max-w-md mx-auto px-4 pt-4 sm:pt-6 font-gujarati">
          
          {/* Navigation & Responsive Mobile Stepper */}
          <div className="mb-4 select-none">
            <div className="flex items-center justify-between mb-2">
              {step === 'VISTAR' ? (
                <Link
                  to={validParamVistar === 'VADAJ' ? '/vadaj' : validParamVistar === 'CHANDLODIYA' ? '/chandlodiya' : '/'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-full border border-purple-200/90 shadow-xs active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('હોમ પેજ', 'Home')}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'FORM') setStep('VIBHAG');
                    else if (step === 'VIBHAG') {
                      if (validParamVistar) {
                        navigate(validParamVistar === 'VADAJ' ? '/vadaj' : '/chandlodiya');
                      } else {
                        setStep('VISTAR');
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-full border border-purple-200/90 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>
                    {step === 'FORM' 
                      ? t('પાછા વિભાગ પર', 'Back') 
                      : validParamVistar
                        ? t('પાછા પેજ પર', 'Back to Center')
                        : t('પાછા વિસ્તાર પર', 'Back to Area')}
                  </span>
                </button>
              )}

              {/* Compact Step Counter Badge */}
              {validParamVistar ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/90 text-purple-950 text-xs font-extrabold border border-purple-200 shadow-xs">
                  <span className="font-bold text-purple-900">🏛️ {validParamVistar === 'VADAJ' ? 'વાડજ' : 'ચાંદલોડિયા'}</span>
                  <span className="text-purple-400">•</span>
                  <span>{t('પગલું', 'Step')}</span>
                  <span className="bg-purple-600 text-white px-1.5 py-0.2 rounded-full text-[11px] font-black">
                    {step === 'VIBHAG' ? '૧' : '૨'} / ૨
                  </span>
                  <span className="text-[11px] font-bold text-purple-700">
                    • {step === 'VIBHAG' ? t('વિભાગ', 'Dept') : t('વિગતો & રજીસ્ટ્રેશન', 'Details & Registration')}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/90 text-purple-950 text-xs font-extrabold border border-purple-200 shadow-xs">
                  <span>{t('પગલું', 'Step')}</span>
                  <span className="bg-purple-600 text-white px-1.5 py-0.2 rounded-full text-[11px] font-black">
                    {step === 'VISTAR' ? '૧' : step === 'VIBHAG' ? '૨' : '૩'} / ૩
                  </span>
                  <span className="text-[11px] font-bold text-purple-700">
                    • {step === 'VISTAR' ? t('વિસ્તાર', 'Area') : step === 'VIBHAG' ? t('વિભાગ', 'Dept') : t('વિગતો & રજીસ્ટ્રેશન', 'Details & Registration')}
                  </span>
                </div>
              )}
            </div>

            {/* Animated Progress Bar */}
            {validParamVistar ? (
              <div className="grid grid-cols-2 gap-1.5 h-1.5 rounded-full bg-slate-200/80 p-0.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${
                  step === 'VIBHAG' || step === 'FORM' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-transparent'
                }`} />
                <div className={`h-full rounded-full transition-all duration-300 ${
                  step === 'FORM' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-transparent'
                }`} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 h-1.5 rounded-full bg-slate-200/80 p-0.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${
                  step === 'VISTAR' || step === 'VIBHAG' || step === 'FORM' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-transparent'
                }`} />
                <div className={`h-full rounded-full transition-all duration-300 ${
                  step === 'VIBHAG' || step === 'FORM' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-transparent'
                }`} />
                <div className={`h-full rounded-full transition-all duration-300 ${
                  step === 'FORM' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-transparent'
                }`} />
              </div>
            )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 shadow-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'VISTAR' ? (
            /* ========================================================
               SCREEN 1: FIRST ASK FOR VISTAR (AREA)
               ======================================================== */
            <motion.div
              key="vistar-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 text-left"
            >
              <div className="text-center mb-5">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t('પગલું ૧/૩ : વિસ્તાર પસંદગી', 'Step 1/3: Select Area')}</span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  {t('૧. તમારો વિસ્તાર પસંદ કરો', '1. Select Your Area')}
                </h1>
                <p className="text-xs text-slate-500">
                  {t('તમારા વિસ્તાર મુજબનો આનંદોત્સવ પસંદ કરો', 'Choose festival program according to your area')}
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Chandlodiya Card (FIRST) */}
                <button
                  type="button"
                  onClick={() => {
                    setVistar('CHANDLODIYA');
                    setStep('VIBHAG');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full p-4 sm:p-5 rounded-2xl border-2 border-purple-300 hover:border-purple-600 hover:bg-purple-50/40 bg-white transition-all text-left shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="mb-2">
                    <span className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                      <span className="text-2xl">🏛️</span>
                      <span>{t('ચાંદલોડિયા (Chandlodiya)', 'Chandlodiya Area')}</span>
                    </span>
                  </div>

                  {/* PROMINENT HIGHLIGHTED DATE & TIME BANNER */}
                  <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-purple-500/15 border-2 border-amber-400/90 shadow-xs flex items-center gap-3">
                    {/* Visual Mini Calendar Block */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-pink-600 via-rose-600 to-purple-700 text-white rounded-xl px-2.5 py-1.5 min-w-[58px] shadow-sm text-center shrink-0">
                      <span className="text-[10px] font-black tracking-widest text-pink-200 uppercase">OCT</span>
                      <span className="text-2xl font-black leading-none drop-shadow-sm">31</span>
                      <span className="text-[9px] font-extrabold text-amber-200 mt-0.5">શનિવાર</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-pink-800 tracking-wide bg-pink-100/90 px-2 py-0.5 rounded-md mb-0.5 border border-pink-200/60">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{t('ઉત્સવ તારીખ & સમય', 'Festival Date & Time')}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-950 leading-tight">
                        {t('૩૧ ઓક્ટોબર ૨૦૨૬ (શનિવાર)', '31 October 2026 (Saturday)')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 mt-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{t('સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી', '5:00 PM to 8:00 PM')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 pl-1 flex items-start gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{t('BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા', 'BAPS Shri Swaminarayan Sanskardham, Chandlodiya')}</span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-900">
                    <span>{t('ચાંદલોડિયા પસંદ કરો', 'Select Chandlodiya')}</span>
                    <span className="group-hover:translate-x-1 transition-transform">આગળ વધો ➜</span>
                  </div>
                </button>

                {/* 2. Vadaj Card (SECOND) */}
                <button
                  type="button"
                  onClick={() => {
                    setVistar('VADAJ');
                    setStep('VIBHAG');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-purple-600 hover:bg-purple-50/40 bg-white transition-all text-left shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="mb-2">
                    <span className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                      <span className="text-2xl">🏛️</span>
                      <span>{t('વાડજ (Vadaj)', 'Vadaj Area')}</span>
                    </span>
                  </div>

                  {/* PROMINENT HIGHLIGHTED DATE & TIME BANNER */}
                  <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-indigo-500/15 border-2 border-amber-400/90 shadow-xs flex items-center gap-3">
                    {/* Visual Mini Calendar Block */}
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 text-white rounded-xl px-2.5 py-1.5 min-w-[58px] shadow-sm text-center shrink-0">
                      <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">NOV</span>
                      <span className="text-2xl font-black leading-none drop-shadow-sm">01</span>
                      <span className="text-[9px] font-extrabold text-amber-200 mt-0.5">રવિવાર</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-blue-800 tracking-wide bg-blue-100/90 px-2 py-0.5 rounded-md mb-0.5 border border-blue-200/60">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{t('ઉત્સવ તારીખ & સમય', 'Festival Date & Time')}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-950 leading-tight">
                        {t('૧ નવેમ્બર ૨૦૨૬ (રવિવાર)', '01 November 2026 (Sunday)')}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 mt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{t('સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી', '5:00 PM to 8:00 PM')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 pl-1 flex items-start gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{t('BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ', 'BAPS Shri Swaminarayan Sanskardham, Vadaj')}</span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-900">
                    <span>{t('વાડજ પસંદ કરો', 'Select Vadaj')}</span>
                    <span className="group-hover:translate-x-1 transition-transform">આગળ વધો ➜</span>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : step === 'VIBHAG' ? (
            /* ========================================================
               SCREEN 2: THEN NEXT SCREEN AND ASK FOR VIBHAG (CATEGORY)
               ======================================================== */
            <motion.div
              key="vibhag-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 text-left"
            >
              {/* Selected Vistar Context Banner with Highlighted Date */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50/40 to-purple-50 border border-purple-200/80 mb-5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="text-xs font-black text-purple-950">
                      {vistar === 'CHANDLODIYA' ? t('ચાંદલોડિયા સંસ્કારધામ', 'Chandlodiya Sanskardham') : t('વાડજ સંસ્કારધામ', 'Vadaj Sanskardham')}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-black text-[11px] shadow-xs">
                      <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{vistar === 'CHANDLODIYA' ? '૩૧/૧૦/૨૦૨૬ (શનિવાર) • ૫:૦૦ થી ૮:૦૦' : '૦૧/૧૧/૨૦૨૬ (રવિવાર) • ૫:૦૦ થી ૮:૦૦'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-5">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    {validParamVistar 
                      ? t('પગલું ૧/૨ : વિભાગ પસંદગી', 'Step 1/2: Select Department') 
                      : t('પગલું ૨/૩ : વિભાગ પસંદગી', 'Step 2/3: Select Department')
                    }
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  {validParamVistar 
                    ? t('૧. વિભાગ પસંદ કરો', '1. Select Department') 
                    : t('૨. વિભાગ પસંદ કરો', '2. Select Department')
                  }
                </h1>
                <p className="text-xs text-slate-500">
                  {t('બાળક મુજબ વિભાગ પસંદ કરો', 'Choose department according to child')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Bal Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCategory('BAL');
                    setStep('FORM');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/60 to-white hover:border-blue-500 hover:shadow-md active:scale-[0.98] transition-all flex flex-col items-center text-center cursor-pointer group"
                >
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">👦</span>
                  <span className="text-base font-bold text-blue-900">{t('બાળ વિભાગ', 'Bal Vibhag')}</span>
                  <span className="text-xs text-blue-600 font-medium mt-0.5">{t('છોકરાઓ (Boys)', 'Boys')}</span>
                  <span className="mt-3 text-[11px] font-bold text-white bg-blue-600 group-hover:bg-blue-700 px-3.5 py-1 rounded-full shadow-xs">
                    {t('વિગતો ભરો ➜', 'Fill Details ➜')}
                  </span>
                </button>

                {/* Balika Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCategory('BLK');
                    setStep('FORM');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-5 rounded-2xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/60 to-white hover:border-rose-500 hover:shadow-md active:scale-[0.98] transition-all flex flex-col items-center text-center cursor-pointer group"
                >
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">👧</span>
                  <span className="text-base font-bold text-rose-900">{t('બાલિકા વિભાગ', 'Balika Vibhag')}</span>
                  <span className="text-xs text-rose-600 font-medium mt-0.5">{t('છોકરીઓ (Girls)', 'Girls')}</span>
                  <span className="mt-3 text-[11px] font-bold text-white bg-rose-600 group-hover:bg-rose-700 px-3.5 py-1 rounded-full shadow-xs">
                    {t('વિગતો ભરો ➜', 'Fill Details ➜')}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ========================================================
               SCREEN 3: CLEAN REGISTRATION FORM (DIRECT SUBMIT)
               ======================================================== */
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 text-left"
            >
              {/* Header with Area and Dept indicator */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{category === 'BAL' ? '👦' : '👧'}</span>
                  <div>
                    <h1 className="text-base font-bold text-slate-900 leading-tight">
                      {vistar === 'CHANDLODIYA' ? 'ચાંદલોડિયા' : 'વાડજ'} • {category === 'BAL' ? 'બાળ વિભાગ' : 'બાલિકા વિભાગ'}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-black text-[11px] shadow-xs">
                        <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{vistar === 'CHANDLODIYA' ? '૩૧/૧૦/૨૦૨૬ (શનિવાર)' : '૦૧/૧૧/૨૦૨૬ (રવિવાર)'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        • અંગ્રેજી (A–Z) માં લખવું
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('VIBHAG')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {t('વિભાગ બદલો', 'Change')}
                </button>
              </div>

              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                
                {/* Child First Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="firstName" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        {category === 'BLK' 
                          ? t("બાલિકાનું નામ (First Name)", "Girl's First Name")
                          : t("બાળકનું નામ (First Name)", "Child's First Name")}
                      </span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z Only</span>
                  </div>
                  <div className="relative">
                    <input
                      id="firstName"
                      type="text"
                      required
                      lang="en"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      spellCheck={false}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={category === 'BLK' ? "e.g. Aanya" : "e.g. Aarav"}
                      className={`w-full pl-3.5 pr-16 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                        hasNonEnglish(firstName) 
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' 
                          : firstName.trim() 
                          ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20' 
                          : 'border-slate-300 focus:border-purple-500'
                      }`}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {firstName && (
                        <button
                          type="button"
                          onClick={() => setFirstName('')}
                          className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Clear first name"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {hasNonEnglish(firstName) ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : firstName.trim() ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>
                  {hasNonEnglish(firstName) && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો (A–Z) વાપરો.', 'English letters (A–Z) only.')}</span>
                    </p>
                  )}
                </div>

                {/* Father's Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="fatherName" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t("પિતાનું નામ (Father's Name)", "Father's Name")}</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z Only</span>
                  </div>
                  <div className="relative">
                    <input
                      id="fatherName"
                      type="text"
                      required
                      lang="en"
                      autoCapitalize="words"
                      autoComplete="additional-name"
                      spellCheck={false}
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="e.g. Rajeshbhai"
                      className={`w-full pl-3.5 pr-16 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                        hasNonEnglish(fatherName) 
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' 
                          : fatherName.trim() 
                          ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20' 
                          : 'border-slate-300 focus:border-purple-500'
                      }`}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {fatherName && (
                        <button
                          type="button"
                          onClick={() => setFatherName('')}
                          className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Clear father name"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {hasNonEnglish(fatherName) ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : fatherName.trim() ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>
                  {hasNonEnglish(fatherName) && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો (A–Z) વાપરો.', 'English letters (A–Z) only.')}</span>
                    </p>
                  )}
                </div>

                {/* Surname */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="surname" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('અટક (Surname)', 'Surname')}</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z Only</span>
                  </div>
                  <div className="relative">
                    <input
                      id="surname"
                      type="text"
                      required
                      lang="en"
                      autoCapitalize="words"
                      autoComplete="family-name"
                      spellCheck={false}
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Patel"
                      className={`w-full pl-3.5 pr-16 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                        hasNonEnglish(surname) 
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' 
                          : surname.trim() 
                          ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20' 
                          : 'border-slate-300 focus:border-purple-500'
                      }`}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {surname && (
                        <button
                          type="button"
                          onClick={() => setSurname('')}
                          className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Clear surname"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {hasNonEnglish(surname) ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : surname.trim() ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>
                  {hasNonEnglish(surname) && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો (A–Z) વાપરો.', 'English letters (A–Z) only.')}</span>
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="mobileNumber" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('મોબાઈલ નંબર', 'Mobile Number')}</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                      {mobileNumber.length}/10 {t('અંક', 'digits')}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-3 flex items-center gap-1 text-slate-600 pointer-events-none select-none text-sm font-black border-r border-slate-300 pr-2">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      id="mobileNumber"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className={`w-full pl-20 pr-16 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-black text-slate-900 tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                        mobileNumber.length === 10 
                          ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20' 
                          : 'border-slate-300 focus:border-purple-500'
                      }`}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {mobileNumber && (
                        <button
                          type="button"
                          onClick={() => setMobileNumber('')}
                          className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Clear mobile number"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {mobileNumber.length === 10 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. House Number and Society Name Grid (FIRST) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* House / Flat Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="houseNumber" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-purple-600" />
                        <span>{t('ઘર નંબર / ફ્લેટ નંબર', 'House / Flat No.')}</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z, 0–9 Only</span>
                    </div>
                    <div className="relative">
                      <input
                        id="houseNumber"
                        type="text"
                        required
                        lang="en"
                        spellCheck={false}
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="e.g. A-102 or Flat 45"
                        className={`w-full pl-3.5 pr-10 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                          hasNonEnglishAddress(houseNumber)
                            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                            : houseNumber.trim()
                            ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                            : 'border-slate-300 focus:border-purple-500'
                        }`}
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        {hasNonEnglishAddress(houseNumber) ? (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        ) : houseNumber.trim() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {hasNonEnglishAddress(houseNumber) && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો અને અંકો (English Only) વાપરો.', 'English letters and digits only.')}</span>
                      </p>
                    )}
                  </div>

                  {/* Society / Apartment Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="societyName" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{t('સોસાયટી / એપાર્ટમેન્ટનું નામ', 'Society / Apartment Name')}</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z, 0–9 Only</span>
                    </div>
                    <div className="relative">
                      <input
                        id="societyName"
                        type="text"
                        required
                        lang="en"
                        spellCheck={false}
                        value={societyName}
                        onChange={(e) => setSocietyName(e.target.value)}
                        placeholder="e.g. Shantiniketan Society"
                        className={`w-full pl-3.5 pr-10 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border bg-slate-50/60 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                          hasNonEnglishAddress(societyName)
                            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                            : societyName.trim()
                            ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                            : 'border-slate-300 focus:border-purple-500'
                        }`}
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        {hasNonEnglishAddress(societyName) ? (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        ) : societyName.trim() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </div>
                    {hasNonEnglishAddress(societyName) && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો અને અંકો (English Only) વાપરો.', 'English letters and digits only.')}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Vistar / Locality Selection (SECOND) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('તમારો વિસ્તાર (Select Your Area)', 'Select Your Area')}</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                      {vistar === 'CHANDLODIYA' ? t('ચાંદલોડિયા કેન્દ્ર', 'Chandlodiya Center') : t('વાડજ કેન્દ્ર', 'Vadaj Center')}
                    </span>
                  </div>

                  <div className={`grid gap-2 ${vistar === 'CHANDLODIYA' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                    {(vistar === 'CHANDLODIYA' ? [
                      { id: 'Chandlodiya', labelGuj: 'ચાંદલોડિયા', labelEn: 'Chandlodiya' },
                      { id: 'Ognaj', labelGuj: 'ઓગણજ', labelEn: 'Ognaj' },
                      { id: 'Tragad', labelGuj: 'ત્રાગડ', labelEn: 'Tragad' },
                      { id: 'OTHER', labelGuj: 'અન્ય', labelEn: 'Other' },
                    ] : [
                      { id: 'Vadaj', labelGuj: 'વાડજ', labelEn: 'Vadaj' },
                      { id: 'Nirnayanagar', labelGuj: 'નિર્ણયનગર', labelEn: 'Nirnayanagar' },
                      { id: 'OTHER', labelGuj: 'અન્ય', labelEn: 'Other' },
                    ]).map((item) => {
                      const isSelected = selectedArea === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedArea(item.id)}
                          className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[52px] tap-bounce ${
                            isSelected
                              ? category === 'BAL'
                                ? 'border-blue-600 bg-blue-50/90 text-blue-950 font-black shadow-xs ring-2 ring-blue-500/20'
                                : 'border-rose-600 bg-rose-50/90 text-rose-950 font-black shadow-xs ring-2 ring-rose-500/20'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700 hover:border-slate-300 font-bold'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-black leading-tight flex items-center gap-1">
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600 shrink-0" />}
                            <span>{item.labelGuj}</span>
                          </span>
                          <span className="text-[10px] opacity-75 font-semibold mt-0.5">
                            {item.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* When OTHER is chosen, show text input to type area in English */}
                  {selectedArea === 'OTHER' && (
                    <div className="mt-2.5 pt-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="otherArea" className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          <span>{t('તમારો વિસ્તાર અંગ્રેજીમાં લખો (Write Area in English)', 'Write Area in English')}</span>
                          <span className="text-rose-500 font-black">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A–Z Only</span>
                      </div>
                      <div className="relative">
                        <input
                          id="otherArea"
                          type="text"
                          required
                          lang="en"
                          spellCheck={false}
                          value={otherArea}
                          onChange={(e) => setOtherArea(e.target.value)}
                          placeholder="e.g. Gota, Science City, Ranip, Ghatlodiya..."
                          className={`w-full pl-3.5 pr-10 py-3 text-base sm:text-sm min-h-[48px] rounded-xl border-2 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner ${
                            hasNonEnglishAddress(otherArea)
                              ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                              : otherArea.trim()
                              ? 'border-emerald-500 focus:border-emerald-600'
                              : 'border-purple-300 focus:border-purple-600'
                          }`}
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1.5">
                          {hasNonEnglishAddress(otherArea) ? (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          ) : otherArea.trim() ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : null}
                        </div>
                      </div>
                      {hasNonEnglishAddress(otherArea) && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <span>⚠️ {t('ફક્ત અંગ્રેજી અક્ષરો (English Only) વાપરો.', 'English letters only.')}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                {/* Direct Registration Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full min-h-[48px] py-3.5 sm:py-3 px-5 rounded-xl text-base font-black text-white shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 tap-bounce ${
                      category === 'BAL'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/25'
                    } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('રજીસ્ટર થઈ રહ્યું છે...', 'Registering...')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          {category === 'BLK'
                            ? t('બાલિકાનું રજીસ્ટ્રેશન કરો ➜', 'Register Girl ➜')
                            : t('બાળકનું રજીસ્ટ્રેશન કરો ➜', 'Register Child ➜')}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 font-semibold text-center mt-2.5">
                    {category === 'BLK'
                      ? t('ℹ️ સબમિટ કર્યા પછી બાલિકાની વિગતો બદલી શકાશે નહીં.', 'ℹ️ Details cannot be changed after submission.')
                      : t('ℹ️ સબમિટ કર્યા પછી બાળકની વિગતો બદલી શકાશે નહીં.', 'ℹ️ Details cannot be changed after submission.')}
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

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
