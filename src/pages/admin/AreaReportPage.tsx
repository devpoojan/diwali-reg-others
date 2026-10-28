import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Registration, Vistar } from '@/types';
import { getVistarFromRegistrationCode } from '@/services/registrationService';
import { ExcelExportModal } from '@/components/admin/ExcelExportModal';
import { 
  generateAreaReport, 
  filterAreaRegistrations, 
  type AreaStatistics, 
  type CenterAreaReport 
} from '@/services/areaReportService';
import { 
  subscribeToCardPrintingSettings, 
  isCardPrePrinted, 
  type CardPrintingSettings 
} from '@/services/cardPrintingService';
import { 
  MapPin, 
  RefreshCw, 
  Search, 
  Download, 
  Printer, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Phone, 
  MessageSquare, 
  Eye, 
  X, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles
} from 'lucide-react';

export const AreaReportPage: React.FC = () => {
  // Center (Vistar) Selector: 'CHANDLODIYA' | 'VADAJ' | 'ALL'
  const [selectedVistar, setSelectedVistar] = useState<'CHANDLODIYA' | 'VADAJ' | 'ALL'>('CHANDLODIYA');

  // Currently selected Area Key ('ALL_AREAS' or specific area key like 'chandlodiya', 'nirnaynagar', etc.)
  const [selectedAreaKey, setSelectedAreaKey] = useState<string>('ALL_AREAS');

  // Registrations state
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Inspector Modal
  const [detailChild, setDetailChild] = useState<Registration | null>(null);

  // Filters inside children list
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'BAL' | 'BLK'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'NOT_ISSUED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'ONLINE' | 'ON_THE_SPOT'>('ALL');
  const [sortBy, setSortBy] = useState<'CODE' | 'NAME_AZ' | 'LATEST' | 'OLDEST'>('CODE');

  // Pagination
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Card Printing Settings
  const [printingSettings, setPrintingSettings] = useState<CardPrintingSettings | null>(null);

  useEffect(() => {
    const unsub = subscribeToCardPrintingSettings((s) => setPrintingSettings(s));
    return () => unsub();
  }, []);

  // Fetch all registrations from both centers
  const fetchRegistrations = async () => {
    try {
      const [chdSnap, vadSnap] = await Promise.all([
        getDocs(query(collection(db, 'chandlodiya'), where('isDeleted', '==', false), limit(2500))),
        getDocs(query(collection(db, 'vadaj'), where('isDeleted', '==', false), limit(2500))),
      ]);

      const chdList = chdSnap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({
          ...d.data(),
          id: d.id,
          vistar: 'CHANDLODIYA' as Vistar,
        })) as Registration[];

      const vadList = vadSnap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({
          ...d.data(),
          id: d.id,
          vistar: 'VADAJ' as Vistar,
        })) as Registration[];

      let list = [...chdList, ...vadList];

      // Fallback to legacy registrations collection if empty
      if (list.length === 0) {
        const regSnap = await getDocs(
          query(collection(db, 'registrations'), where('isDeleted', '==', false), limit(2500))
        );
        list = regSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[];
      }

      setAllRegistrations(list);
      setLastRefreshedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching registrations for area report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  // Reset page and selected area when center changes
  const handleSelectVistar = (v: 'CHANDLODIYA' | 'VADAJ' | 'ALL') => {
    setSelectedVistar(v);
    setSelectedAreaKey('ALL_AREAS');
    setCurrentPage(1);
    setSearchTerm('');
  };

  // Generate Area report for currently selected Center
  const report: CenterAreaReport = useMemo(() => {
    return generateAreaReport(allRegistrations, selectedVistar);
  }, [allRegistrations, selectedVistar]);

  // Overall center metrics
  const centerSummary = useMemo(() => {
    const chdTotal = allRegistrations.filter((r) => !r.isDeleted && (r.vistar === 'CHANDLODIYA' || getVistarFromRegistrationCode(r.registrationCode) === 'CHANDLODIYA')).length;
    const vadTotal = allRegistrations.filter((r) => !r.isDeleted && (r.vistar === 'VADAJ' || getVistarFromRegistrationCode(r.registrationCode) === 'VADAJ')).length;
    return { chdTotal, vadTotal, combinedTotal: chdTotal + vadTotal };
  }, [allRegistrations]);

  // Active Area statistics object
  const activeAreaStats: AreaStatistics | null = useMemo(() => {
    if (selectedAreaKey === 'ALL_AREAS') return null;
    return report.areas.find((a) => a.areaKey === selectedAreaKey) || null;
  }, [report, selectedAreaKey]);

  // Registrations in the currently active Area (or all in center if ALL_AREAS)
  const scopedRegistrations: Registration[] = useMemo(() => {
    if (selectedAreaKey === 'ALL_AREAS') {
      return allRegistrations.filter((reg) => {
        if (reg.isDeleted) return false;
        if (selectedVistar === 'ALL') return true;
        const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
        return vistar === selectedVistar;
      });
    }
    return activeAreaStats?.registrations || [];
  }, [selectedAreaKey, allRegistrations, selectedVistar, activeAreaStats]);

  // Filtered & sorted records for the table
  const filteredRegistrations = useMemo(() => {
    return filterAreaRegistrations(scopedRegistrations, {
      searchTerm,
      category: deptFilter,
      cardStatus: statusFilter,
      source: sourceFilter,
      sortBy,
    });
  }, [scopedRegistrations, searchTerm, deptFilter, statusFilter, sourceFilter, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, sourceFilter, sortBy, selectedAreaKey]);

  // Pagination calculations
  const totalItems = filteredRegistrations.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    if (pageSize === 'ALL') return filteredRegistrations;
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AdminLayout
      title="Area-Wise Registration Report"
      subtitle="Detailed locality analysis, area registration counts, and child directories across Vadaj and Chandlodiya"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Refresh from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download Excel report with custom filters"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{selectedAreaKey !== 'ALL_AREAS' ? `Export ${activeAreaStats?.displayName || 'Area'} Excel` : 'Export to Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print area roster"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Roster</span>
          </button>
        </div>
      }
    >
      {/* 1. CENTER (VISTAR) SELECTOR TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Step 1: Select Festival Center (કેન્દ્ર પસંદ કરો)</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Choose Center to Inspect Area Registrations
            </h2>
          </div>

          {lastRefreshedAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Last updated: <strong>{lastRefreshedAt}</strong></span>
            </div>
          )}
        </div>

        {/* Big Center Toggle Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* Chandlodiya Tab */}
          <button
            type="button"
            onClick={() => handleSelectVistar('CHANDLODIYA')}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
              selectedVistar === 'CHANDLODIYA'
                ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                selectedVistar === 'CHANDLODIYA' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                🏢
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>Chandlodiya</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    C- Series
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">ચાંદલોડિયા કેન્દ્ર &bull; Sat, 31 Oct</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-slate-900">{centerSummary.chdTotal}</div>
              <div className="text-[10px] font-bold text-slate-600 uppercase">Registered</div>
            </div>
          </button>

          {/* Vadaj Tab */}
          <button
            type="button"
            onClick={() => handleSelectVistar('VADAJ')}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
              selectedVistar === 'VADAJ'
                ? 'border-indigo-500 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                selectedVistar === 'VADAJ' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                🏛️
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>Vadaj</span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                    V- Series
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">વાડજ કેન્દ્ર &bull; Sun, 01 Nov</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-slate-900">{centerSummary.vadTotal}</div>
              <div className="text-[10px] font-bold text-slate-600 uppercase">Registered</div>
            </div>
          </button>

          {/* Combined Both Centers */}
          <button
            type="button"
            onClick={() => handleSelectVistar('ALL')}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
              selectedVistar === 'ALL'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                selectedVistar === 'ALL' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                🌐
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>All Centers</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    Combined
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">બંને કેન્દ્રો &bull; Global Roster</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-slate-900">{centerSummary.combinedTotal}</div>
              <div className="text-[10px] font-bold text-slate-600 uppercase">Total Children</div>
            </div>
          </button>
        </div>

        {/* Selected Center Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-200">
          <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Total Registrations</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{report.totalRegistrations}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Bal (Boys)</div>
            <div className="text-lg font-black text-blue-950 mt-0.5">{report.totalBal}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/80">
            <div className="text-[10px] font-bold text-rose-700 uppercase">Balika (Girls)</div>
            <div className="text-lg font-black text-rose-950 mt-0.5">{report.totalBlk}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
            <div className="text-[10px] font-bold text-emerald-700 uppercase">Cards Issued (Present)</div>
            <div className="text-lg font-black text-emerald-950 mt-0.5">{report.totalIssued}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/80">
            <div className="text-[10px] font-bold text-purple-700 uppercase">Accompanying Persons</div>
            <div className="text-lg font-black text-purple-950 mt-0.5">{report.totalCompanions}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
            <div className="text-[10px] font-bold text-amber-700 uppercase">Total Footfall</div>
            <div className="text-lg font-black text-amber-950 mt-0.5">{report.totalAttendees}</div>
          </div>
        </div>
      </div>

      {/* 2. AREA DISTRIBUTION CARDS (STEP 2: CLICK AN AREA TO INSPECT) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Step 2: Area Breakdown for {selectedVistar === 'CHANDLODIYA' ? 'Chandlodiya' : selectedVistar === 'VADAJ' ? 'Vadaj' : 'All Centers'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any area card below to view the full child registration directory for that specific locality.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500">
            {report.areas.length} distinct areas identified
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* "All Areas" master card */}
            <div
              onClick={() => setSelectedAreaKey('ALL_AREAS')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedAreaKey === 'ALL_AREAS'
                  ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-black text-slate-900 text-sm">All Areas Combined</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">તમામ વિસ્તારો (સંપૂર્ણ કેન્દ્ર)</div>
                </div>
                {selectedAreaKey === 'ALL_AREAS' && (
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Viewing
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-slate-900">{report.totalRegistrations}</span>
                <span className="text-xs text-slate-500 font-bold">children (100%)</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] font-bold">
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  👦 {report.totalBal} Bal
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                  👧 {report.totalBlk} Balika
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  🎟️ {report.totalIssued} Issued
                </span>
              </div>
            </div>

            {/* Individual Area Cards */}
            {report.areas.map((area) => {
              const isSelected = selectedAreaKey === area.areaKey;
              return (
                <div
                  key={area.areaKey}
                  onClick={() => setSelectedAreaKey(area.areaKey)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="font-black text-slate-900 text-sm">{area.displayName}</span>
                        {area.isPreset && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            Major
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{area.displayGujarati}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mt-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">{area.total}</span>
                      <span className="text-xs text-slate-500 font-bold">children</span>
                    </div>
                    <div className="text-xs font-black text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md border border-amber-200">
                      {area.percentage}%
                    </div>
                  </div>

                  {/* Progress Bar of Center Share */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(area.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] font-bold">
                    <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/60">
                      👦 {area.balCount}
                    </span>
                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                      👧 {area.blkCount}
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                      🎟️ {area.issuedCount}
                    </span>
                    <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200/60" title="Accompanying Persons">
                      👥 +{area.companionsCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. STEP 3 & 4: COMPLETE CHILDREN DIRECTORY FOR ACTIVE AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Step 3 &amp; 4: Registered Children Roster</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <span>
                  {selectedAreaKey === 'ALL_AREAS'
                    ? `All Registrations in ${selectedVistar === 'CHANDLODIYA' ? 'Chandlodiya' : selectedVistar === 'VADAJ' ? 'Vadaj' : 'All Centers'}`
                    : `Children Registered from "${activeAreaStats?.displayName || selectedAreaKey}"`}
                </span>
                <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {totalItems} Records
                </span>
              </h3>
            </div>

            {/* Quick Actions for this Area */}
            <div className="flex items-center gap-2">
              {selectedAreaKey !== 'ALL_AREAS' && (
                <button
                  type="button"
                  onClick={() => setSelectedAreaKey('ALL_AREAS')}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition-colors"
                >
                  Clear Area Filter (Show All)
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, code, phone, house..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dept Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value as 'ALL' | 'BAL' | 'BLK')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="ALL">All Depts (બંને)</option>
                <option value="BAL">Bal (બાલ - કુમાર)</option>
                <option value="BLK">Balika (બાલિકા - કન્યા)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ISSUED' | 'NOT_ISSUED')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="ALL">All Card Statuses</option>
                <option value="ISSUED">Card Issued (હાજર)</option>
                <option value="NOT_ISSUED">Pending (બાકી)</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'ALL' | 'ONLINE' | 'ON_THE_SPOT')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="ALL">All Sources (સ્રોત)</option>
                <option value="ONLINE">Online Portal</option>
                <option value="ON_THE_SPOT">Walk-in (Spot)</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'CODE' | 'NAME_AZ' | 'LATEST' | 'OLDEST')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="CODE">Natural Code (C-1, C-2...)</option>
                <option value="NAME_AZ">Child Name (A to Z)</option>
                <option value="LATEST">Latest Registered</option>
                <option value="OLDEST">Oldest Registered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Children Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Child Full Name</th>
                <th className="py-2.5 px-2.5">Dept</th>
                <th className="py-2.5 px-3">Mobile</th>
                <th className="py-2.5 px-3">Area / Locality</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3">Card Status</th>
                <th className="py-2.5 px-3 text-slate-500">Registered</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                    <span>Loading area registrations...</span>
                  </td>
                </tr>
              ) : paginatedRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-800 text-sm">No matching records found</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Try adjusting your search query, department, or card status filter.
                      </div>
                      {(searchTerm || deptFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setDeptFilter('ALL');
                            setStatusFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRegistrations.map((reg, index) => {
                  const srNo = pageSize === 'ALL' ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                  const isPrePrinted = isCardPrePrinted(reg.registrationCode, reg.category, reg.vistar, printingSettings);
                  const isIssued = reg.cardStatus === 'ISSUED';
                  const compCount = reg.accompanyingPersonsCount || 0;

                  return (
                    <tr
                      key={reg.id}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                      onClick={() => setDetailChild(reg)}
                    >
                      {/* Sr. No. */}
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono font-medium">
                        {srNo}
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                            reg.category === 'BAL'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-rose-50 text-rose-900 border-rose-200'
                          }`}>
                            {reg.registrationCode}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            isPrePrinted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`} title={isPrePrinted ? 'Pre-printed Box Card' : 'Manual Blank Card'}>
                            {isPrePrinted ? 'Box' : 'Blank'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(reg.registrationCode)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded"
                            title="Copy code"
                          >
                            {copiedCode === reg.registrationCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {reg.fullName}
                        </div>
                      </td>

                      {/* Dept */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          reg.category === 'BAL'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {reg.category === 'BAL' ? 'Bal (બાલ)' : 'Balika (બાલિકા)'}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800 font-bold">{reg.mobileNumber}</span>
                          <a
                            href={`https://wa.me/91${reg.mobileNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${reg.mobileNumber}`}
                            className="text-blue-600 hover:text-blue-700 p-0.5"
                            title="Direct Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{reg.area || 'Unspecified'}</span>
                        </span>
                      </td>

                      {/* Address */}
                      <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600" title={`${reg.houseNumber || ''} ${reg.societyName || ''}`}>
                        {[reg.houseNumber, reg.societyName].filter(Boolean).join(', ') || '—'}
                      </td>

                      {/* Card Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isIssued ? (
                          <span className="inline-flex items-center gap-1 font-black text-[11px] text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Issued (+{compCount})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date & Source */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                        <div>{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('en-GB') : '—'}</div>
                        <div className="text-[10px] text-slate-600">
                          {reg.source === 'ONLINE' ? 'Online' : 'Walk-in'}
                        </div>
                      </td>

                      {/* Details Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDetailChild(reg)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                setCurrentPage(1);
              }}
              className="py-1 px-2 rounded-lg bg-slate-100 border border-slate-300 font-bold text-slate-700"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="ALL">All ({totalItems})</option>
            </select>
            <span>of <strong>{totalItems}</strong> matching records</span>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. CHILD PROFILE INSPECTION MODAL */}
      {detailChild && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setDetailChild(null)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-md border ${
                  detailChild.category === 'BAL'
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  {detailChild.registrationCode} &bull; {detailChild.category === 'BAL' ? 'Bal (બાલ)' : 'Balika (બાલિકા)'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1.5">{detailChild.fullName}</h3>
                <div className="text-xs text-slate-500 font-medium">
                  {detailChild.vistar === 'CHANDLODIYA' ? 'Chandlodiya Center' : 'Vadaj Center'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailChild(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="space-y-3.5 my-4 text-xs">
              {/* Contact & WhatsApp */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Contact Mobile</div>
                  <div className="text-sm font-mono font-black text-slate-900">{detailChild.mobileNumber}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/91${detailChild.mobileNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${detailChild.mobileNumber}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Address & Locality */}
              <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Area &amp; Address</span>
                </div>
                <div className="text-xs font-black text-slate-900 mt-1">
                  Area / Locality: <span className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">{detailChild.area || 'Unspecified'}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  House No: <strong>{detailChild.houseNumber || '—'}</strong>, Society: <strong>{detailChild.societyName || '—'}</strong>
                </div>
              </div>

              {/* Card Issuance Status */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ground Attendance &amp; Card</div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md ${
                      detailChild.cardStatus === 'ISSUED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {detailChild.cardStatus === 'ISSUED' ? '✓ Card Issued' : '⏳ Pending Card'}
                    </span>
                  </div>
                  {detailChild.cardStatus === 'ISSUED' && (
                    <div className="text-xs font-bold text-slate-700">
                      Accompanying: <strong>{detailChild.accompanyingPersonsCount || 0} Persons</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailChild(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Excel Export Filtering Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialVistar={selectedVistar === 'ALL' ? 'COMBINED' : selectedVistar}
        initialCategory={deptFilter}
        initialArea={selectedAreaKey === 'ALL_AREAS' ? 'ALL' : (activeAreaStats?.displayName || 'ALL')}
        initialRecords={allRegistrations}
        printingSettings={printingSettings}
      />
    </AdminLayout>
  );
};
