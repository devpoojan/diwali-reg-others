import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { 
  getCardPrintingSettings, 
  updateCardPrintingSettings, 
  isCardPrePrinted,
  formatCodeNumber,
  type CardPrintingSettings 
} from '@/services/cardPrintingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vistar, DepartmentCategory } from '@/types';

export const CardPrintingPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Cutoff settings state (stored as string in form inputs for easy typing)
  const [chandlodiyaBal, setChandlodiyaBal] = useState<string>('0');
  const [chandlodiyaBlk, setChandlodiyaBlk] = useState<string>('0');
  const [vadajBal, setVadajBal] = useState<string>('0');
  const [vadajBlk, setVadajBlk] = useState<string>('0');

  // Live counter states from database
  const [liveCounters, setLiveCounters] = useState<{
    chandlodiyaBal: number;
    chandlodiyaBlk: number;
    vadajBal: number;
    vadajBlk: number;
  }>({
    chandlodiyaBal: 0,
    chandlodiyaBlk: 1000,
    vadajBal: 0,
    vadajBlk: 1000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Test simulation tool state
  const [testCode, setTestCode] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load printing settings
      const settings = await getCardPrintingSettings();
      setChandlodiyaBal(settings.chandlodiyaBalCutoff ? String(settings.chandlodiyaBalCutoff) : '');
      setChandlodiyaBlk(settings.chandlodiyaBlkCutoff ? String(settings.chandlodiyaBlkCutoff) : '');
      setVadajBal(settings.vadajBalCutoff ? String(settings.vadajBalCutoff) : '');
      setVadajBlk(settings.vadajBlkCutoff ? String(settings.vadajBlkCutoff) : '');
      if (settings.updatedAt) {
        setLastSavedAt(new Date(settings.updatedAt).toLocaleTimeString());
      }

      // 2. Load live counters from database collections
      const [chdBalSnap, chdBlkSnap, vadBalSnap, vadBlkSnap] = await Promise.all([
        getDoc(doc(db, 'chandlodiya', 'counter_BAL')),
        getDoc(doc(db, 'chandlodiya', 'counter_BLK')),
        getDoc(doc(db, 'vadaj', 'counter_BAL')),
        getDoc(doc(db, 'vadaj', 'counter_BLK')),
      ]);

      setLiveCounters({
        chandlodiyaBal: chdBalSnap.exists() ? (chdBalSnap.data()?.lastAllocatedNumber ?? 0) : 0,
        chandlodiyaBlk: chdBlkSnap.exists() ? (chdBlkSnap.data()?.lastAllocatedNumber ?? 1000) : 1000,
        vadajBal: vadBalSnap.exists() ? (vadBalSnap.data()?.lastAllocatedNumber ?? 0) : 0,
        vadajBlk: vadBlkSnap.exists() ? (vadBlkSnap.data()?.lastAllocatedNumber ?? 1000) : 1000,
      });
    } catch (err) {
      console.error('Failed to load card printing settings or counters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to parse input values
  const parseNum = (val: string): number => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CardPrintingSettings> = {
        chandlodiyaBalCutoff: parseNum(chandlodiyaBal),
        chandlodiyaBlkCutoff: parseNum(chandlodiyaBlk),
        vadajBalCutoff: parseNum(vadajBal),
        vadajBlkCutoff: parseNum(vadajBlk),
      };

      await updateCardPrintingSettings(payload, currentUser?.displayName || 'Admin');
      setSaveSuccess(true);
      setLastSavedAt(new Date().toLocaleTimeString());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save card printing cutoffs:', err);
      alert('Error saving printing settings. Please check network connection.');
    } finally {
      setSaving(false);
    }
  };

  // Build current settings object for simulation
  const currentSettings: CardPrintingSettings = {
    chandlodiyaBalCutoff: parseNum(chandlodiyaBal),
    chandlodiyaBlkCutoff: parseNum(chandlodiyaBlk),
    vadajBalCutoff: parseNum(vadajBal),
    vadajBlkCutoff: parseNum(vadajBlk),
  };

  // Test simulation evaluation
  const evaluateTestCode = () => {
    if (!testCode.trim()) return null;
    const upper = testCode.trim().toUpperCase();
    const isC = upper.startsWith('C-') || upper.startsWith('C');
    const isV = upper.startsWith('V-') || upper.startsWith('V');

    if (!isC && !isV) {
      return { valid: false, error: 'Code must start with C or V (e.g. C-15, V-1025)' };
    }
    const match = upper.match(/(\d+)/);
    if (!match) {
      return { valid: false, error: 'Code must contain numbers (e.g. C-15 or V-1025)' };
    }
    const num = parseInt(match[1], 10);
    const vistar: Vistar = isC ? 'CHANDLODIYA' : 'VADAJ';
    const category: DepartmentCategory = num > 1000 ? 'BLK' : 'BAL';
    const formattedCode = `${isC ? 'C' : 'V'}-${num}`;

    const printed = isCardPrePrinted(upper, category, vistar, currentSettings);
    return {
      valid: true,
      formattedCode,
      vistar,
      category,
      num,
      isPrinted: printed,
    };
  };

  const testResult = evaluateTestCode();

  return (
    <AdminLayout
      title="Card Printing Cutoff Management"
      subtitle="Configure up to which serial number physical cards have been printed in advance. Registrations beyond the cutoff will be highlighted as Non-Printed (Manual Card) for volunteers."
      actions={
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Saved at {lastSavedAt}
            </span>
          )}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shadow-xs"
            title="Refresh Counters"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6 max-w-5xl text-left">
        {/* Save success toast */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Card printing cutoff settings saved successfully! Volunteer search stations will now immediately reflect these cutoffs in real time.
              </span>
            </div>
            <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-mono font-bold">
              Live Updated
            </span>
          </div>
        )}

        {/* Operational Explanation Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-amber-50/60 border border-indigo-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>પ્રિન્ટેડ કાર્ડ કટઓફ સિસ્ટમ (How Card Printing Cutoff Works)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Event Day Guide
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                અહીં દરેક સેન્ટર અને વિભાગ માટે <strong>છેલ્લો પ્રિન્ટ થયેલો નંબર (Last Printed Sequence Number)</strong> દાખલ કરવાનો રહેશે.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center gap-2">
                  <span className="text-base">🖨️</span>
                  <div>
                    <span className="font-bold text-emerald-800 block">કટઓફ અથવા તેનાથી ઓછા નંબર:</span>
                    <span className="text-slate-600 text-[11px]">વોલન્ટિયર સર્ચમાં <strong>"પ્રિન્ટેડ કાર્ડ"</strong> દેખાશે (બોક્સમાંથી કાર્ડ આપવું).</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-xs flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <div>
                    <span className="font-bold text-amber-800 block">કટઓફ પછીના નંબર (અથવા વોક-ઇન):</span>
                    <span className="text-slate-600 text-[11px]">વોલન્ટિયર સર્ચમાં <strong>"નોન-પ્રિન્ટેડ (મેન્યુઅલ કાર્ડ)"</strong> સ્પષ્ટ હાઇલાઇટ થશે.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 VISTARS x 2 DEPARTMENTS = 4 CONFIGURATION CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========================================================
              CENTER 1: CHANDLODIYA (Series: C-1 to 1000 for BAL, C-1001+ for BLK)
             ======================================================== */}
          <div className="rounded-2xl bg-white border border-purple-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">ચાંદલોડિયા સંસ્કારધામ (Chandlodiya)</h3>
                  <div className="text-[11px] text-purple-700 font-semibold">
                    તારીખ: ૩૧/૧૦/૨૦૨૬ • સીરીઝ: BAL (C-1 થી 1000) & BALIKA (C-1001 થી...)
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                Center 1
              </span>
            </div>

            {/* Department 1: Chandlodiya BAL */}
            <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <span>👦 બાળ વિભાગ (Bal Vibhag)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Last Issued: <strong className="text-blue-900 font-black">{formatCodeNumber('BAL', liveCounters.chandlodiyaBal, 'CHANDLODIYA')}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ક્યાં સુધી પ્રિન્ટ થયેલ છે? (Last Printed Number)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-sm font-black text-blue-700 shadow-xs">
                    C -
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={chandlodiyaBal}
                    onChange={(e) => setChandlodiyaBal(e.target.value)}
                    placeholder="દા.ત. 50"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  દા.ત. <strong>50</strong> લખવાથી <code>C-1</code> થી <code>C-50</code> પ્રિન્ટેડ ગણાશે, અને <code>C-51</code> પછીના મેન્યુઅલ ગણાશે.
                </div>
              </div>

              {/* Status summary pill */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-slate-500">કટઓફ કોડ:</span>
                <span className="font-mono font-bold">
                  {parseNum(chandlodiyaBal) > 0 ? (
                    <span className="text-emerald-700 font-bold">C-1 થી {formatCodeNumber('BAL', parseNum(chandlodiyaBal), 'CHANDLODIYA')} (Pre-Printed)</span>
                  ) : (
                    <span className="text-amber-700 font-bold">0 (બધા નોન-પ્રિન્ટેડ રહેશે)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Department 2: Chandlodiya BLK */}
            <div className="p-4 rounded-xl bg-slate-50 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span>👧 બાલિકા વિભાગ (Balika Vibhag)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Last Issued: <strong className="text-rose-900 font-black">{formatCodeNumber('BLK', liveCounters.chandlodiyaBlk, 'CHANDLODIYA')}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ક્યાં સુધી પ્રિન્ટ થયેલ છે? (Last Printed Number)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-sm font-black text-rose-700 shadow-xs">
                    C -
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={chandlodiyaBlk}
                    onChange={(e) => setChandlodiyaBlk(e.target.value)}
                    placeholder="દા.ત. 1040"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  દા.ત. <strong>1040</strong> લખવાથી <code>C-1001</code> થી <code>C-1040</code> પ્રિન્ટેડ ગણાશે, અને <code>C-1041</code> પછીના મેન્યુઅલ ગણાશે.
                </div>
              </div>

              {/* Status summary pill */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-slate-500">કટઓફ કોડ:</span>
                <span className="font-mono font-bold">
                  {parseNum(chandlodiyaBlk) > 0 ? (
                    <span className="text-emerald-700 font-bold">C-1001 થી {formatCodeNumber('BLK', parseNum(chandlodiyaBlk), 'CHANDLODIYA')} (Pre-Printed)</span>
                  ) : (
                    <span className="text-amber-700 font-bold">0 (બધા નોન-પ્રિન્ટેડ રહેશે)</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              CENTER 2: VADAJ (Series: V-1 to 1000 for BAL, V-1001+ for BLK)
             ======================================================== */}
          <div className="rounded-2xl bg-white border border-blue-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">વાડજ સંસ્કારધામ (Vadaj)</h3>
                  <div className="text-[11px] text-blue-700 font-semibold">
                    તારીખ: ૦૧/૧૧/૨૦૨૬ • સીરીઝ: BAL (V-1 થી 1000) & BALIKA (V-1001 થી...)
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                Center 2
              </span>
            </div>

            {/* Department 3: Vadaj BAL */}
            <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                  <span>👦 બાળ વિભાગ (Bal Vibhag)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Last Issued: <strong className="text-blue-900 font-black">{formatCodeNumber('BAL', liveCounters.vadajBal, 'VADAJ')}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ક્યાં સુધી પ્રિન્ટ થયેલ છે? (Last Printed Number)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-sm font-black text-blue-700 shadow-xs">
                    V -
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={vadajBal}
                    onChange={(e) => setVadajBal(e.target.value)}
                    placeholder="દા.ત. 50"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  દા.ત. <strong>50</strong> લખવાથી <code>V-1</code> થી <code>V-50</code> પ્રિન્ટેડ ગણાશે, અને <code>V-51</code> પછીના મેન્યુઅલ ગણાશે.
                </div>
              </div>

              {/* Status summary pill */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-slate-500">કટઓફ કોડ:</span>
                <span className="font-mono font-bold">
                  {parseNum(vadajBal) > 0 ? (
                    <span className="text-emerald-700 font-bold">V-1 થી {formatCodeNumber('BAL', parseNum(vadajBal), 'VADAJ')} (Pre-Printed)</span>
                  ) : (
                    <span className="text-amber-700 font-bold">0 (બધા નોન-પ્રિન્ટેડ રહેશે)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Department 4: Vadaj BLK */}
            <div className="p-4 rounded-xl bg-slate-50 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span>👧 બાલિકા વિભાગ (Balika Vibhag)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Last Issued: <strong className="text-rose-900 font-black">{formatCodeNumber('BLK', liveCounters.vadajBlk, 'VADAJ')}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ક્યાં સુધી પ્રિન્ટ થયેલ છે? (Last Printed Number)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-sm font-black text-rose-700 shadow-xs">
                    V -
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={vadajBlk}
                    onChange={(e) => setVadajBlk(e.target.value)}
                    placeholder="દા.ત. 1040"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  દા.ત. <strong>1040</strong> લખવાથી <code>V-1001</code> થી <code>V-1040</code> પ્રિન્ટેડ ગણાશે, અને <code>V-1041</code> પછીના મેન્યુઅલ ગણાશે.
                </div>
              </div>

              {/* Status summary pill */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-slate-500">કટઓફ કોડ:</span>
                <span className="font-mono font-bold">
                  {parseNum(vadajBlk) > 0 ? (
                    <span className="text-emerald-700 font-bold">V-1001 થી {formatCodeNumber('BLK', parseNum(vadajBlk), 'VADAJ')} (Pre-Printed)</span>
                  ) : (
                    <span className="text-amber-700 font-bold">0 (બધા નોન-પ્રિન્ટેડ રહેશે)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Save Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Cutoffs...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Cutoff Settings (સેવ કરો)</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Real-Time Code Simulator / Validator */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              લાઇવ ટેસ્ટ સિમ્યુલેટર (Live Code Simulator)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            કોઈપણ રજીસ્ટ્રેશન કોડ (દા.ત. <code>C-15</code>, <code>C-1025</code>, <code>V-25</code>, <code>V-1050</code>) અહીં લખીને ચકાસો કે વોલન્ટિયર સર્ચમાં પ્રિન્ટેડ દેખાશે કે નોન-પ્રિન્ટેડ:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Enter Code (e.g. C-15, V-1025)"
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-500 max-w-xs uppercase shadow-xs"
            />

            {testResult && (
              <div className="flex items-center gap-2">
                {!testResult.valid ? (
                  <span className="text-xs text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-300 px-3 py-2 rounded-xl">
                    <X className="w-4 h-4" />
                    <span>{testResult.error}</span>
                  </span>
                ) : testResult.isPrinted ? (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-base">🖨️</span>
                    <span>{testResult.formattedCode}: પ્રિન્ટેડ કાર્ડ (Pre-Printed in Box)</span>
                  </span>
                ) : (
                  <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-300 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-base">✍️</span>
                    <span>{testResult.formattedCode}: નોન-પ્રિન્ટેડ (Manual Blank Card Required)</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};
