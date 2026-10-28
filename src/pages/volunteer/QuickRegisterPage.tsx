import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { StaffNavbar } from '@/components/staff/StaffNavbar';
import { useAuth } from '@/context/AuthContext';
import { createRegistration, issueCard } from '@/services/registrationService';
import type { DepartmentCategory, Registration, Vistar, EventSettings } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Users, Minus, Plus } from 'lucide-react';

export const QuickRegisterPage: React.FC = () => {
  const { categoryAccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [onSpotEnabled, setOnSpotEnabled] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'eventSettings', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as EventSettings;
        if (typeof data.onSpotRegistrationEnabled === 'boolean') {
          setOnSpotEnabled(data.onSpotRegistrationEnabled);
        }
      }
    });
    return () => unsub();
  }, []);

  // Enforce department access strictly
  const lockedCategory: DepartmentCategory | null = 
    categoryAccess === 'BAL_ONLY' ? 'BAL' :
    categoryAccess === 'BLK_ONLY' ? 'BLK' :
    null;

  const urlCategory = searchParams.get('category');
  const validUrlCategory = urlCategory === 'BLK' ? 'BLK' : urlCategory === 'BAL' ? 'BAL' : null;
  const initialCategory: DepartmentCategory = lockedCategory || validUrlCategory || 'BAL';
  const [category, setCategory] = useState<DepartmentCategory>(initialCategory);

  const urlVistar = searchParams.get('vistar');
  const validUrlVistar: Vistar | null = urlVistar === 'CHANDLODIYA' ? 'CHANDLODIYA' : urlVistar === 'VADAJ' ? 'VADAJ' : null;
  const [vistar, setVistar] = useState<Vistar>(() => {
    if (validUrlVistar) return validUrlVistar;
    try {
      const saved = sessionStorage.getItem('volunteer_active_vistar');
      if (saved === 'CHANDLODIYA' || saved === 'VADAJ') return saved;
    } catch {}
    return 'CHANDLODIYA';
  });

  const urlSearch = searchParams.get('search') || '';
  const isSearchDigits = /^\d+$/.test(urlSearch);

  // All fields are optional
  const [firstName, setFirstName] = useState(isSearchDigits ? '' : urlSearch);
  const [fatherName, setFatherName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobileNumber, setMobileNumber] = useState(isSearchDigits ? urlSearch.slice(0, 10) : '');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [otherArea, setOtherArea] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [societyName, setSocietyName] = useState<string>('');
  const [accompanyingCount, setAccompanyingCount] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep category in sync with access restrictions
  useEffect(() => {
    if (lockedCategory) {
      setCategory(lockedCategory);
    } else if (validUrlCategory) {
      setCategory(validUrlCategory);
    }
  }, [lockedCategory, validUrlCategory]);

  const handleSubmit = async (shouldIssueCard: boolean = true) => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    const effectiveCategory = lockedCategory || category;

    try {
      const cleanFirst = firstName.trim();
      const cleanFather = fatherName.trim();
      const cleanSurname = surname.trim();
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const finalArea = selectedArea === 'OTHER' ? otherArea.trim() : selectedArea;
      const nameParts = [cleanFirst, cleanFather, cleanSurname].filter(Boolean);
      const computedFullName = nameParts.length > 0 ? nameParts.join(' ') : 'Walk-in Child';

      // 1. Create registration (all name/mobile fields are optional for ON_THE_SPOT)
      const res = await createRegistration({
        category: effectiveCategory,
        vistar,
        firstName: cleanFirst,
        fatherName: cleanFather,
        surname: cleanSurname,
        mobileNumber: cleanMobile,
        source: 'ON_THE_SPOT',
        houseNumber: houseNumber.trim(),
        societyName: societyName.trim(),
        area: finalArea,
      });

      // 2. Issue card if requested (default true)
      if (shouldIssueCard) {
        await issueCard(res.registrationId, accompanyingCount, vistar);
      }

      // 3. Track in station recent issuances
      const newChild: Registration = {
        id: res.registrationId,
        registrationCode: res.registrationCode,
        category: effectiveCategory,
        vistar,
        firstName: cleanFirst,
        fatherName: cleanFather,
        surname: cleanSurname,
        fullName: computedFullName,
        mobileNumber: cleanMobile,
        source: 'ON_THE_SPOT',
        houseNumber: houseNumber.trim(),
        societyName: societyName.trim(),
        area: finalArea,
        cardStatus: shouldIssueCard ? 'ISSUED' : 'NOT_ISSUED',
        accompanyingPersonsCount: shouldIssueCard ? accompanyingCount : 0,
        cardIssuedAt: shouldIssueCard ? new Date().toISOString() : undefined,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const saved = sessionStorage.getItem('recent_issued_cards');
        const list = saved ? JSON.parse(saved) : [];
        sessionStorage.setItem('recent_issued_cards', JSON.stringify([newChild, ...list.filter((r: Registration) => r.id !== newChild.id)].slice(0, 5)));
        
        // Set flash message for volunteer search page
        const cardMsg = shouldIssueCard 
          ? `⚡ કાર્ડ અપાઈ ગયું! Walk-in registered & issued: ${res.registrationCode} (${computedFullName}) +${accompanyingCount} companions!` 
          : `⚡ વોક-ઇન રજીસ્ટ્રેશન સફળ! Registered: ${res.registrationCode} (${computedFullName})`;
        sessionStorage.setItem('volunteer_flash_message', cardMsg);
      } catch {
        // ignore
      }

      // Return immediately to volunteer search screen
      navigate('/volunteer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Quick registration failed.';
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-10">
      <StaffNavbar />

      <main className="flex-1 max-w-lg md:max-w-3xl lg:max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Link
          to="/volunteer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-3.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Volunteer Search</span>
        </Link>

        {!onSpotEnabled && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center gap-2.5 text-xs font-bold shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>On-the-spot walk-in registration has been disabled by the Administrator in Settings.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xl text-left">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                ⚡ Fast Walk-in Entry
              </span>
              <h1 className="font-display text-lg sm:text-2xl font-black text-slate-900 mt-1">
                વોક-ઇન રજીસ્ટ્રેશન (Quick Register)
              </h1>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
              All Fields Optional
            </span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-4 sm:space-y-5">
            {/* Vistar & Department Row (Side-by-Side on Tablet/Laptop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Vistar (Area) Selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  વિસ્તાર (Area / Vistar)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setVistar('CHANDLODIYA')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                      vistar === 'CHANDLODIYA'
                        ? 'bg-purple-600 text-white shadow ring-1 ring-purple-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="font-bold">🏛️ Chandlodiya</span>
                    <span className={`text-[10px] font-extrabold mt-0.5 px-1.5 py-0.2 rounded border ${
                      vistar === 'CHANDLODIYA'
                        ? 'bg-purple-700/60 text-amber-200 border-purple-400/50'
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      31/10 Sat • 1001+
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistar('VADAJ')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                      vistar === 'VADAJ'
                        ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="font-bold">🏛️ Vadaj</span>
                    <span className={`text-[10px] font-extrabold mt-0.5 px-1.5 py-0.2 rounded border ${
                      vistar === 'VADAJ'
                        ? 'bg-blue-700/60 text-blue-100 border-blue-400/50'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      01/11 Sun • 0001+
                    </span>
                  </button>
                </div>
              </div>

              {/* Department Selection (if allowed BOTH) or Locked Banner */}
              {categoryAccess === 'BOTH' ? (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    વિભાગ (Department)
                  </label>
                  <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-[58px] items-center">
                    <button
                      type="button"
                      onClick={() => setCategory('BAL')}
                      className={`flex-1 h-full rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        category === 'BAL' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>👦 BAL (Boys)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('BLK')}
                      className={`flex-1 h-full rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        category === 'BLK' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>👧 BLK (Girls)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    વિભાગ (Assigned Department)
                  </label>
                  <div className={`h-[58px] px-3.5 rounded-xl border text-xs font-black flex items-center justify-between ${
                    category === 'BAL'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <span>{category === 'BAL' ? '👦 BAL (Boys Vibhag)' : '👧 BLK (Girls Vibhag)'}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      🔒 Assigned Access
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Name Fields (3 Columns on Tablet/Laptop) */}
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      {category === 'BLK'
                        ? "બાલિકાનું નામ (First Name)"
                        : "બાળકનું નામ (First Name)"}
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    autoCapitalize="words"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={category === 'BLK' ? "e.g. Aanya" : "e.g. Aarav"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      પિતાનું નામ (Father)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
                  </div>
                  <input
                    type="text"
                    autoCapitalize="words"
                    autoComplete="additional-name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Rajeshbhai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      અટક (Surname)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
                  </div>
                  <input
                    type="text"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="e.g. Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>
              </div>

              {/* Mobile Number & Area (2 Columns on Tablet/Laptop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      મોબાઈલ નંબર (Mobile Number)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210 (Optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold focus:outline-none focus:border-amber-500 focus:bg-white font-mono tracking-wider shadow-xs"
                  />
                </div>

                {/* Optional Area / Locality Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      વિસ્તાર (Area / Locality)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {(vistar === 'CHANDLODIYA' ? [
                      { id: 'Chandlodiya', label: 'ચાંદલોડિયા' },
                      { id: 'Ognaj', label: 'ઓગણજ' },
                      { id: 'Tragad', label: 'ત્રાગડ' },
                      { id: 'OTHER', label: 'અન્ય' },
                    ] : [
                      { id: 'Vadaj', label: 'વાડજ' },
                      { id: 'Nirnayanagar', label: 'નિર્ણયનગર' },
                      { id: 'OTHER', label: 'અન્ય' },
                    ]).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedArea(selectedArea === item.id ? '' : item.id)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedArea === item.id
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {selectedArea === 'OTHER' && (
                    <input
                      type="text"
                      value={otherArea}
                      onChange={(e) => setOtherArea(e.target.value)}
                      placeholder="તમારો વિસ્તાર લખો (e.g. Gota, Ranip)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-amber-400 text-slate-900 text-xs font-bold focus:outline-none focus:bg-white shadow-xs mt-1.5"
                    />
                  )}
                </div>
              </div>

              {/* House No & Society (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      ઘર નં. (House No.)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Opt</span>
                  </div>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. A-102"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      સોસાયટી (Society)
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Opt</span>
                  </div>
                  <input
                    type="text"
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    placeholder="e.g. Shantiniketan"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Accompanying Count Picker (0 to 9 Numbers Grid: 10 columns on Laptop) */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>સાથે જે આવે એની સંખ્યા (Companions Count):</span>
                </span>
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                  {accompanyingCount === 0 ? '0 (માત્ર બાળક • Child Only)' : `+${accompanyingCount} વ્યક્તિ (Companions)`}
                </span>
              </div>

              {/* 0 to 9 Numbers: 5 cols on mobile, 10 cols in single row on Laptop */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 mb-2.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAccompanyingCount(num)}
                    className={`h-11 sm:h-12 rounded-xl font-black border transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                      accompanyingCount === num
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow ring-2 ring-amber-400/40'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black leading-none">{num}</span>
                    <span className="text-[8px] font-bold opacity-75 mt-0.5 leading-none">
                      {num === 0 ? 'Only' : `+${num}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Stepper adjustment for 10+ */}
              <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">10+ અથવા વધારે (Custom Count):</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAccompanyingCount(Math.max(0, accompanyingCount - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold active:scale-90 text-sm cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-base font-black text-amber-700 w-6 text-center">{accompanyingCount}</span>
                  <button
                    type="button"
                    onClick={() => setAccompanyingCount(accompanyingCount + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold active:scale-90 text-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Fast 1-Step Submission Buttons */}
            <div className="pt-2 sm:pt-3 space-y-2">
              <button
                type="submit"
                disabled={submitting || !onSpotEnabled}
                className="w-full py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm sm:text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving &amp; Issuing Card...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>🚀 રજીસ્ટર કરી કાર્ડ આપો (+{accompanyingCount}) ➔</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submitting || !onSpotEnabled}
                onClick={() => handleSubmit(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <span>માત્ર રજીસ્ટ્રેશન (કાર્ડ વગર) • Register Only</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
