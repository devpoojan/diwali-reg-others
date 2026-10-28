import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Check, 
  Building2, 
  Users, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Layers,
  Search
} from 'lucide-react';
import type { Registration, Vistar, DepartmentCategory } from '@/types';
import { 
  exportFilteredToExcel, 
  exportAllRegistrationsToExcel, 
  filterRegistrationsForExport 
} from '@/services/excelExportService';
import { normalizeAreaName } from '@/services/areaReportService';
import { getCardPrintingSettings, type CardPrintingSettings } from '@/services/cardPrintingService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVistar?: Vistar | 'COMBINED';
  initialCategory?: DepartmentCategory | 'ALL';
  initialArea?: string | 'ALL';
  initialRecords?: Registration[];
  printingSettings?: CardPrintingSettings | null;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  initialVistar = 'COMBINED',
  initialCategory = 'ALL',
  initialArea = 'ALL',
  initialRecords,
  printingSettings: propPrintingSettings,
}) => {
  // Filter States
  const [vistar, setVistar] = useState<Vistar | 'COMBINED'>(initialVistar);
  const [category, setCategory] = useState<DepartmentCategory | 'ALL'>(initialCategory);
  
  // Multi-Area Selection State
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    initialArea && initialArea !== 'ALL' ? [initialArea] : ['ALL']
  );
  const [splitByArea, setSplitByArea] = useState<boolean>(false);
  const [splitByDepartment, setSplitByDepartment] = useState<boolean>(false);
  const [areaSearch, setAreaSearch] = useState<string>('');

  // Async data states
  const [records, setRecords] = useState<Registration[]>(initialRecords || []);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [printingSettings, setPrintingSettings] = useState<CardPrintingSettings | null>(propPrintingSettings || null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setVistar(initialVistar);
      setCategory(initialCategory);
      setSelectedAreas(initialArea && initialArea !== 'ALL' ? [initialArea] : ['ALL']);
      setSplitByArea(false);
      setSplitByDepartment(false);
      setAreaSearch('');
      setExportSuccess(null);

      if (initialRecords && initialRecords.length > 0) {
        setRecords(initialRecords);
      } else {
        fetchRegistrations();
      }

      if (!printingSettings) {
        getCardPrintingSettings().then(setPrintingSettings).catch(() => {});
      }
    }
  }, [isOpen, initialVistar, initialCategory, initialArea, initialRecords]);

  // Fetch from Firestore if not provided
  const fetchRegistrations = async () => {
    setLoadingRecords(true);
    try {
      const targetCols: ('chandlodiya' | 'vadaj')[] = ['chandlodiya', 'vadaj'];
      const promises = targetCols.map(async (colName) => {
        const colRef = collection(db, colName);
        const q = query(colRef, where('isDeleted', '==', false));
        const snap = await getDocs(q);
        const areaName: Vistar = colName === 'chandlodiya' ? 'CHANDLODIYA' : 'VADAJ';
        return snap.docs
          .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
          .map((d) => ({
            ...d.data(),
            id: d.id,
            vistar: (d.data() as Registration).vistar || areaName,
          })) as Registration[];
      });

      const results = await Promise.all(promises);
      const combined = results.flat();

      if (combined.length > 0) {
        setRecords(combined);
      } else {
        const legacyRef = collection(db, 'registrations');
        const q = query(legacyRef, where('isDeleted', '==', false));
        const snap = await getDocs(q);
        setRecords(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[]);
      }
    } catch (err) {
      console.error('Failed to fetch records for Excel export:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Extract distinct areas sorted by frequency
  const availableAreas = useMemo(() => {
    const areaCountMap = new Map<string, { name: string; gujarati: string; count: number }>();

    // Filter by selected vistar first to show relevant areas
    const baseRecords = vistar === 'COMBINED' 
      ? records 
      : records.filter((r) => r.vistar === vistar);

    for (const reg of baseRecords) {
      const norm = normalizeAreaName(reg.area);
      const existing = areaCountMap.get(norm.name) || { name: norm.name, gujarati: norm.gujarati, count: 0 };
      existing.count += 1;
      areaCountMap.set(norm.name, existing);
    }

    return Array.from(areaCountMap.values()).sort((a, b) => b.count - a.count);
  }, [records, vistar]);

  // Filtered area chips based on micro search
  const filteredAreaChips = useMemo(() => {
    if (!areaSearch.trim()) return availableAreas;
    const q = areaSearch.trim().toLowerCase();
    return availableAreas.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.gujarati && a.gujarati.toLowerCase().includes(q))
    );
  }, [availableAreas, areaSearch]);

  // Toggle individual area in multi-select
  const toggleArea = (areaName: string) => {
    if (areaName === 'ALL') {
      setSelectedAreas(['ALL']);
      return;
    }

    setSelectedAreas((prev) => {
      const withoutAll = prev.filter((a) => a !== 'ALL');
      if (withoutAll.includes(areaName)) {
        const next = withoutAll.filter((a) => a !== areaName);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...withoutAll, areaName];
      }
    });
  };

  // Filtered preview calculations
  const filteredRecords = useMemo(() => {
    return filterRegistrationsForExport(
      records,
      {
        vistar,
        category,
        areas: selectedAreas,
      },
      printingSettings
    );
  }, [records, vistar, category, selectedAreas, printingSettings]);

  const summaryStats = useMemo(() => {
    const total = filteredRecords.length;
    const bal = filteredRecords.filter((r) => r.category === 'BAL').length;
    const blk = filteredRecords.filter((r) => r.category === 'BLK').length;

    // Projected sheet count
    const isAllAreas = selectedAreas.includes('ALL') || selectedAreas.length === 0;
    let projectedSheets = 1;
    if (splitByArea && (!isAllAreas || selectedAreas.length > 1)) {
      projectedSheets = 1 + (isAllAreas ? availableAreas.length : selectedAreas.length);
    } else if (splitByDepartment && category === 'ALL') {
      projectedSheets = 3;
    } else if (isAllAreas || selectedAreas.length > 1) {
      projectedSheets = 2;
    }

    return { total, bal, blk, projectedSheets };
  }, [filteredRecords, selectedAreas, splitByArea, splitByDepartment, category, availableAreas.length]);

  // Handle Export Filtered Excel
  const handleExportFiltered = async () => {
    setExporting(true);
    setExportSuccess(null);
    try {
      const res = await exportFilteredToExcel({
        vistar,
        category,
        areas: selectedAreas,
        splitByArea,
        splitByDepartment,
        customRecords: records,
        printingSettings,
      });

      setExportSuccess(`Downloaded "${res.fileName}" (${res.count} records)!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle Export Master 6-Sheet Workbook
  const handleExportMaster = async () => {
    setExporting(true);
    setExportSuccess(null);
    try {
      const res = await exportAllRegistrationsToExcel({
        customRecords: records,
        printingSettings,
      });

      setExportSuccess(`Downloaded Master 6-Sheet Workbook (${res.count} records)!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export master error:', err);
      alert('Failed to export Master Workbook.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const isAllAreasSelected = selectedAreas.includes('ALL');

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-slate-200 p-4 sm:p-6 shadow-2xl text-left animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-tight truncate">
                Export to Excel (.xlsx)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                Download single/multiple areas, department splits & rosters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-1 text-xs -mr-1">
          {/* 1. Center / Vistar Filter */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>1. Center / Vistar (સ્થળ પસંદગી):</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setVistar('COMBINED')}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  vistar === 'COMBINED'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs ring-2 ring-amber-400/30 font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">🏢</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight">All Centers</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">બંને સ્થળ</span>
              </button>
              <button
                type="button"
                onClick={() => setVistar('CHANDLODIYA')}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  vistar === 'CHANDLODIYA'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-600/30 font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">📍</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight truncate max-w-full">Chandlodiya</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">31/10</span>
              </button>
              <button
                type="button"
                onClick={() => setVistar('VADAJ')}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  vistar === 'VADAJ'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/30 font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">🏛️</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight truncate max-w-full">Vadaj</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">01/11</span>
              </button>
            </div>
          </div>

          {/* 2. Department / Vibhag Filter */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>2. Department (વિભાગ):</span>
              </label>
              {category === 'ALL' && (
                <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 cursor-pointer active:scale-95 transition-transform">
                  <input
                    type="checkbox"
                    checked={splitByDepartment}
                    onChange={(e) => setSplitByDepartment(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>📑 Separate Tabs (Bal & Balika)</span>
                </label>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCategory('ALL')}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  category === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">👦👧</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight">Both Vibhag</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">બંને વિભાગ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('BAL');
                  setSplitByDepartment(false);
                }}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  category === 'BAL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">👦</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight">Bal (Boys)</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">બાલક</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('BLK');
                  setSplitByDepartment(false);
                }}
                className={`py-2 px-1.5 sm:px-3 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all text-center flex flex-col items-center justify-center min-h-[50px] sm:min-h-[46px] cursor-pointer ${
                  category === 'BLK'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span className="text-sm sm:text-base leading-none mb-0.5">👧</span>
                <span className="text-[11px] sm:text-xs font-black leading-tight">Balika (Girls)</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 font-medium leading-none mt-0.5">બાલિકા</span>
              </button>
            </div>
          </div>

          {/* 3. MULTI-AREA SELECTION (Supports Single, Multiple, or All Areas) */}
          <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3. Area / Locality (વિસ્તાર પસંદગી):</span>
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {!isAllAreasSelected && (
                  <button
                    type="button"
                    onClick={() => setSelectedAreas(['ALL'])}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer active:scale-95"
                  >
                    Select All Areas
                  </button>
                )}
                {/* Tab split toggle for multiple areas */}
                {(!isAllAreasSelected && selectedAreas.length > 1) && (
                  <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 cursor-pointer active:scale-95 transition-transform">
                    <input
                      type="checkbox"
                      checked={splitByArea}
                      onChange={(e) => setSplitByArea(e.target.checked)}
                      className="w-3 h-3 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>📑 1 Tab Per Area</span>
                  </label>
                )}
              </div>
            </div>

            {/* Quick Micro Search Bar for Areas */}
            {availableAreas.length > 5 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder="Filter areas by name..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {areaSearch && (
                  <button
                    type="button"
                    onClick={() => setAreaSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Area Multi-Select Chips Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-36 sm:max-h-44 overflow-y-auto pr-1">
              {/* All Areas Chip */}
              <button
                type="button"
                onClick={() => setSelectedAreas(['ALL'])}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isAllAreasSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs font-black ring-2 ring-amber-400/30'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <span>🌐 All Areas Combined</span>
                <span className="text-[10px] opacity-75">({records.length})</span>
              </button>

              {/* Individual Area Chips (Multi-Selectable) */}
              {filteredAreaChips.map((a) => {
                const isSelected = !isAllAreasSelected && selectedAreas.includes(a.name);
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => toggleArea(a.name)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/30 font-black'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{a.name}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.count}
                    </span>
                  </button>
                );
              })}

              {filteredAreaChips.length === 0 && areaSearch && (
                <div className="text-[11px] text-slate-500 italic py-1 px-2">
                  No areas matching &ldquo;{areaSearch}&rdquo;
                </div>
              )}
            </div>

            <div className="mt-2 text-[10px] text-slate-500 font-medium">
              💡 <em>Tip: Tap multiple areas to combine them (e.g., Nirnaynagar + Ognaj). Check &ldquo;1 Tab Per Area&rdquo; for separate Excel sheets.</em>
            </div>
          </div>

          {/* Live Preview Ribbon */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100/90 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Selection Preview:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  📄 {summaryStats.projectedSheets} Sheet(s)
                </span>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {summaryStats.total} Children
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Total</div>
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{summaryStats.total}</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Bal (Boys)</div>
                <div className="text-xs sm:text-sm font-black text-blue-700 mt-0.5">{summaryStats.bal}</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Balika (Girls)</div>
                <div className="text-xs sm:text-sm font-black text-rose-700 mt-0.5">{summaryStats.blk}</div>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Footer - Mobile Thumb-First Layout */}
        <div className="pt-3 border-t border-slate-200 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer text-center"
          >
            Cancel
          </button>

          {/* Download Buttons: Mobile stacks with Primary on Top */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Master 6-Sheet Workbook Button */}
            <button
              type="button"
              onClick={handleExportMaster}
              disabled={exporting || loadingRecords}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-center"
              title="Download Master Workbook with all 6 sheets"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Master 6-Sheet Book</span>
            </button>

            {/* Filtered Excel Button (Primary Action) */}
            <button
              type="button"
              onClick={handleExportFiltered}
              disabled={exporting || loadingRecords || summaryStats.total === 0}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Generating Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Excel ({summaryStats.total} Records)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

