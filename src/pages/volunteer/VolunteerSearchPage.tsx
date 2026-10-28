import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StaffNavbar } from '@/components/staff/StaffNavbar';
import { useAuth } from '@/context/AuthContext';
import { 
  searchRegistrations,
  advanceSearchGeneration,
  issueCard, 
  reverseCard, 
  updateAccompanyingCount 
} from '@/services/registrationService';
import type { Registration, DepartmentCategory, EventSettings, Vistar } from '@/types';
import { 
  subscribeToCardPrintingSettings, 
  isCardPrePrinted, 
  type CardPrintingSettings 
} from '@/services/cardPrintingService';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Search, 
  X, 
  RotateCcw, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Phone, 
  Plus, 
  Minus,
  History,
  ArrowRight,
  Radio,
  ChevronDown
} from 'lucide-react';

export const VolunteerSearchPage: React.FC = () => {
  const { categoryAccess } = useAuth();

  // Selected operational department
  const initialCategory: DepartmentCategory = categoryAccess === 'BLK_ONLY' ? 'BLK' : 'BAL';
  const [selectedCategory, setSelectedCategory] = useState<DepartmentCategory>(initialCategory);

  // Selected operational vistar (Area) - Must ask first when volunteer opens panel
  const [selectedVistar, setSelectedVistar] = useState<Vistar | null>(() => {
    try {
      const saved = sessionStorage.getItem('volunteer_active_vistar');
      if (saved === 'CHANDLODIYA' || saved === 'VADAJ') return saved;
    } catch {}
    return null;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const focusSearchInput = () => {
    if (window.innerWidth >= 1024 && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    } else {
      searchInputRef.current?.focus();
    }
  };
  const [results, setResults] = useState<Registration[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Registration | null>(null);
  const [cardFilter, setCardFilter] = useState<'ALL' | 'PRINTED' | 'NON_PRINTED'>('ALL');

  // Per-child companion counts directly tracked on each search card (0ms inline workflow)
  const [companionCounts, setCompanionCounts] = useState<Record<string, number>>({});

  const setChildCompanionCount = (childId: string, count: number) => {
    setCompanionCounts((prev) => ({
      ...prev,
      [childId]: Math.max(0, count),
    }));
  };

  // Real-time card printing cutoff settings subscription
  const [printingSettings, setPrintingSettings] = useState<CardPrintingSettings | null>(null);
  useEffect(() => {
    const unsubPrinting = subscribeToCardPrintingSettings((s) => {
      setPrintingSettings(s);
    });
    return () => unsubPrinting();
  }, []);

  // Card printing counts and filtered results for quick volunteer inspection
  const printedCount = useMemo(() => {
    return results.filter((child) =>
      isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings)
    ).length;
  }, [results, printingSettings]);

  const nonPrintedCount = useMemo(() => {
    return results.filter(
      (child) => !isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings)
    ).length;
  }, [results, printingSettings]);

  const filteredResults = useMemo(() => {
    let list = results;
    if (cardFilter === 'PRINTED') {
      list = results.filter((child) =>
        isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings)
      );
    } else if (cardFilter === 'NON_PRINTED') {
      list = results.filter(
        (child) => !isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings)
      );
    }

    // Always show non-issued cards first and issued cards below
    return [...list].sort((a, b) => {
      const aIssued = a.cardStatus === 'ISSUED' ? 1 : 0;
      const bIssued = b.cardStatus === 'ISSUED' ? 1 : 0;
      return aIssued - bIssued;
    });
  }, [results, cardFilter, printingSettings]);



  // Modal State for Editing Companions
  const [editCompanionsModalOpen, setEditCompanionsModalOpen] = useState(false);
  const [editCount, setEditCount] = useState<number>(0);

  // Quick Station Switcher Modal (Area & Vibhag)
  const [stationModalOpen, setStationModalOpen] = useState(false);

  // Feedback notifications (including flash messages from Walk-in registration)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(() => {
    try {
      const flash = sessionStorage.getItem('volunteer_flash_message');
      if (flash) {
        sessionStorage.removeItem('volunteer_flash_message');
        return { type: 'success', message: flash };
      }
    } catch {}
    return null;
  });

  // Live Ground Broadcast Announcement from Admin
  const [broadcast, setBroadcast] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'eventSettings', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as EventSettings;
        setBroadcast({
          active: Boolean(data.broadcastActive && data.broadcastAnnouncement),
          message: data.broadcastAnnouncement || '',
        });
      }
    });
    return () => unsub();
  }, []);

  // Recently Issued at this station for instantaneous 1-tap edits & reversals
  const [recentIssuances, setRecentIssuances] = useState<Registration[]>(() => {
    try {
      const saved = sessionStorage.getItem('recent_issued_cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeScope: DepartmentCategory | 'BOTH' = 
    categoryAccess === 'BAL_ONLY' ? 'BAL' :
    categoryAccess === 'BLK_ONLY' ? 'BLK' :
    selectedCategory;

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In-memory instant search cache with TTL (5 minutes)
  const searchCacheRef = useRef<Map<string, { data: Registration[]; timestamp: number }>>(new Map());
  // In-flight request deduplication map to prevent redundant concurrent queries
  const inFlightRequestsRef = useRef<Map<string, Promise<{ results: Registration[]; generation: number }>>>(new Map());

  // Live real-time station roster subscription for instant sub-millisecond local search
  const [stationRoster, setStationRoster] = useState<Registration[]>([]);

  useEffect(() => {
    if (!selectedVistar) {
      setStationRoster([]);
      return;
    }

    const colName = selectedVistar.toLowerCase();
    let q = query(
      collection(db, colName),
      where('isDeleted', '==', false),
      limit(1500)
    );

    if (categoryAccess === 'BAL_ONLY') {
      q = query(
        collection(db, colName),
        where('category', '==', 'BAL'),
        where('isDeleted', '==', false),
        limit(1500)
      );
    } else if (categoryAccess === 'BLK_ONLY') {
      q = query(
        collection(db, colName),
        where('category', '==', 'BLK'),
        where('isDeleted', '==', false),
        limit(1500)
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const records: Registration[] = [];
      snapshot.docs.forEach((docSnap) => {
        if (!docSnap.id.startsWith('counter_') && !docSnap.id.startsWith('_')) {
          const d = docSnap.data() as Registration;
          records.push({
            ...d,
            id: docSnap.id,
            vistar: selectedVistar,
          });
        }
      });
      setStationRoster(records);
    }, (err) => {
      console.warn('Station roster real-time sync notice:', err);
    });

    return () => unsub();
  }, [selectedVistar, categoryAccess]);

  // Ultra-fast debounced search-as-you-type with generation-based stale prevention
  useEffect(() => {
    if (!selectedVistar) {
      setResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    const cacheKey = `${trimmed.toLowerCase()}_${activeScope}_${selectedVistar}`;
    const cachedEntry = searchCacheRef.current.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < 5 * 60 * 1000) {
      setResults(cachedEntry.data);
      setSearching(false);
      return;
    }

    // 1. Instant local roster match (0ms latency, zero network wait)
    const lowerTrimmed = trimmed.toLowerCase();
    const upperTrimmed = trimmed.toUpperCase();
    const digitsOnly = trimmed.replace(/\D/g, '');
    const isPureNumber = /^\d+$/.test(trimmed);
    const vistarPrefix = selectedVistar === 'CHANDLODIYA' ? 'C' : 'V';
    const targetCode = isPureNumber ? `${vistarPrefix}-${parseInt(trimmed, 10)}` : null;

    const localMatches = stationRoster
      .filter((reg) => {
        if (reg.category !== activeScope) return false;

        // Registration code match:
        // Direct match on raw input (e.g. 'V-42'), synthesized code (e.g. '42' -> 'V-42' in Vadaj), or partial match
        if (reg.registrationCode) {
          const regUpper = reg.registrationCode.toUpperCase();
          if (regUpper === upperTrimmed) return true;
          if (targetCode && regUpper === targetCode) return true;
          if (regUpper.includes(upperTrimmed)) return true;
        }

        // 10-digit mobile number or prefix match
        if (digitsOnly.length >= 3 && reg.mobileNumber.includes(digitsOnly)) return true;

        // Child name / surname match
        if (reg.fullName && reg.fullName.toLowerCase().includes(lowerTrimmed)) return true;
        if (reg.nameSearchTokens && reg.nameSearchTokens.includes(lowerTrimmed)) return true;

        return false;
      })
      // Prioritize exact code matches first, then non-issued cards, then issued cards
      .sort((a, b) => {
        const aIsExactCode = (a.registrationCode === upperTrimmed || (targetCode && a.registrationCode === targetCode)) ? 1 : 0;
        const bIsExactCode = (b.registrationCode === upperTrimmed || (targetCode && b.registrationCode === targetCode)) ? 1 : 0;
        if (aIsExactCode !== bIsExactCode) return bIsExactCode - aIsExactCode;

        const aIssued = a.cardStatus === 'ISSUED' ? 1 : 0;
        const bIssued = b.cardStatus === 'ISSUED' ? 1 : 0;
        return aIssued - bIssued;
      })
      .slice(0, 20);

    if (localMatches.length > 0) {
      // Instant display at 0ms!
      setResults(localMatches);
      setSearching(false);
      searchCacheRef.current.set(cacheKey, { data: localMatches, timestamp: Date.now() });
      return;
    }

    // 2. Fallback to server search (e.g. cross-station lookups or records outside local roster)
    setSearching(true);
    // 250ms input debounce for text, instant (0ms) for numbers (e.g. 42 or mobile) or V- / C- codes
    const isImmediate = /^\d+$/.test(trimmed) || 
      trimmed.toUpperCase().startsWith('V-') || 
      trimmed.toUpperCase().startsWith('C-');
    const delay = isImmediate ? 0 : 250;

    // Advance generation BEFORE the timeout so every keystroke gets a unique tag
    const myGeneration = advanceSearchGeneration();

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let requestPromise = inFlightRequestsRef.current.get(cacheKey);
        if (!requestPromise) {
          requestPromise = searchRegistrations(trimmed, activeScope, selectedVistar, myGeneration);
          inFlightRequestsRef.current.set(cacheKey, requestPromise);
        }

        const { results: data, generation: returnedGen } = await requestPromise;
        inFlightRequestsRef.current.delete(cacheKey);

        // Discard result if a newer search has already been issued
        if (returnedGen !== myGeneration) return;
        searchCacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
        setResults(data);
      } catch (err) {
        inFlightRequestsRef.current.delete(cacheKey);
        console.error('Search error:', err);
      } finally {
        // Only clear spinner if this generation is still the latest active search
        setSearching(false);
      }
    }, delay);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, activeScope, selectedVistar]);

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setSelectedChild(null);
    setCardFilter('ALL');
    focusSearchInput();
  };

  // Optimistic 0ms Instant Card Issuance (Zero Spinner Delay)
  const handleDirectIssue = (child: Registration, count: number) => {
    // Enforce department access boundary
    if (categoryAccess === 'BAL_ONLY' && child.category !== 'BAL') {
      alert('Access Denied: You only have access to BAL (Boys) registrations.');
      return;
    }
    if (categoryAccess === 'BLK_ONLY' && child.category !== 'BLK') {
      alert('Access Denied: You only have access to BLK (Girls) registrations.');
      return;
    }

    // 1. Instant Optimistic UI Update (0ms)
    const updatedChild: Registration = {
      ...child,
      cardStatus: 'ISSUED',
      accompanyingPersonsCount: count,
      cardIssuedAt: new Date().toISOString(),
    };

    // Invalidate search cache
    searchCacheRef.current.clear();

    // Optimistically update station roster
    setStationRoster((prev) =>
      prev.map((r) => (r.id === child.id ? updatedChild : r))
    );

    // Update recent issuances immediately
    setRecentIssuances((prev) => {
      const next = [updatedChild, ...prev.filter((r) => r.id !== child.id)].slice(0, 5);
      try {
        sessionStorage.setItem('recent_issued_cards', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Optimistically update search results
    setResults((prev) =>
      prev.map((r) => (r.id === child.id ? updatedChild : r))
    );

    // Instant confirmation feedback
    setFeedback({
      type: 'success',
      message: `⚡ કાર્ડ અપાઈ ગયું! Card issued for ${child.fullName} (+${count} companions)!`,
    });

    // If single result or exact code, clear search for next child; if siblings exist, keep them visible
    if (results.length <= 1) {
      clearSearch();
    } else {
      focusSearchInput();
    }

    // 2. Atomic Background Server Write (Non-blocking)
    issueCard(child.id, count, child.vistar).catch((err: unknown) => {
      console.error('Failed to issue card in background:', err);
      const msg = err instanceof Error ? err.message : 'Failed to issue card.';
      setFeedback({
        type: 'error',
        message: `⚠️ Server Error: Could not issue card for ${child.fullName}: ${msg}`,
      });
      // Rollback recent list if failed
      setRecentIssuances((prev) => prev.filter((r) => r.id !== child.id));
    });
  };

  // Optimistic Card Reversal (0ms)
  const handleReverseCard = (child: Registration) => {
    // Enforce department access boundary
    if (categoryAccess === 'BAL_ONLY' && child.category !== 'BAL') {
      alert('Access Denied: You only have access to BAL (Boys) registrations.');
      return;
    }
    if (categoryAccess === 'BLK_ONLY' && child.category !== 'BLK') {
      alert('Access Denied: You only have access to BLK (Girls) registrations.');
      return;
    }

    if (!confirm(`Are you sure you want to reverse card issuance for ${child.fullName}?`)) return;

    searchCacheRef.current.clear();

    // Optimistically update station roster
    setStationRoster((prev) =>
      prev.map((r) => (r.id === child.id ? { ...r, cardStatus: 'NOT_ISSUED' } : r))
    );

    // Optimistically update recent list
    setRecentIssuances((prev) => {
      const next = prev.filter((r) => r.id !== child.id);
      try {
        sessionStorage.setItem('recent_issued_cards', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Update local state if currently selected
    if (selectedChild?.id === child.id) {
      setSelectedChild({ ...selectedChild, cardStatus: 'NOT_ISSUED' });
    }

    setFeedback({
      type: 'success',
      message: `Card for ${child.fullName} reversed back to Not Issued.`,
    });

    // Refresh search results if searching
    if (searchTerm.trim()) {
      setResults((prev) =>
        prev.map((r) => (r.id === child.id ? { ...r, cardStatus: 'NOT_ISSUED' } : r))
      );
    }

    // Background server call
    reverseCard(child.id, child.vistar).catch((err: unknown) => {
      console.error('Failed to reverse card:', err);
      const msg = err instanceof Error ? err.message : 'Failed to reverse card.';
      setFeedback({ type: 'error', message: msg });
    });
  };

  // Optimistic Companion Count Update (0ms)
  const handleUpdateCompanions = () => {
    if (!selectedChild) return;
    const targetChild = selectedChild;

    // Enforce department access boundary
    if (categoryAccess === 'BAL_ONLY' && targetChild.category !== 'BAL') {
      alert('Access Denied: You only have access to BAL (Boys) registrations.');
      return;
    }
    if (categoryAccess === 'BLK_ONLY' && targetChild.category !== 'BLK') {
      alert('Access Denied: You only have access to BLK (Girls) registrations.');
      return;
    }

    const newCount = editCount;

    searchCacheRef.current.clear();

    // Optimistically update station roster
    setStationRoster((prev) =>
      prev.map((r) => (r.id === targetChild.id ? { ...r, accompanyingPersonsCount: newCount } : r))
    );

    // Optimistically update recent list
    setRecentIssuances((prev) => {
      const next = prev.map((r) =>
        r.id === targetChild.id ? { ...r, accompanyingPersonsCount: newCount } : r
      );
      try {
        sessionStorage.setItem('recent_issued_cards', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setSelectedChild({ ...targetChild, accompanyingPersonsCount: newCount });
    setEditCompanionsModalOpen(false);

    setFeedback({
      type: 'success',
      message: `Accompanying persons count updated to ${newCount}.`,
    });

    // Refresh list if searching
    if (searchTerm.trim()) {
      setResults((prev) =>
        prev.map((r) => (r.id === targetChild.id ? { ...r, accompanyingPersonsCount: newCount } : r))
      );
    }

    // Background server call
    updateAccompanyingCount(targetChild.id, newCount, targetChild.vistar).catch((err: unknown) => {
      console.error('Failed to update companions count:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update companions count.';
      setFeedback({ type: 'error', message: msg });
    });
  };

  // Keyboard shortcuts for laptop / desktop volunteers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If edit companions modal is open
      if (editCompanionsModalOpen) {
        if (e.key === 'Escape') {
          setEditCompanionsModalOpen(false);
        } else if (e.key >= '0' && e.key <= '9') {
          setEditCount(parseInt(e.key, 10));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleUpdateCompanions();
        }
        return;
      }

      // If station modal is open
      if (stationModalOpen) {
        if (e.key === 'Escape') setStationModalOpen(false);
        return;
      }

      // Direct 1-tap Enter to issue first unissued matching child
      if (e.key === 'Enter' && filteredResults.length > 0) {
        const firstUnissued = filteredResults.find((c) => c.cardStatus !== 'ISSUED');
        if (firstUnissued) {
          e.preventDefault();
          const count = companionCounts[firstUnissued.id] ?? 0;
          handleDirectIssue(firstUnissued, count);
          return;
        }
      }

      // Quick focus search input
      const isSearchFocused =
        document.activeElement === searchInputRef.current ||
        document.activeElement === mobileSearchInputRef.current;

      if (e.key === '/' && !isSearchFocused) {
        e.preventDefault();
        focusSearchInput();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearchInput();
      } else if (e.key === 'Escape' && isSearchFocused) {
        if (searchTerm) {
          clearSearch();
        } else {
          searchInputRef.current?.blur();
          mobileSearchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editCompanionsModalOpen, editCount, stationModalOpen, searchTerm, filteredResults, companionCounts]);

  const displayedRecent = recentIssuances.filter(
    (r) => !selectedVistar || !r.vistar || r.vistar === selectedVistar
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-12">
      <StaffNavbar />

      {/* Live Ground Broadcast Notice from Admin */}
      {broadcast.active && (
        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-transparent border-b border-amber-300 px-4 py-2 text-xs flex items-center gap-2 sticky top-11 sm:top-14 z-30 shadow-2xs">
          <Radio className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
          <span className="font-black text-amber-800 text-[11px] uppercase tracking-wider">Notice:</span>
          <span className="text-slate-900 font-semibold truncate text-xs">{broadcast.message}</span>
        </div>
      )}

      {/* If No Area is Selected, First Ask for Area (MANDATORY AREA SELECTION GATE) */}
      {!selectedVistar ? (
        <main className="flex-1 max-w-md md:max-w-3xl lg:max-w-4xl w-full mx-auto px-4 py-6 sm:py-12 flex flex-col justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
              🏛️
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white mb-2 shadow-xs"
              style={{ backgroundColor: selectedCategory === 'BAL' ? '#2563EB' : '#E11D48' }}
            >
              <span>{selectedCategory === 'BAL' ? '👦 BAL Vibhag' : '👧 BLK Vibhag'}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mb-2 font-display">
              વિસ્તાર પસંદ કરો (Select Station Area)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium max-w-md mx-auto">
              તમે જે વિસ્તારના કાઉન્ટર પર સેવા આપી રહ્યા છો તે પસંદ કરો (Choose your active desk station):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
              {/* Chandlodiya Station Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedVistar('CHANDLODIYA');
                  try {
                    sessionStorage.setItem('volunteer_active_vistar', 'CHANDLODIYA');
                  } catch {}
                  clearSearch();
                }}
                className="w-full p-5 sm:p-6 rounded-2xl bg-white border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 active:scale-[0.98] tap-bounce transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏛️</span>
                      <div>
                        <span className="font-black text-lg sm:text-xl text-slate-900 group-hover:text-purple-900 block leading-tight">
                          ચાંદલોડિયા (Chandlodiya)
                        </span>
                        <span className="text-xs text-purple-700 font-bold">શનિવારનો ઉત્સવ • Saturday</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-purple-800 group-hover:translate-x-1 transition-transform bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200">
                      પસંદ કરો ➜
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-purple-950 font-black">
                      <span>📅 ૩૧/૧૦/૨૦૨૬ (શનિવાર)</span>
                      <span>•</span>
                      <span>⏰ સાંજે ૫:૦૦ થી ૮:૦૦</span>
                    </div>
                    <div className="text-slate-600 text-xs font-medium flex items-center gap-1">
                      <span>📍</span>
                      <span>BAPS સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-purple-800 font-bold">
                  <span>Registration Codes:</span>
                  <span className="font-mono bg-purple-100 px-2 py-0.5 rounded">C-1, C-2, C-3...</span>
                </div>
              </button>

              {/* Vadaj Station Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedVistar('VADAJ');
                  try {
                    sessionStorage.setItem('volunteer_active_vistar', 'VADAJ');
                  } catch {}
                  clearSearch();
                }}
                className="w-full p-5 sm:p-6 rounded-2xl bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 active:scale-[0.98] tap-bounce transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏛️</span>
                      <div>
                        <span className="font-black text-lg sm:text-xl text-slate-900 group-hover:text-blue-900 block leading-tight">
                          વાડજ (Vadaj)
                        </span>
                        <span className="text-xs text-blue-700 font-bold">રવિવારનો ઉત્સવ • Sunday</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-800 group-hover:translate-x-1 transition-transform bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200">
                      પસંદ કરો ➜
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-blue-950 font-black">
                      <span>📅 ૦૧/૧૧/૨૦૨૬ (રવિવાર)</span>
                      <span>•</span>
                      <span>⏰ સાંજે ૫:૦૦ થી ૮:૦૦</span>
                    </div>
                    <div className="text-slate-600 text-xs font-medium flex items-center gap-1">
                      <span>📍</span>
                      <span>BAPS સ્વામિનારાયણ સંસ્કારધામ, વાડજ</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-blue-800 font-bold">
                  <span>Registration Codes:</span>
                  <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">V-1, V-2, V-3...</span>
                </div>
              </button>
            </div>

            {categoryAccess === 'BOTH' && (
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-2">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Department Access:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === 'BAL' ? 'BLK' : 'BAL')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-800 border border-slate-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Switch to {selectedCategory === 'BAL' ? '👧 Balika (BLK)' : '👦 Bal (BAL)'}</span>
                </button>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* SCREEN 2: VOLUNTEER PANEL (SHOWS ONLY THAT AREA'S DETAILS ONLY) */
        <>
          <div className="sticky top-11 sm:top-14 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
            {/* Mobile Bar (< lg) */}
            <div className="lg:hidden max-w-xl mx-auto px-3 sm:px-4 pt-2 pb-2">
              {/* Compact Unified Control Line (Station Selector + Walk-in Button) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Station & Vibhag Selector Chip (Click to Switch) */}
                <button
                  type="button"
                  onClick={() => setStationModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 active:scale-95 transition-all text-left shadow-2xs cursor-pointer group"
                  title="Click to switch area or department"
                >
                  <span className="text-xs">🏛️</span>
                  <span className="text-xs font-black text-slate-900">
                    {selectedVistar === 'CHANDLODIYA' ? 'ચાંદલોડિયા' : 'વાડજ'}
                  </span>
                  <span className="text-slate-400 font-bold">•</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide ${
                    activeScope === 'BAL' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {activeScope === 'BAL' ? '👦 BAL' : '👧 BLK'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                </button>

                {/* Right Action Control: Quick Walk-in */}
                <Link
                  to={`/volunteer/quick-register?category=${selectedCategory}&vistar=${selectedVistar}${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Walk-in</span>
                </Link>
              </div>

              {/* High-Performance Mobile Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="કોડ નંબર (દા.ત. 42), નામ કે મોબાઈલથી શોધો..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 rounded-xl text-slate-900 text-sm sm:text-base font-bold placeholder-slate-400 focus:outline-none transition-all shadow-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 active:scale-90 transition-transform cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Laptop & Desktop Bar (>= lg) */}
            <div className="hidden lg:flex items-center justify-between gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              {/* Station selector */}
              <button
                type="button"
                onClick={() => setStationModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all text-left shadow-2xs cursor-pointer group shrink-0"
                title="Click to switch area or department"
              >
                <span className="text-xl">🏛️</span>
                <div>
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-sm font-black text-slate-900">
                      {selectedVistar === 'CHANDLODIYA' ? 'ચાંદલોડિયા (Chandlodiya)' : 'વાડજ (Vadaj)'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                      activeScope === 'BAL' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {activeScope === 'BAL' ? '👦 BAL' : '👧 BLK'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    {selectedVistar === 'CHANDLODIYA' ? '📅 ૩૧/૧૦ શનિવાર • ૫:૦૦-૮:૦૦' : '📅 ૦૧/૧૧ રવિવાર • ૫:૦૦-૮:૦૦'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-800 ml-1 transition-colors" />
              </button>

              {/* Large Desktop Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="કોડ (દા.ત. 42), નામ કે મોબાઈલથી શોધો (Search by Code, Name, or Mobile)..."
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 rounded-xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:outline-none transition-all shadow-xs"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="text-slate-400 hover:text-slate-700 p-1 transition-transform cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                        <X className="w-3 h-3" />
                      </div>
                    </button>
                  ) : (
                    <span className="hidden xl:inline-block px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-mono font-bold text-slate-400">
                      / to search
                    </span>
                  )}
                </div>
              </div>

              {/* Walk-in Button */}
              <Link
                to={`/volunteer/quick-register?category=${selectedCategory}&vistar=${selectedVistar}${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-black shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Walk-in Registration</span>
              </Link>
            </div>
          </div>

          <main className="flex-1 max-w-xl lg:max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 flex flex-col">
            {/* Feedback Alert Toast */}
            {feedback && (
              <div className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold shadow-md animate-fadeIn ${
                feedback.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="leading-snug">{feedback.message}</span>
                </div>
                <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Laptop 2-Column Grid (Main Workspace + Sticky Sidebar) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Left Column (Primary Workspace: Search Results & Quick Entry) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Searching Activity Indicator */}
                {searching && (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-amber-800 font-bold bg-white rounded-xl border border-slate-200 shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Searching registrations in {selectedCategory}...</span>
                  </div>
                )}

                {/* No Results Fallback with 1-Tap Walk-In Pre-Fill */}
                {!searching && searchTerm.trim() && results.length === 0 && (
                  <div className="py-10 px-6 text-center text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-lg font-black text-slate-900">No Registration Found</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-5 leading-relaxed max-w-md mx-auto">
                      No matching child for <span className="font-bold text-amber-800">"{searchTerm}"</span> in {selectedVistar === 'CHANDLODIYA' ? 'Chandlodiya' : 'Vadaj'} ({selectedCategory} Vibhag).
                    </p>
                    <Link
                      to={`/volunteer/quick-register?search=${encodeURIComponent(searchTerm.trim())}&category=${selectedCategory}&vistar=${selectedVistar}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Walk-in Register This Child Now ➔</span>
                    </Link>
                  </div>
                )}

                {/* Search Results Display */}
                {results.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                          Matching Children ({results.length})
                        </span>
                        <span className="text-[11px] text-amber-800 font-bold hidden sm:inline">
                          • Click button to issue card
                        </span>
                      </div>

                      {/* Quick Card Print Filter Pills (Shown only if both printed & manual cards exist) */}
                      {printedCount > 0 && nonPrintedCount > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setCardFilter('ALL')}
                            className={`px-2.5 py-1 rounded-lg font-black text-xs border transition-all cursor-pointer shrink-0 ${
                              cardFilter === 'ALL'
                                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            બધા ({results.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardFilter('PRINTED')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs border transition-all cursor-pointer shrink-0 ${
                              cardFilter === 'PRINTED'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
                            }`}
                          >
                            <span>🖨️</span>
                            <span>પ્રિન્ટેડ ({printedCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardFilter('NON_PRINTED')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs border transition-all cursor-pointer shrink-0 ${
                              cardFilter === 'NON_PRINTED'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'
                            }`}
                          >
                            <span>✍️</span>
                            <span>બ્લેન્ક ({nonPrintedCount})</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {filteredResults.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
                        <span>આ ફિલ્ટરમાં કોઈ પરિણામ નથી ({cardFilter === 'PRINTED' ? 'No printed cards' : 'No non-printed manual cards'}). </span>
                        <button
                          type="button"
                          onClick={() => setCardFilter('ALL')}
                          className="text-amber-700 font-bold underline ml-1 cursor-pointer"
                        >
                          બધા કાર્ડ જુઓ
                        </button>
                      </div>
                    ) : (
                      /* Responsive Grid: 1 column on mobile, 2 columns on Laptop for maximum scannability */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                        {filteredResults.map((child) => {
                          const isPrinted = isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings);
                          const isIssued = child.cardStatus === 'ISSUED';

                          return (
                            <div
                              key={child.id}
                              className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-left shadow-xs flex flex-col justify-between ${
                                isIssued
                                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                                  : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
                              }`}
                            >
                              <div>
                                {/* Header: Registration Code & Box/Blank Badge */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="font-mono text-amber-950 font-black bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md text-xs tracking-wider">
                                    {child.registrationCode}
                                  </span>

                                  {isPrinted ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span>🖨️ Box Card</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                      <span>✍️ Blank Card</span>
                                    </span>
                                  )}
                                </div>

                                {/* Child Name */}
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
                                  {child.fullName}
                                </h3>

                                {/* Contact & Address */}
                                <div className="mt-2 space-y-1 text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <a
                                      href={`tel:${child.mobileNumber}`}
                                      className="font-mono font-bold text-slate-700 hover:text-slate-950 underline decoration-slate-300"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {child.mobileNumber}
                                    </a>
                                  </div>

                                  {(child.houseNumber || child.societyName || child.area) && (
                                    <div className="flex items-start gap-1.5 text-slate-600 font-medium">
                                      <span className="text-slate-400 shrink-0">📍</span>
                                      <span className="line-clamp-2">
                                        {[child.houseNumber, child.societyName, child.area].filter(Boolean).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Direct Card Issuance Controls (Inline in Search - No Modal/Tab Needed) */}
                              <div className="mt-3.5 pt-3 border-t border-slate-200">
                                {!isIssued ? (
                                  <div className="space-y-2.5">
                                    {/* Operational Card Guidance (Box vs Blank Card) */}
                                    {isPrinted ? (
                                      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-2">
                                        <span className="text-base shrink-0 leading-none mt-0.5">🖨️</span>
                                        <div className="text-[11px] sm:text-xs leading-snug">
                                          <span className="font-black text-emerald-800">પ્રિન્ટેડ બોક્સ કાર્ડ: </span>
                                          <span>બોક્સમાંથી <strong className="font-mono bg-white text-emerald-950 px-1 py-0.5 rounded border border-emerald-300">{child.registrationCode}</strong> શોધીને આપો.</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-2">
                                        <span className="text-base shrink-0 leading-none mt-0.5">✍️</span>
                                        <div className="text-[11px] sm:text-xs leading-snug">
                                          <span className="font-black text-rose-800">મેન્યુઅલ કોરું કાર્ડ: </span>
                                          <span>કોરા કાર્ડમાં કોડ <strong className="font-mono bg-white text-rose-950 px-1 py-0.5 rounded border border-rose-300">{child.registrationCode}</strong> અને નામ લખો.</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Accompanying Persons Count (Companions) Quick Selector */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1 text-xs">
                                        <span className="font-black text-slate-700 flex items-center gap-1">
                                          <Users className="w-3.5 h-3.5 text-amber-600" />
                                          <span>સાથે વ્યક્તિ (Companions):</span>
                                        </span>
                                        <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-300">
                                          {(companionCounts[child.id] ?? 0) === 0 ? '0 (માત્ર બાળક)' : `+${companionCounts[child.id] ?? 0} વ્યક્તિ`}
                                        </span>
                                      </div>

                                      {/* Quick Chips: 0, 1, 2, 3, 4 + Stepper */}
                                      <div className="grid grid-cols-6 gap-1">
                                        {[0, 1, 2, 3, 4].map((num) => {
                                          const count = companionCounts[child.id] ?? 0;
                                          const isSelected = count === num;
                                          return (
                                            <button
                                              key={num}
                                              type="button"
                                              onClick={() => setChildCompanionCount(child.id, num)}
                                              className={`py-1.5 rounded-xl font-black text-xs transition-all border active:scale-95 cursor-pointer ${
                                                isSelected
                                                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs ring-2 ring-amber-400/40 font-extrabold'
                                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                              }`}
                                            >
                                              {num === 0 ? '0' : `+${num}`}
                                            </button>
                                          );
                                        })}
                                        {/* Stepper adjustment */}
                                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-1">
                                          <button
                                            type="button"
                                            onClick={() => setChildCompanionCount(child.id, Math.max(0, (companionCounts[child.id] ?? 0) - 1))}
                                            className="w-4 h-6 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                                            title="Minus"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="text-[11px] font-black text-amber-800">
                                            {companionCounts[child.id] ?? 0}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setChildCompanionCount(child.id, (companionCounts[child.id] ?? 0) + 1)}
                                            className="w-4 h-6 text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                                            title="Plus"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Direct 1-Tap Issue Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDirectIssue(child, companionCounts[child.id] ?? 0)}
                                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-black tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                                      <span>કાર્ડ આપો • ISSUE (+{companionCounts[child.id] ?? 0})</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2 bg-emerald-100/70 border border-emerald-300 rounded-xl p-2.5">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>કાર્ડ આપેલ છે (+{child.accompanyingPersonsCount})</span>
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedChild(child);
                                          setEditCount(child.accompanyingPersonsCount || 0);
                                          setEditCompanionsModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 shadow-2xs cursor-pointer"
                                      >
                                        Edit (+{child.accompanyingPersonsCount})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReverseCard(child)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 cursor-pointer"
                                      >
                                        Reverse
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State / Welcome Screen when no search term */}
                {!searching && !searchTerm.trim() && (
                  <div className="space-y-4">
                    {/* Quick Walk-in Banner */}
                    <Link
                      to={`/volunteer/quick-register?category=${selectedCategory}&vistar=${selectedVistar}`}
                      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-100/80 via-amber-50 to-white border border-amber-300 hover:border-amber-400 flex items-center justify-between active:scale-[0.99] transition-all shadow-xs group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform shrink-0">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors uppercase tracking-wider">
                            On-The-Spot Walk-in Registration
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Fast child registration &amp; instant card issuance for {selectedVistar === 'CHANDLODIYA' ? 'Chandlodiya' : 'Vadaj'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </Link>

                    {/* Counter Instructions Card */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-base font-black text-slate-900">
                        Ready for {selectedVistar === 'CHANDLODIYA' ? 'Chandlodiya' : 'Vadaj'} Counter Search
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                        Type child's name, 10-digit mobile number, or registration code (e.g. "42" or "{selectedVistar === 'CHANDLODIYA' ? 'C-1042' : 'V-0042'}") into the search bar above.
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
                        <span>⌨️ Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">[/]</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">[Ctrl+K]</kbd> to search</span>
                        <span>•</span>
                        <span>⚡ Search-as-you-type</span>
                      </div>
                    </div>

                    {/* Mobile-only recent issuances list (shown on mobile when no search query) */}
                    <div className="lg:hidden">
                      {displayedRecent.length > 0 && (
                        <div className="space-y-2.5 text-left">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-amber-600" />
                              <span>Recently Issued ({displayedRecent.length})</span>
                            </span>
                            <span className="text-[10px] text-slate-500">Fast 1-tap correction</span>
                          </div>

                          {displayedRecent.map((child) => (
                            <div
                              key={child.id}
                              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-black text-slate-900 truncate">
                                    {child.fullName}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
                                    <span className="font-mono text-amber-900 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                                      {child.registrationCode}
                                    </span>
                                    {isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings) ? (
                                      <span className="text-[10px] text-emerald-700 font-bold">🖨️ Box</span>
                                    ) : (
                                      <span className="text-[10px] text-rose-700 font-bold">✍️ Blank</span>
                                    )}
                                    <span className="font-mono text-[10px] text-slate-500">{child.mobileNumber}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChild(child);
                                      setEditCount(child.accompanyingPersonsCount || 0);
                                      setEditCompanionsModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-300 cursor-pointer"
                                  >
                                    <Users className="w-3 h-3 text-amber-600" />
                                    <span>+{child.accompanyingPersonsCount}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReverseCard(child)}
                                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                                    title="Reverse Card to Not Issued"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Persistent Laptop Command Sidebar (Guide + Live Recent Issuances) */}
              <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4 text-left">
                {/* Station Info & Card Legend Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏛️</span>
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {selectedVistar === 'CHANDLODIYA' ? 'ચાંદલોડિયા (Chandlodiya)' : 'વાડજ (Vadaj)'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {selectedVistar === 'CHANDLODIYA' ? 'શનિવાર ૩૧/૧૦' : 'રવિવાર ૦૧/૧૧'} • સાંજે ૫:૦૦-૮:૦૦
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      selectedCategory === 'BAL' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {selectedCategory === 'BAL' ? '👦 BAL' : '👧 BLK'}
                    </span>
                  </div>

                  {/* Card Distribution Guide */}
                  <div className="space-y-2 text-xs">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      Card Distribution Guide:
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                      <span className="text-base shrink-0">🖨️</span>
                      <div className="text-[11px] leading-snug">
                        <strong className="font-bold text-emerald-800">Box Card:</strong> Pre-printed laminated card is in the station box. Find by code and issue.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
                      <span className="text-base shrink-0">✍️</span>
                      <div className="text-[11px] leading-snug">
                        <strong className="font-bold text-rose-800">Blank Card:</strong> Take a blank card, write Code &amp; Child Name with permanent marker.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Recent Issuances Stream */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Recent Issuances ({displayedRecent.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">1-click edit / undo</span>
                  </div>

                  {displayedRecent.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <span>No cards issued in this session yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                      {displayedRecent.map((child) => (
                        <div
                          key={child.id}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-black text-slate-900 truncate">
                                {child.fullName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="font-mono text-amber-900 font-bold bg-amber-100/70 px-1 py-0.2 rounded">
                                  {child.registrationCode}
                                </span>
                                {isCardPrePrinted(child.registrationCode, child.category, child.vistar, printingSettings) ? (
                                  <span className="text-emerald-700 font-bold">🖨️ Box</span>
                                ) : (
                                  <span className="text-rose-700 font-bold">✍️ Blank</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChild(child);
                                  setEditCount(child.accompanyingPersonsCount || 0);
                                  setEditCompanionsModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 active:scale-95 text-slate-700 text-[10px] font-bold border border-slate-300 shadow-2xs flex items-center gap-0.5 cursor-pointer"
                                title="Edit Accompanying Persons Count"
                              >
                                <Users className="w-2.5 h-2.5 text-amber-600" />
                                <span>+{child.accompanyingPersonsCount}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReverseCard(child)}
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                                title="Reverse Card to Not Issued"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </main>
        </>
      )}

      {/* MODAL: Edit Companions Count (Bottom Sheet on Mobile, Centered Dialog on Laptop) */}
      {editCompanionsModalOpen && selectedChild && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setEditCompanionsModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-lg sm:max-w-xl rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-blue-500 p-5 sm:p-6 shadow-2xl text-left animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-8 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle on Mobile */}
            <div className="sm:hidden w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                  Edit Companions
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {selectedChild.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditCompanionsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  New Accompanying Count (Excluding child)
                </label>
                <span className="text-[11px] font-bold text-blue-700">
                  Selected: {editCount === 0 ? 'Child only (0)' : `+${editCount} companions`}
                </span>
              </div>

              {/* 0 to 9 Numbers Grid */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEditCount(num)}
                    className={`h-12 rounded-xl font-black transition-all border active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                      editCount === num
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg font-black leading-none">{num}</span>
                    <span className="text-[9px] font-bold opacity-75 mt-0.5 leading-none">
                      {num === 0 ? 'Only' : `+${num}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Stepper adjustment */}
              <div className="flex items-center justify-between bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">10+ or Custom Count:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditCount(Math.max(0, editCount - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold active:scale-90 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-black text-blue-800 w-8 text-center">{editCount}</span>
                  <button
                    type="button"
                    onClick={() => setEditCount(editCount + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold active:scale-90 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditCompanionsModalOpen(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateCompanions}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Save Companions Count ({editCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Station Switcher Modal (Area & Vibhag) */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">સ્ટેશન સેટિંગ્સ (Station Settings)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">વિસ્તાર અને વિભાગ બદલો</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStationModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Switcher */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-2">
                વિસ્તાર (Area):
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVistar('CHANDLODIYA');
                    try {
                      sessionStorage.setItem('volunteer_active_vistar', 'CHANDLODIYA');
                    } catch {}
                    clearSearch();
                    setStationModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedVistar === 'CHANDLODIYA'
                      ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-xs text-slate-900">🏛️ ચાંદલોડિયા (Chandlodiya)</div>
                    <div className="text-[10px] text-purple-700 font-bold">શનિવાર ૩૧/૧૦ • સાંજે ૫:૦૦ થી ૮:૦૦</div>
                  </div>
                  {selectedVistar === 'CHANDLODIYA' && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVistar('VADAJ');
                    try {
                      sessionStorage.setItem('volunteer_active_vistar', 'VADAJ');
                    } catch {}
                    clearSearch();
                    setStationModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedVistar === 'VADAJ'
                      ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-xs text-slate-900">🏛️ વાડજ (Vadaj)</div>
                    <div className="text-[10px] text-blue-700 font-bold">રવિવાર ૦૧/૧૧ • સાંજે ૫:૦૦ થી ૮:૦૦</div>
                  </div>
                  {selectedVistar === 'VADAJ' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Department Switcher (if role allows BOTH) or Locked Banner */}
            {categoryAccess === 'BOTH' ? (
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-2">
                  વિભાગ (Department):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('BAL');
                      clearSearch();
                      setStationModalOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedCategory === 'BAL'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>👦 BAL</span>
                    {selectedCategory === 'BAL' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('BLK');
                      clearSearch();
                      setStationModalOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedCategory === 'BLK'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>👧 BLK</span>
                    {selectedCategory === 'BLK' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                  વિભાગ (Assigned Department):
                </label>
                <div className={`p-2.5 rounded-xl border font-black text-xs flex items-center justify-between ${
                  categoryAccess === 'BAL_ONLY'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <span>{categoryAccess === 'BAL_ONLY' ? '👦 BAL Vibhag' : '👧 BLK Vibhag'}</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    🔒 Assigned Access
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
