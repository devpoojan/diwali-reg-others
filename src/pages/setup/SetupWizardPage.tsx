import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Database, 
  Palette, 
  Rocket, 
  Upload, 
  Trash2, 
  Plus, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Terminal, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getEventSettings, 
  completeSetupWizard, 
  uploadBrandingImage, 
  DEFAULT_CENTERS 
} from '@/services/eventSettingsService';
import { 
  saveCustomFirebaseConfig, 
  testFirebaseConnection 
} from '@/lib/firebase';
import type { EventSettings, CenterConfig, FirebaseProjectConfig } from '@/types';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form State: Step 1 Firebase
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseProjectConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baps_firebase_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      apiKey: '',
      projectId: '',
      authDomain: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      databaseId: 'anandotsav',
    };
  });
  const [firebasePastedCode, setFirebasePastedCode] = useState<string>('');
  const [testingFirebase, setTestingFirebase] = useState<boolean>(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showManualFields, setShowManualFields] = useState<boolean>(false);

  // Form State: Step 2 Branding
  const [eventName, setEventName] = useState<string>('Anandotsav 2026');
  const [organizationName, setOrganizationName] = useState<string>('BAPS Swaminarayan Sanstha');
  const [helplinePhone, setHelplinePhone] = useState<string>('+91 98765 43210');
  const [helplineWhatsApp, setHelplineWhatsApp] = useState<string>('+91 98765 43210');
  const [description, setDescription] = useState<string>(
    'દિવાળી બાળ આનંદોત્સવ - વિવિધ એડવેન્ચર ગેમ્સ, પ્રેરણાદાયી પ્રદર્શન, સાંસ્કૃતિક રમતો અને આકર્ષક ઇનામો સાથે ભવ્ય મહોત્સવ.'
  );
  const [logoUrl, setLogoUrl] = useState<string>('/anandotsav-logo.png');
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

  // Form State: Step 3 Centers
  const [centers, setCenters] = useState<CenterConfig[]>(DEFAULT_CENTERS);

  // Form State: Step 4 Registration Controls
  const [publicRegEnabled, setPublicRegEnabled] = useState<boolean>(true);
  const [onSpotRegEnabled, setOnSpotRegEnabled] = useState<boolean>(true);
  const [autoCloseDateTime, setAutoCloseDateTime] = useState<string>('');

  // Load existing configuration if available
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const s = await getEventSettings();
        if (s.eventName) setEventName(s.eventName);
        if (s.organizationName) setOrganizationName(s.organizationName);
        if (s.helplinePhone) setHelplinePhone(s.helplinePhone);
        if (s.helplineWhatsApp) setHelplineWhatsApp(s.helplineWhatsApp);
        if (s.description) setDescription(s.description);
        if (s.logoUrl) setLogoUrl(s.logoUrl);
        if (s.centers && s.centers.length > 0) setCenters(s.centers);
        if (s.publicRegistrationEnabled !== undefined) setPublicRegEnabled(s.publicRegistrationEnabled);
        if (s.onSpotRegistrationEnabled !== undefined) setOnSpotRegEnabled(s.onSpotRegistrationEnabled);
        if (s.automaticClosingAt) setAutoCloseDateTime(s.automaticClosingAt);
      } catch (err) {
        console.warn('Initial setup wizard load from default:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // --- STEP 1: Firebase Auto Parser ---
  const handleParsePastedFirebase = () => {
    if (!firebasePastedCode.trim()) return;
    try {
      const extract = (key: string) => {
        const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`);
        const match = firebasePastedCode.match(regex);
        return match ? match[1] : '';
      };

      const parsed: FirebaseProjectConfig = {
        apiKey: extract('apiKey') || firebaseConfig.apiKey,
        authDomain: extract('authDomain') || firebaseConfig.authDomain,
        projectId: extract('projectId') || firebaseConfig.projectId,
        storageBucket: extract('storageBucket') || firebaseConfig.storageBucket,
        messagingSenderId: extract('messagingSenderId') || firebaseConfig.messagingSenderId,
        appId: extract('appId') || firebaseConfig.appId,
        databaseId: extract('databaseId') || firebaseConfig.databaseId || 'anandotsav',
      };

      setFirebaseConfig(parsed);
      setFirebaseTestResult({
        success: true,
        message: 'ફાયરબેઝ કન્ફિગરેશન સફળતાપૂર્વક મેળવી લીધું છે! હવે નીચે "કનેક્શન ટેસ્ટ કરો" બટન દબાવો.',
      });
    } catch {
      setFirebaseTestResult({
        success: false,
        message: 'કોડ વાંચવામાં ભૂલ થઈ. કૃપા કરીને નીચે જાતે વિગતો ભરો.',
      });
    }
  };

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseTestResult(null);
    try {
      const res = await testFirebaseConnection(firebaseConfig);
      setFirebaseTestResult(res);
      if (res.success) {
        saveCustomFirebaseConfig(firebaseConfig);
      }
    } catch (err) {
      setFirebaseTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'કનેક્શન ટેસ્ટ નિષ્ફળ રહ્યો.',
      });
    } finally {
      setTestingFirebase(false);
    }
  };

  // --- STEP 2: Logo Upload Handler ---
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const uploadedUrl = await uploadBrandingImage(file);
      setLogoUrl(uploadedUrl);
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('ફોટો અપલોડ કરવામાં મુશ્કેલી થઈ. કૃપા કરીને 5MB કરતાં નાની PNG અથવા JPG ફાઇલ પસંદ કરો.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // --- STEP 3: Centers Management ---
  const handleAddCenter = () => {
    const newId = `center_${Date.now()}`;
    const newCenter: CenterConfig = {
      id: newId,
      name: 'New Center',
      gujaratiName: 'નવું કેન્દ્ર',
      codePrefix: 'N',
      date: '2026-11-01',
      day: 'Sunday (રવિવાર)',
      time: '05:00 PM – 08:00 PM',
      venue: 'BAPS સ્વામિનારાયણ સંસ્કારધામ',
      address: 'અમદાવાદ, ગુજરાત',
    };
    setCenters([...centers, newCenter]);
  };

  const handleUpdateCenter = (index: number, updates: Partial<CenterConfig>) => {
    const updated = [...centers];
    updated[index] = { ...updated[index], ...updates };
    setCenters(updated);
  };

  const handleRemoveCenter = (index: number) => {
    if (centers.length <= 1) {
      alert('ઓછામાં ઓછું એક સેન્ટર રાખવું ફરજિયાત છે.');
      return;
    }
    const target = centers[index];
    if (window.confirm(`શું તમે "${target.gujaratiName || target.name}" સેન્ટર કાઢી નાખવા માંગો છો?`)) {
      setCenters(centers.filter((_, i) => i !== index));
    }
  };

  // --- FINAL STEP: Save & Launch ---
  const handleCompleteSetup = async () => {
    setSaving(true);
    try {
      // 1. Save Firebase Config if entered
      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        saveCustomFirebaseConfig(firebaseConfig);
      }

      // 2. Prepare EventSettings
      const updates: Partial<EventSettings> = {
        eventName,
        organizationName,
        helplinePhone,
        helplineWhatsApp,
        contactInformation: `${helplinePhone} / ${helplineWhatsApp}`,
        description,
        logoUrl,
        centers,
        publicRegistrationEnabled: publicRegEnabled,
        onSpotRegistrationEnabled: onSpotRegEnabled,
        automaticClosingAt: autoCloseDateTime || null,
        
        // Sync first 2 centers into legacy fields for backward compatibility
        chandlodiyaDate: centers[0]?.date || '2026-10-31',
        chandlodiyaDay: centers[0]?.day || 'Saturday (શનિવાર)',
        chandlodiyaTime: centers[0]?.time || '05:00 PM – 08:00 PM',
        chandlodiyaVenue: centers[0]?.venue || 'BAPS Sanskardham',
        
        vadajDate: centers[1]?.date || '2026-11-01',
        vadajDay: centers[1]?.day || 'Sunday (રવિવાર)',
        vadajTime: centers[1]?.time || '05:00 PM – 08:00 PM',
        vadajVenue: centers[1]?.venue || 'BAPS Sanskardham',
      };

      await completeSetupWizard(updates);

      setSaveSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err) {
      console.error('Failed to complete setup:', err);
      alert('સેટિંગ્સ સેવ કરવામાં મુશ્કેલી થઈ. કૃપા કરીને ફાયરબેઝ કનેક્શન તપાસો.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold tracking-wide">સેટઅપ વિઝાર્ડ લોડ થઈ રહ્યું છે...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, label: '૧. ફાયરબેઝ કનેક્શન', icon: Database },
    { id: 2, label: '૨. ઉત્સવ & લોગો', icon: Palette },
    { id: 3, label: '૩. સેન્ટર્સ & સ્થળ', icon: Building2 },
    { id: 4, label: '૪. લોન્ચ & ડિપ્લોય', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                  ઝડપી સેટઅપ
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  Turnkey System
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                BAPS બાળ મહોત્સવ — સેટઅપ વિઝાર્ડ
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 cursor-pointer"
            >
              હોમપેજ પર જાઓ
            </button>
          </div>
        </div>
      </header>

      {/* Step Navigation Pill Ribbon */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 px-3 sm:px-6 py-2.5 overflow-x-auto scrollbar-none">
        <div className="max-w-5xl mx-auto flex items-center gap-2 min-w-max">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20 ring-2 ring-amber-400/30'
                    : isCompleted
                    ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-slate-800'
                    : 'bg-slate-900/50 text-slate-400 border border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive
                    ? 'bg-slate-950 text-amber-400'
                    : isCompleted
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : s.id}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Card Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md mb-6">
          {/* ============================================================== */}
          {/* STEP 1: FIREBASE SETUP                                         */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold mb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>પગલું ૧ • ગૂગલ ફાયરબેઝ કનેક્શન (Firebase Database)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  તમારા મંડળનું ગુગલ ફાયરબેઝ જોડો
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  તમારા બાળકોનો રજીસ્ટ્રેશન ડેટા સંપૂર્ણપણે તમારા પોતાના મંડળના સુરક્ષિત ગુગલ એકાઉન્ટમાં સંગ્રહિત રહે તે માટે ફાયરબેઝ જોડવું જરૂરી છે.
                </p>
              </div>

              {/* 3-Minute Quick Guide Accordion */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-black">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>મફતમાં ગુગલ ફાયરબેઝ પ્રોજેક્ટ કેવી રીતે બનાવવો (સરળ પગલાં):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-medium pl-1 leading-relaxed">
                  <li>
                    બ્રાઉઝરમાં <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold">console.firebase.google.com <ExternalLink className="w-3 h-3 inline" /></a> ખોલો અને જીમેઇલ એકાઉન્ટથી લોગિન કરો.
                  </li>
                  <li>
                    <strong>&ldquo;Add project&rdquo;</strong> પર ક્લિક કરો ➜ તમારા પ્રોજેક્ટનું નામ આપો ➜ Create Project કરો.
                  </li>
                  <li>
                    ડાબી બાજુ મેનુમાં <strong>Build &gt; Authentication</strong> માં જાઓ ➜ Get Started ➜ <strong>Email/Password</strong> ને Enable કરીને Save કરો.
                  </li>
                  <li>
                    ડાબી બાજુ મેનુમાં <strong>Build &gt; Firestore Database</strong> માં જાઓ ➜ Create database ➜ લોકેશન <strong>asia-south1 (Mumbai)</strong> પસંદ કરો.
                  </li>
                  <li>
                    <strong>Project Settings (⚙️) &gt; General &gt; Your apps</strong> માં જાઓ ➜ વેબ આઇકોન <strong>&ldquo;&lt; / &gt;&rdquo;</strong> પર ક્લિક કરીને કોડ કોપી કરો.
                  </li>
                </ol>
              </div>

              {/* Paste Config Snippet Auto-Parser */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  📋 રીત ૧: કોપી કરેલો ફાયરબેઝ કોડ અહીં પેસ્ટ કરો (ઓટો-ફિલ):
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    value={firebasePastedCode}
                    onChange={(e) => setFirebasePastedCode(e.target.value)}
                    placeholder="const firebaseConfig = { apiKey: 'AIza...', projectId: 'my-project', ... };"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleParsePastedFirebase}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0"
                  >
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Auto-Fill</span>
                  </button>
                </div>
              </div>

              {/* Option B: Manual Fields (Collapsible to keep credentials protected) */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowManualFields(!showManualFields)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>✍️ રીત ૨: જાતે ફિલ્ડ્સ ભરો અથવા તપાસો (Manual Fields)</span>
                    {firebaseConfig.projectId && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                        પ્રોજેક્ટ: {firebaseConfig.projectId}
                      </span>
                    )}
                  </span>
                  {showManualFields ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showManualFields && (
                  <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-400">API Key</label>
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                          >
                            {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showApiKey ? 'છુપાવો' : 'જુઓ'}</span>
                          </button>
                        </div>
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={firebaseConfig.apiKey}
                          onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                          placeholder="AIzaSy..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Project ID</label>
                        <input
                          type="text"
                          value={firebaseConfig.projectId}
                          onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                          placeholder="my-baps-event"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Auth Domain</label>
                        <input
                          type="text"
                          value={firebaseConfig.authDomain}
                          onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                          placeholder="my-baps-event.firebaseapp.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Storage Bucket</label>
                        <input
                          type="text"
                          value={firebaseConfig.storageBucket}
                          onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                          placeholder="my-baps-event.appspot.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Connection Button & Result */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestFirebase}
                    disabled={testingFirebase || !firebaseConfig.apiKey || !firebaseConfig.projectId}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {testingFirebase ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>કનેક્શન ટેસ્ટ થઈ રહ્યું છે...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>કનેક્શન ટેસ્ટ કરો (Test Connection)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400">
                    આ બટન દબાવવાથી ફાયરસ્ટોર ડેટાબેઝ સાથે લાઈવ કનેક્શન ચકાસાશે.
                  </p>
                </div>

                {firebaseTestResult && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                    firebaseTestResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {firebaseTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{firebaseTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: EVENT BRANDING & LOGO                                  */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-bold mb-2">
                  <Palette className="w-3.5 h-3.5" />
                  <span>પગલું ૨ • ઉત્સવની વિગત અને લોગો અપલોડ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  મહોત્સવની વિગત અને મંદિરનો લોગો
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  તમારા મંદિર કે ઉત્સવનું નામ, હેલ્પલાઇન નંબર અને સત્તાવાર લોગો અપલોડ કરો.
                </p>
              </div>

              {/* Logo Upload Box with Live Preview */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-black text-slate-200 uppercase tracking-wider mb-2">
                  🖼️ મંદિર / મહોત્સવનો લોગો (Logo Upload)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Current Logo Preview Card */}
                  <div className="w-28 h-28 rounded-2xl bg-white/5 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-2 relative group shrink-0">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Event Logo Preview" 
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 text-center">લોગો નથી</span>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? 'અપલોડ થઈ રહ્યો છે...' : 'નવો લોગો ફોટો પસંદ કરો'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>

                      {logoUrl !== '/anandotsav-logo.png' && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('/anandotsav-logo.png')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                        >
                          ડિફોલ્ટ BAPS લોગો રાખો
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      PNG, JPG, WebP અથવા SVG ફાઈલ સપોર્ટેડ છે. ટ્રાન્સપરન્ટ બેકગ્રાઉન્ડ વાળો લોગો સૌથી સુંદર દેખાશે.
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Name & Org */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    મહોત્સવ / ઇવેન્ટનું નામ *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="આનંદોત્સવ ૨૦૨૬ / દિવાળી બાળ ઉત્સવ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    સંસ્થા / મંદિરનું નામ *
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="BAPS સ્વામિનારાયણ મંદિર"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Helpline Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    હેલ્પલાઇન મોબાઈલ નંબર
                  </label>
                  <input
                    type="text"
                    value={helplinePhone}
                    onChange={(e) => setHelplinePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    વ્હોટ્સએપ સપોર્ટ નંબર
                  </label>
                  <input
                    type="text"
                    value={helplineWhatsApp}
                    onChange={(e) => setHelplineWhatsApp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Event Description */}
              <div className="text-xs">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  ઉત્સવનું વર્ણન (વાલીઓને હોમપેજ પર દેખાશે)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: CENTERS & VENUES                                       */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>પગલું ૩ • સેન્ટર્સ અને ઉત્સવના સ્થળ</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    સેન્ટર્સ અને ઉત્સવના સ્થળો
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    તમારા મંડળમાં જેટલા સ્થળે ઉત્સવ ઉજવાતો હોય તે તમામ સેન્ટરો અહીં ઉમેરી શકો છો.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCenter}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>નવું સેન્ટર ઉમેરો (Add Center)</span>
                </button>
              </div>

              {/* Centers List */}
              <div className="space-y-4">
                {centers.map((center, index) => (
                  <div 
                    key={center.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30 text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm font-black text-white">
                          {center.gujaratiName || center.name || 'સેન્ટર'}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({center.name || '—'})
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                          કોડ પ્રીફિક્સ: {center.codePrefix}- (દા.ત. {center.codePrefix}-1, {center.codePrefix}-2)
                        </span>
                      </div>

                      {centers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCenter(index)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="સેન્ટર કાઢી નાખો"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          સેન્ટરનું નામ (English) *
                        </label>
                        <input
                          type="text"
                          value={center.name}
                          onChange={(e) => handleUpdateCenter(index, { name: e.target.value })}
                          placeholder="Chandlodiya"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          ગુજરાતી નામ *
                        </label>
                        <input
                          type="text"
                          value={center.gujaratiName}
                          onChange={(e) => handleUpdateCenter(index, { gujaratiName: e.target.value })}
                          placeholder="ચાંદલોડિયા"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          કોડ પ્રીફિક્સ (Code Prefix) *
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={center.codePrefix}
                          onChange={(e) => handleUpdateCenter(index, { codePrefix: e.target.value.toUpperCase() })}
                          placeholder="C"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-black text-xs uppercase focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          ઉત્સવની તારીખ *
                        </label>
                        <input
                          type="date"
                          value={center.date}
                          onChange={(e) => handleUpdateCenter(index, { date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          વાર (Day) *
                        </label>
                        <input
                          type="text"
                          value={center.day}
                          onChange={(e) => handleUpdateCenter(index, { day: e.target.value })}
                          placeholder="Saturday (શનિવાર)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          ઉત્સવનો સમય *
                        </label>
                        <input
                          type="text"
                          value={center.time}
                          onChange={(e) => handleUpdateCenter(index, { time: e.target.value })}
                          placeholder="05:00 PM – 08:00 PM"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-amber-400/40"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        મંદિર / સ્થળનું પૂરું સરનામું (Venue Address) *
                      </label>
                      <input
                        type="text"
                        value={center.venue}
                        onChange={(e) => handleUpdateCenter(index, { venue: e.target.value })}
                        placeholder="BAPS સ્વામિનારાયણ સંસ્કારધામ, અમદાવાદ"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-amber-400/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: LAUNCH & DEPLOY                                        */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold mb-2">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>પગલું ૪ • રજીસ્ટ્રેશન ચાલુ/બંધ અને લાઈવ લોન્ચ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  રજીસ્ટ્રેશન કંટ્રોલ્સ અને હોસ્ટિંગ
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  ઓનલાઈન રજીસ્ટ્રેશન ચાલુ કરો અને તમારી વેબસાઇટને ઈન્ટરનેટ પર લાઈવ મૂકો.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-black text-white block text-sm">ઓનલાઈન પબ્લિક રજીસ્ટ્રેશન</span>
                    <span className="text-slate-400 text-[11px]">વાલીઓ ઘરેથી ફોર્મ ભરી શકે</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublicRegEnabled(!publicRegEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      publicRegEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      publicRegEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-black text-white block text-sm">સ્પોટ / વોક-ઇન રજીસ્ટ્રેશન</span>
                    <span className="text-slate-400 text-[11px]">ઉત્સવના દિવસે કાઉન્ટર પર એન્ટ્રી</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnSpotRegEnabled(!onSpotRegEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      onSpotRegEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      onSpotRegEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Terminal Commands Guide */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>વેબસાઇટને મફત ફાયરબેઝ હોસ્ટિંગ પર લાઈવ કરવાના ટર્મિનલ કમાન્ડ્સ:</span>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-slate-300 space-y-1.5 font-sans">
                  <div className="font-mono text-emerald-400">npm run deploy</div>
                  <div className="text-[11px] text-slate-400">
                    આ કમાન્ડ આપમેળે કોડ બિલ્ડ કરીને તમારી ફ્રી ફાયરબેઝ હોસ્ટિંગ લિંક (<code className="text-amber-400 font-mono">https://your-project.web.app</code>) પર લાઈવ કરી દેશે!
                  </div>
                </div>
              </div>

              {/* Big Save Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={saving || saveSuccess}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>સેટિંગ્સ સેવ થઈ રહ્યા છે...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-slate-950" />
                      <span>સેટઅપ સફળતાપૂર્વક પૂર્ણ થયું! હોમપેજ પર લઈ જઈ રહ્યા છીએ...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>બધી વિગતો સેવ કરો અને સિસ્ટમ ચાલુ કરો 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>પાછળ જાઓ</span>
          </button>

          <span className="text-xs font-bold text-slate-500">
            પગલું {currentStep} / 4
          </span>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>આગળ વધો</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSetup}
              disabled={saving || saveSuccess}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>સિસ્ટમ ચાલુ કરો</span>
              <Rocket className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
