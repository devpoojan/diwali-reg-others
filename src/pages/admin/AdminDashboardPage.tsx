import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Registration, Vistar } from '@/types';
import { getVistarFromRegistrationCode } from '@/services/registrationService';
import { ExcelExportModal } from '@/components/admin/ExcelExportModal';
import { 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  Download,
  Building2,
  Check,
  Copy,
  Phone,
  Share2,
  MapPin
} from 'lucide-react';

export interface ScopeMetrics {
  total: number;
  online: number;
  onSpot: number;
  issued: number;
  pending: number;
  companions: number;
  attendance: number;
}

export interface VistarStatsGroup {
  bal: ScopeMetrics;
  blk: ScopeMetrics;
  combined: ScopeMetrics;
}

const emptyMetrics = (): ScopeMetrics => ({
  total: 0,
  online: 0,
  onSpot: 0,
  issued: 0,
  pending: 0,
  companions: 0,
  attendance: 0,
});

const emptyStatsGroup = (): VistarStatsGroup => ({
  bal: emptyMetrics(),
  blk: emptyMetrics(),
  combined: emptyMetrics(),
});

export const AdminDashboardPage: React.FC = () => {
  // Multi-Vistar Navigation Filter: COMBINED | VADAJ | CHANDLODIYA
  const [selectedVistar, setSelectedVistar] = useState<'COMBINED' | 'VADAJ' | 'CHANDLODIYA'>('COMBINED');
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'BAL' | 'BLK'>('ALL');

  // Aggregated stats groups
  const [combinedStats, setCombinedStats] = useState<VistarStatsGroup>(emptyStatsGroup());
  const [vadajStats, setVadajStats] = useState<VistarStatsGroup>(emptyStatsGroup());
  const [chandlodiyaStats, setChandlodiyaStats] = useState<VistarStatsGroup>(emptyStatsGroup());

  // Cached active registrations for real-time filtering & fast exports
  const [allActiveRegistrations, setAllActiveRegistrations] = useState<Registration[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchStatistics = async () => {
    try {
      // Fetch active registrations directly from center collections ('chandlodiya', 'vadaj')
      const [chdSnap, vadSnap] = await Promise.all([
        getDocs(query(collection(db, 'chandlodiya'), where('isDeleted', '==', false), limit(1000))),
        getDocs(query(collection(db, 'vadaj'), where('isDeleted', '==', false), limit(1000))),
      ]);

      const chdList = chdSnap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({ ...d.data(), id: d.id, vistar: 'CHANDLODIYA' as Vistar })) as Registration[];

      const vadList = vadSnap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({ ...d.data(), id: d.id, vistar: 'VADAJ' as Vistar })) as Registration[];

      let list = [...chdList, ...vadList];

      // If both center collections are empty, fallback to legacy registrations collection
      if (list.length === 0) {
        const regSnap = await getDocs(
          query(collection(db, 'registrations'), where('isDeleted', '==', false), limit(1000))
        );
        list = regSnap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[];
      }

      setAllActiveRegistrations(list);

      const comb = emptyStatsGroup();
      const vad = emptyStatsGroup();
      const chd = emptyStatsGroup();

      list.forEach((reg) => {
        const vistar: Vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
        const isBal = reg.category === 'BAL';
        const isOnline = reg.source === 'ONLINE';
        const isIssued = reg.cardStatus === 'ISSUED';
        const companions = isIssued ? (reg.accompanyingPersonsCount || 0) : 0;

        const accumulate = (m: ScopeMetrics) => {
          m.total += 1;
          if (isOnline) m.online += 1;
          else m.onSpot += 1;

          if (isIssued) {
            m.issued += 1;
            m.companions += companions;
            m.attendance += (1 + companions);
          } else {
            m.pending += 1;
          }
        };

        // Combined accumulation
        accumulate(comb.combined);
        if (isBal) accumulate(comb.bal);
        else accumulate(comb.blk);

        // Vistar-specific accumulation
        if (vistar === 'VADAJ') {
          accumulate(vad.combined);
          if (isBal) accumulate(vad.bal);
          else accumulate(vad.blk);
        } else {
          accumulate(chd.combined);
          if (isBal) accumulate(chd.bal);
          else accumulate(chd.blk);
        }
      });

      setCombinedStats(comb);
      setVadajStats(vad);
      setChandlodiyaStats(chd);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching multi-vistar statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  // Resolve active stats group based on selected Vistar
  const currentVistarStatsGroup = useMemo(() => {
    if (selectedVistar === 'VADAJ') return vadajStats;
    if (selectedVistar === 'CHANDLODIYA') return chandlodiyaStats;
    return combinedStats;
  }, [selectedVistar, vadajStats, chandlodiyaStats, combinedStats]);

  // Resolve metrics based on selected Department within the active Vistar
  const activeMetrics = useMemo(() => {
    if (selectedDept === 'BAL') return currentVistarStatsGroup.bal;
    if (selectedDept === 'BLK') return currentVistarStatsGroup.blk;
    return currentVistarStatsGroup.combined;
  }, [currentVistarStatsGroup, selectedDept]);

  const cardIssueRate = activeMetrics && activeMetrics.total > 0 
    ? Math.round((activeMetrics.issued / activeMetrics.total) * 100) 
    : 0;

  // Recent registrations matching current Vistar and Department filters
  const scopedRecentRegistrations = useMemo(() => {
    return allActiveRegistrations
      .filter((reg) => {
        if (selectedVistar === 'COMBINED') return true;
        const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
        return vistar === selectedVistar;
      })
      .filter((reg) => {
        if (selectedDept === 'ALL') return true;
        return reg.category === selectedDept;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [allActiveRegistrations, selectedVistar, selectedDept]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [copiedReport, setCopiedReport] = useState(false);
  const handleCopyWhatsAppReport = () => {
    const timeStr = lastRefreshedAt || new Date().toLocaleTimeString();
    const text = `*Anandotsav 2026 — Live Headcount Report*
📅 Updated: ${timeStr}

🏛️ *Chandlodiya (31/10 Sat)*:
• Total Registered: ${chandlodiyaStats.combined.total} (Online: ${chandlodiyaStats.combined.online}, Walk-in: ${chandlodiyaStats.combined.onSpot})
• Cards Issued (Children): ${chandlodiyaStats.combined.issued}
• Family Companions: ${chandlodiyaStats.combined.companions}
• ★ Center Attendance: ${chandlodiyaStats.combined.attendance}

🏛️ *Vadaj (01/11 Sun)*:
• Total Registered: ${vadajStats.combined.total} (Online: ${vadajStats.combined.online}, Walk-in: ${vadajStats.combined.onSpot})
• Cards Issued (Children): ${vadajStats.combined.issued}
• Family Companions: ${vadajStats.combined.companions}
• ★ Center Attendance: ${vadajStats.combined.attendance}

🌐 *Combined Total (Both Centers)*:
• Total Registered: ${combinedStats.combined.total}
• Children Present: ${combinedStats.combined.issued}
• Family Companions: ${combinedStats.combined.companions}
• ★ Total Ground Attendance: ${combinedStats.combined.attendance}`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const activeScopeTitle = 
    selectedVistar === 'COMBINED'
      ? 'Combined (Both Centers)'
      : selectedVistar === 'CHANDLODIYA'
        ? 'Chandlodiya (31/10 Sat)'
        : 'Vadaj (01/11 Sun)';

  return (
    <AdminLayout
      title="Operations &amp; Attendance Analytics"
      subtitle="Data-focused management console for Anandotsav 2026"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Read Limit: 1,000 docs</span>
          </span>

          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Updated: {lastRefreshedAt || 'Just now'}</span>
          </span>

          <button
            onClick={handleCopyWhatsAppReport}
            className="py-1 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            title="Copy formatted text report for WhatsApp coordination groups"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied Report!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Copy WhatsApp Report</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Download registrations in Excel with custom filters"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="py-1 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-left">
        {loading && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Loading live data from database...</span>
          </div>
        )}
        {/* ========================================================================= */}
        {/* TOP LEVEL EXECUTIVE KPI RIBBON (Compact, High Density, Zero Wasted Space)  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Registrations */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Total Registrations</span>
              <span className="font-mono text-[10px] text-slate-500">{activeScopeTitle}</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {activeMetrics.total}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
              <span className="text-blue-700 font-semibold">{activeMetrics.online} Online</span>
              <span>•</span>
              <span className="text-purple-700 font-semibold">{activeMetrics.onSpot} Walk-in</span>
            </div>
          </div>

          {/* Cards Issued (Children Present) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Cards Issued (Children)</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                {cardIssueRate}% Collected
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-1 tabular-nums">
              {activeMetrics.issued}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
              <span className="text-amber-700 font-bold">{activeMetrics.pending} Pending</span>
              <span>•</span>
              <span>of {activeMetrics.total} total</span>
            </div>
          </div>

          {/* Accompanying Family Guardians */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Family Companions</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-300">
                Guardians
              </span>
            </div>
            <div className="text-3xl font-black text-blue-700 mt-1 tabular-nums">
              {activeMetrics.companions}
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              {activeMetrics.issued > 0 
                ? `Avg ${(activeMetrics.companions / activeMetrics.issued).toFixed(1)} per child present` 
                : 'No cards issued yet'}
            </div>
          </div>

          {/* TOTAL GROUND ATTENDANCE */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border-2 border-amber-400 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
              <span>Total Ground Attendance</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                HEADCOUNT
              </span>
            </div>
            <div className="text-3xl font-black text-amber-950 mt-1 tabular-nums">
              {activeMetrics.attendance}
            </div>
            <div className="text-xs text-slate-700 font-medium mt-1">
              <span className="text-emerald-700 font-bold">{activeMetrics.issued} Children</span> + <span className="text-blue-700 font-bold">{activeMetrics.companions} Family</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASTER OPERATIONS MATRIX (The Data-Perfect Executive Table)                 */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Master Centers &amp; Categories Operations Matrix
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Live Comparative Headcount • Vadaj (01/11) vs Chandlodiya (31/10) vs Combined
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3.5 w-1/4">Operational Metric</th>
                  <th colSpan={3} className="py-2.5 px-3 text-center border-l border-slate-200 bg-purple-50 text-purple-900">
                    🏛️ Chandlodiya (31/10 Sat)
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 text-center border-l border-slate-200 bg-blue-50 text-blue-900">
                    🏛️ Vadaj (01/11 Sun)
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 text-center border-l border-slate-200 bg-amber-50 text-amber-900">
                    🌐 Combined Total
                  </th>
                </tr>
                <tr className="text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 bg-slate-50">
                  <th className="py-1.5 px-3.5">Category Breakdown</th>
                  {/* Chandlodiya Subheaders */}
                  <th className="py-1.5 px-2 text-right border-l border-slate-200 text-blue-700">BAL</th>
                  <th className="py-1.5 px-2 text-right text-rose-700">BLK</th>
                  <th className="py-1.5 px-2.5 text-right font-black text-slate-900 bg-slate-100">Total</th>
                  {/* Vadaj Subheaders */}
                  <th className="py-1.5 px-2 text-right border-l border-slate-200 text-blue-700">BAL</th>
                  <th className="py-1.5 px-2 text-right text-rose-700">BLK</th>
                  <th className="py-1.5 px-2.5 text-right font-black text-slate-900 bg-slate-100">Total</th>
                  {/* Combined Subheaders */}
                  <th className="py-1.5 px-2 text-right border-l border-slate-200 text-blue-700">BAL</th>
                  <th className="py-1.5 px-2 text-right text-rose-700">BLK</th>
                  <th className="py-1.5 px-2.5 text-right font-black text-amber-900 bg-amber-100">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {/* 1. Total Registrations */}
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Total Registrations</span>
                  </td>
                  {/* Chandlodiya */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-slate-800">{chandlodiyaStats.bal.total}</td>
                  <td className="py-2 px-2 text-right text-slate-800">{chandlodiyaStats.blk.total}</td>
                  <td className="py-2 px-2.5 text-right font-black text-slate-900 bg-slate-50">{chandlodiyaStats.combined.total}</td>
                  {/* Vadaj */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-slate-800">{vadajStats.bal.total}</td>
                  <td className="py-2 px-2 text-right text-slate-800">{vadajStats.blk.total}</td>
                  <td className="py-2 px-2.5 text-right font-black text-slate-900 bg-slate-50">{vadajStats.combined.total}</td>
                  {/* Combined */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 font-bold text-blue-700">{combinedStats.bal.total}</td>
                  <td className="py-2 px-2 text-right font-bold text-rose-700">{combinedStats.blk.total}</td>
                  <td className="py-2 px-2.5 text-right font-black text-amber-900 bg-amber-50">{combinedStats.combined.total}</td>
                </tr>

                {/* 2. Online Registrations */}
                <tr className="hover:bg-slate-50 text-slate-700">
                  <td className="py-1.5 px-3.5 pl-6 text-slate-500">├─ Online Portal</td>
                  {/* Chandlodiya */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{chandlodiyaStats.bal.online}</td>
                  <td className="py-1.5 px-2 text-right">{chandlodiyaStats.blk.online}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold bg-slate-50">{chandlodiyaStats.combined.online}</td>
                  {/* Vadaj */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{vadajStats.bal.online}</td>
                  <td className="py-1.5 px-2 text-right">{vadajStats.blk.online}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold bg-slate-50">{vadajStats.combined.online}</td>
                  {/* Combined */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{combinedStats.bal.online}</td>
                  <td className="py-1.5 px-2 text-right">{combinedStats.blk.online}</td>
                  <td className="py-1.5 px-2.5 text-right font-bold text-blue-800 bg-amber-50">{combinedStats.combined.online}</td>
                </tr>

                {/* 3. On-The-Spot Registrations */}
                <tr className="hover:bg-slate-50 text-slate-700">
                  <td className="py-1.5 px-3.5 pl-6 text-slate-500">└─ On-The-Spot Walk-In</td>
                  {/* Chandlodiya */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{chandlodiyaStats.bal.onSpot}</td>
                  <td className="py-1.5 px-2 text-right">{chandlodiyaStats.blk.onSpot}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold bg-slate-50">{chandlodiyaStats.combined.onSpot}</td>
                  {/* Vadaj */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{vadajStats.bal.onSpot}</td>
                  <td className="py-1.5 px-2 text-right">{vadajStats.blk.onSpot}</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold bg-slate-50">{vadajStats.combined.onSpot}</td>
                  {/* Combined */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{combinedStats.bal.onSpot}</td>
                  <td className="py-1.5 px-2 text-right">{combinedStats.blk.onSpot}</td>
                  <td className="py-1.5 px-2.5 text-right font-bold text-purple-800 bg-amber-50">{combinedStats.combined.onSpot}</td>
                </tr>

                {/* 4. Physical Cards Issued */}
                <tr className="hover:bg-slate-50 bg-emerald-50/40">
                  <td className="py-2 px-3.5 font-bold text-emerald-800">Cards Issued (Present)</td>
                  {/* Chandlodiya */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-emerald-700 font-semibold">{chandlodiyaStats.bal.issued}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 font-semibold">{chandlodiyaStats.blk.issued}</td>
                  <td className="py-2 px-2.5 text-right font-black text-emerald-800 bg-emerald-50">
                    {chandlodiyaStats.combined.issued}
                    <span className="text-[10px] text-slate-500 ml-1 font-normal">
                      ({chandlodiyaStats.combined.total > 0 ? Math.round((chandlodiyaStats.combined.issued / chandlodiyaStats.combined.total) * 100) : 0}%)
                    </span>
                  </td>
                  {/* Vadaj */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-emerald-700 font-semibold">{vadajStats.bal.issued}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 font-semibold">{vadajStats.blk.issued}</td>
                  <td className="py-2 px-2.5 text-right font-black text-emerald-800 bg-emerald-50">
                    {vadajStats.combined.issued}
                    <span className="text-[10px] text-slate-500 ml-1 font-normal">
                      ({vadajStats.combined.total > 0 ? Math.round((vadajStats.combined.issued / vadajStats.combined.total) * 100) : 0}%)
                    </span>
                  </td>
                  {/* Combined */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 font-bold text-emerald-800">{combinedStats.bal.issued}</td>
                  <td className="py-2 px-2 text-right font-bold text-emerald-800">{combinedStats.blk.issued}</td>
                  <td className="py-2 px-2.5 text-right font-black text-emerald-900 bg-emerald-100">
                    {combinedStats.combined.issued}
                    <span className="text-[10px] text-emerald-800 ml-1 font-normal">
                      ({combinedStats.combined.total > 0 ? Math.round((combinedStats.combined.issued / combinedStats.combined.total) * 100) : 0}%)
                    </span>
                  </td>
                </tr>

                {/* 5. Cards Pending */}
                <tr className="hover:bg-slate-50 text-slate-600">
                  <td className="py-1.5 px-3.5">Cards Pending Collection</td>
                  {/* Chandlodiya */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{chandlodiyaStats.bal.pending}</td>
                  <td className="py-1.5 px-2 text-right">{chandlodiyaStats.blk.pending}</td>
                  <td className="py-1.5 px-2.5 text-right bg-slate-50">{chandlodiyaStats.combined.pending}</td>
                  {/* Vadaj */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{vadajStats.bal.pending}</td>
                  <td className="py-1.5 px-2 text-right">{vadajStats.blk.pending}</td>
                  <td className="py-1.5 px-2.5 text-right bg-slate-50">{vadajStats.combined.pending}</td>
                  {/* Combined */}
                  <td className="py-1.5 px-2 text-right border-l border-slate-200">{combinedStats.bal.pending}</td>
                  <td className="py-1.5 px-2 text-right">{combinedStats.blk.pending}</td>
                  <td className="py-1.5 px-2.5 text-right text-amber-800 font-bold bg-amber-50">{combinedStats.combined.pending}</td>
                </tr>

                {/* 6. Accompanying Family Companions */}
                <tr className="hover:bg-slate-50 bg-blue-50/30 text-slate-700">
                  <td className="py-2 px-3.5 font-bold text-blue-800">Family Companions (Guardians)</td>
                  {/* Chandlodiya */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-blue-700 font-semibold">{chandlodiyaStats.bal.companions}</td>
                  <td className="py-2 px-2 text-right text-blue-700 font-semibold">{chandlodiyaStats.blk.companions}</td>
                  <td className="py-2 px-2.5 text-right font-black text-blue-800 bg-blue-50">{chandlodiyaStats.combined.companions}</td>
                  {/* Vadaj */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 text-blue-700 font-semibold">{vadajStats.bal.companions}</td>
                  <td className="py-2 px-2 text-right text-blue-700 font-semibold">{vadajStats.blk.companions}</td>
                  <td className="py-2 px-2.5 text-right font-black text-blue-800 bg-blue-50">{vadajStats.combined.companions}</td>
                  {/* Combined */}
                  <td className="py-2 px-2 text-right border-l border-slate-200 font-bold text-blue-800">{combinedStats.bal.companions}</td>
                  <td className="py-2 px-2 text-right font-bold text-blue-800">{combinedStats.blk.companions}</td>
                  <td className="py-2 px-2.5 text-right font-black text-blue-900 bg-amber-50">{combinedStats.combined.companions}</td>
                </tr>

                {/* 7. TOTAL ATTENDANCE (HIGHLIGHTED ROW) */}
                <tr className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-t-2 border-amber-400">
                  <td className="py-2.5 px-3.5 font-black text-amber-950 text-sm">
                    ★ TOTAL ATTENDANCE (Headcount)
                  </td>
                  {/* Chandlodiya */}
                  <td className="py-2.5 px-2 text-right border-l border-slate-200 font-black text-amber-900">{chandlodiyaStats.bal.attendance}</td>
                  <td className="py-2.5 px-2 text-right font-black text-amber-900">{chandlodiyaStats.blk.attendance}</td>
                  <td className="py-2.5 px-2.5 text-right font-black text-amber-950 bg-amber-200/50 text-sm">{chandlodiyaStats.combined.attendance}</td>
                  {/* Vadaj */}
                  <td className="py-2.5 px-2 text-right border-l border-slate-200 font-black text-amber-900">{vadajStats.bal.attendance}</td>
                  <td className="py-2.5 px-2 text-right font-black text-amber-900">{vadajStats.blk.attendance}</td>
                  <td className="py-2.5 px-2.5 text-right font-black text-amber-950 bg-amber-200/50 text-sm">{vadajStats.combined.attendance}</td>
                  {/* Combined */}
                  <td className="py-2.5 px-2 text-right border-l border-slate-200 font-black text-amber-900">{combinedStats.bal.attendance}</td>
                  <td className="py-2.5 px-2 text-right font-black text-amber-900">{combinedStats.blk.attendance}</td>
                  <td className="py-2.5 px-2.5 text-right font-black text-amber-950 bg-amber-300/50 text-base">{combinedStats.combined.attendance}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DRILL-DOWN SCOPE SELECTOR TOOLBAR (Switch Active Focus)                     */}
        {/* ========================================================================= */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1">Center Focus:</span>
            <button
              type="button"
              onClick={() => setSelectedVistar('COMBINED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedVistar === 'COMBINED'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              🌐 Combined (Both Centers)
            </button>
            <button
              type="button"
              onClick={() => setSelectedVistar('CHANDLODIYA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedVistar === 'CHANDLODIYA'
                  ? 'bg-purple-600 text-white font-black shadow-xs ring-1 ring-purple-400'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              🏛️ Chandlodiya (31/10 Sat)
            </button>
            <button
              type="button"
              onClick={() => setSelectedVistar('VADAJ')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedVistar === 'VADAJ'
                  ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-400'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              🏛️ Vadaj (01/11 Sun)
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1">Category:</span>
            {(['ALL', 'BAL', 'BLK'] as const).map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All' : dept === 'BAL' ? '👦 BAL' : '👧 BLK'}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RECENT REGISTRATIONS ACTIVITY STREAM (Compact, Clean, Data-Focused)        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Recent Registrations ({activeScopeTitle} • {selectedDept})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Latest entries matching active filters • Showing up to 8 recent records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/area-report"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
                title="View area and locality breakdown report"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Area-Wise Report</span>
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                to="/admin/registrations"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {scopedRecentRegistrations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No registrations found for {selectedVistar} ({selectedDept}).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-2.5">Center</th>
                    <th className="py-2 px-3">Child Full Name</th>
                    <th className="py-2 px-3">Mobile</th>
                    <th className="py-2 px-2">Dept</th>
                    <th className="py-2 px-2.5">Channel</th>
                    <th className="py-2 px-2.5">Card Status</th>
                    <th className="py-2 px-2 text-center">Family</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scopedRecentRegistrations.map((reg) => {
                    const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-amber-800">
                          <div className="flex items-center gap-1">
                            <span>{reg.registrationCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(reg.registrationCode)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedId === reg.registrationCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            vistar === 'VADAJ'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {vistar === 'VADAJ' ? 'Vadaj' : 'Chandlodiya'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{reg.fullName}</td>
                        <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">
                          <a href={`tel:${reg.mobileNumber}`} className="hover:text-amber-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{reg.mobileNumber}</span>
                          </a>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                            reg.category === 'BAL' ? 'bg-blue-600' : 'bg-rose-600'
                          }`}>
                            {reg.category}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                          {reg.source === 'ONLINE' ? 'Online' : 'Walk-in'}
                        </td>
                        <td className="py-2 px-2.5">
                          {reg.cardStatus === 'ISSUED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              Issued (+{reg.accompanyingPersonsCount})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">
                          {reg.cardStatus === 'ISSUED' ? reg.accompanyingPersonsCount : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pop-up for all Excel filtering options */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialVistar={selectedVistar}
        initialCategory={selectedDept === 'ALL' ? 'ALL' : selectedDept}
        initialRecords={allActiveRegistrations}
      />
    </AdminLayout>
  );
};
