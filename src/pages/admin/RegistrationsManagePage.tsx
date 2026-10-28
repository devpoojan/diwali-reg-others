import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  softDeleteRegistration, 
  restoreRegistration, 
  issueCard, 
  reverseCard, 
  updateAccompanyingCount,
  getVistarFromRegistrationCode 
} from '@/services/registrationService';
import type { Registration, Vistar } from '@/types';
import { 
  subscribeToCardPrintingSettings, 
  isCardPrePrinted, 
  type CardPrintingSettings 
} from '@/services/cardPrintingService';
import { exportAllRegistrationsToExcel } from '@/services/excelExportService';
import { ExcelExportModal } from '@/components/admin/ExcelExportModal';
import { 
  Search, 
  Download, 
  Trash2, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  Copy,
  Phone,
  Check,
  CreditCard,
  Users,
  MessageSquare,
  Eye,
  RotateCcw,
  X,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export const RegistrationsManagePage: React.FC = () => {
  const { currentUser, isCoordinator, categoryAccess } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Row selection & Bulk action states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Inspector modal state
  const [detailChild, setDetailChild] = useState<Registration | null>(null);
  const [editDetailCompanions, setEditDetailCompanions] = useState<number>(0);
  const [modalActionLoading, setModalActionLoading] = useState(false);

  // Audit quick filters
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'HIGH_COMPANIONS' | 'WALK_INS' | 'PENDING' | 'ISSUED'>('ALL');

  // Filters
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'BAL' | 'BLK'>('ALL');
  const [selectedVistar, setSelectedVistar] = useState<'ALL' | 'VADAJ' | 'CHANDLODIYA'>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'ONLINE' | 'ON_THE_SPOT'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ISSUED' | 'NOT_ISSUED'>('ALL');
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<'LATEST' | 'OLDEST' | 'NAME_AZ'>('LATEST');
  const [readLimit, setReadLimit] = useState<number>(1000);

  // Pagination states (Default 50 per page per user request)
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    type: 'DELETE' | 'RESTORE';
    child: Registration;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Real-time card printing settings
  const [printingSettings, setPrintingSettings] = useState<CardPrintingSettings | null>(null);
  useEffect(() => {
    const unsub = subscribeToCardPrintingSettings((s) => {
      setPrintingSettings(s);
    });
    return () => unsub();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const activeDept = categoryAccess === 'BAL_ONLY' ? 'BAL' :
                         categoryAccess === 'BLK_ONLY' ? 'BLK' :
                         selectedDept !== 'ALL' ? selectedDept : null;

      const targetCols: ('chandlodiya' | 'vadaj')[] =
        selectedVistar === 'CHANDLODIYA' ? ['chandlodiya'] :
        selectedVistar === 'VADAJ' ? ['vadaj'] :
        ['chandlodiya', 'vadaj'];

      const promises = targetCols.map(async (colName) => {
        const colRef = collection(db, colName);
        let q = query(colRef, where('isDeleted', '==', showDeleted));
        if (activeDept) {
          q = query(q, where('category', '==', activeDept));
        }
        q = query(q, limit(readLimit));
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
      let data: Registration[] = results.flat();

      // Fallback to legacy registrations collection if center collections returned no records
      if (data.length === 0) {
        const colRef = collection(db, 'registrations');
        let q = query(colRef, where('isDeleted', '==', showDeleted));
        if (activeDept) {
          q = query(q, where('category', '==', activeDept));
        }
        q = query(q, limit(readLimit));
        const snap = await getDocs(q);
        data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[];
      }

      // In-memory instant sorting (prevents Firestore composite index blockers)
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'LATEST') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'NAME_AZ') {
          return (a.fullName || '').localeCompare(b.fullName || '');
        }
        return 0;
      });

      setRegistrations(sorted);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedDept, selectedVistar, selectedSource, selectedStatus, showDeleted, sortBy, readLimit]);

  // Client-side filtering for search & status & audit filters
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedVistar !== 'ALL' && reg.vistar !== selectedVistar) return false;
    if (selectedSource !== 'ALL' && reg.source !== selectedSource) return false;
    if (selectedStatus !== 'ALL' && reg.cardStatus !== selectedStatus) return false;

    // Audit Filters
    if (auditFilter === 'HIGH_COMPANIONS' && (reg.accompanyingPersonsCount || 0) < 5) return false;
    if (auditFilter === 'WALK_INS' && reg.source !== 'ON_THE_SPOT') return false;
    if (auditFilter === 'PENDING' && reg.cardStatus !== 'NOT_ISSUED') return false;
    if (auditFilter === 'ISSUED' && reg.cardStatus !== 'ISSUED') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = reg.fullName?.toLowerCase().includes(term);
      const matchPhone = reg.mobileNumber?.includes(term);
      const matchCode = reg.registrationCode?.toLowerCase().includes(term);
      const isPureNum = /^\d+$/.test(searchTerm.trim());
      const numVal = isPureNum ? parseInt(searchTerm.trim(), 10) : null;
      const matchExactNumber = numVal !== null && reg.registrationCode?.endsWith(`-${numVal}`);
      return matchName || matchPhone || matchCode || matchExactNumber;
    }
    return true;
  });

  const isFiltered = Boolean(
    searchTerm.trim() ||
    selectedDept !== 'ALL' ||
    selectedVistar !== 'ALL' ||
    selectedSource !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    auditFilter !== 'ALL' ||
    showDeleted
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedVistar('ALL');
    setSelectedSource('ALL');
    setSelectedStatus('ALL');
    setAuditFilter('ALL');
    setShowDeleted(false);
  };

  const formatRegTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pagination Calculations
  const totalItems = filteredRegistrations.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / (pageSize as number)));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedVistar, selectedSource, selectedStatus, auditFilter, showDeleted, pageSize]);

  const startIndex = pageSize === 'ALL' ? 0 : (currentPage - 1) * (pageSize as number);
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + (pageSize as number), totalItems);
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  // Selection Handlers
  const isAllOnPageSelected = paginatedRegistrations.length > 0 && paginatedRegistrations.every((r) => selectedIds.has(r.id));
  const isAllMatchingSelected = selectedIds.size > 0 && selectedIds.size === filteredRegistrations.length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllOnPageSelected) {
        paginatedRegistrations.forEach((r) => next.delete(r.id));
      } else {
        paginatedRegistrations.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isAllMatchingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRegistrations.map((r) => r.id)));
    }
  };

  // Bulk Export Selected into 5 Sheets (All Combined, Chandlodiya Bal, Chandlodiya Balika, Vadaj Bal, Vadaj Balika)
  const handleExportSelected = async () => {
    const chosen = filteredRegistrations.filter((r) => selectedIds.has(r.id));
    if (chosen.length === 0) return;

    try {
      await exportAllRegistrationsToExcel({
        customRecords: chosen,
        fileName: `Anandotsav_2026_Selected_${chosen.length}_Records_5_Sheets.xlsx`,
        printingSettings,
      });
    } catch (err) {
      console.error('Export selected error:', err);
      alert('Failed to export selected registrations.');
    }
  };

  // Bulk Soft Delete
  const handleBulkSoftDelete = async () => {
    if (!currentUser || selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      for (const id of Array.from(selectedIds)) {
        const item = registrations.find((r) => r.id === id);
        await softDeleteRegistration(id, currentUser.uid, item?.vistar);
      }
      setFeedback({
        type: 'success',
        message: `Successfully soft-deleted ${selectedIds.size} registration records.`,
      });
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      fetchRegistrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk delete failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleOpenInspector = (child: Registration) => {
    setDetailChild(child);
    setEditDetailCompanions(child.accompanyingPersonsCount || 0);
  };

  const handleInspectorIssue = async () => {
    if (!detailChild) return;
    setModalActionLoading(true);
    try {
      await issueCard(detailChild.id, editDetailCompanions, detailChild.vistar);
      setFeedback({
        type: 'success',
        message: `Card issued for ${detailChild.fullName} (+${editDetailCompanions} companions)!`,
      });
      setDetailChild({ ...detailChild, cardStatus: 'ISSUED', accompanyingPersonsCount: editDetailCompanions });
      fetchRegistrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue card.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleInspectorReverse = async () => {
    if (!detailChild) return;
    if (!confirm(`Reverse card for ${detailChild.fullName}?`)) return;
    setModalActionLoading(true);
    try {
      await reverseCard(detailChild.id, detailChild.vistar);
      setFeedback({
        type: 'success',
        message: `Card for ${detailChild.fullName} reversed back to Not Issued.`,
      });
      setDetailChild({ ...detailChild, cardStatus: 'NOT_ISSUED' });
      fetchRegistrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reverse card.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleInspectorSaveCompanions = async () => {
    if (!detailChild) return;
    setModalActionLoading(true);
    try {
      await updateAccompanyingCount(detailChild.id, editDetailCompanions, detailChild.vistar);
      setFeedback({
        type: 'success',
        message: `Companions updated to ${editDetailCompanions} for ${detailChild.fullName}.`,
      });
      setDetailChild({ ...detailChild, accompanyingPersonsCount: editDetailCompanions });
      fetchRegistrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update companions.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === 'DELETE') {
        await softDeleteRegistration(confirmModal.child.id, currentUser?.uid || 'staff', confirmModal.child.vistar);
        setFeedback({
          type: 'success',
          message: `Registration ${confirmModal.child.registrationCode} soft-deleted. Attendance recalculated.`,
        });
      } else {
        await restoreRegistration(confirmModal.child.id, confirmModal.child.vistar);
        setFeedback({
          type: 'success',
          message: `Registration ${confirmModal.child.registrationCode} restored successfully.`,
        });
      }
      setConfirmModal(null);
      fetchRegistrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete action.';
      setFeedback({
        type: 'error',
        message: msg,
      });
    }
  };

  // Quick summary counts
  const issuedCount = filteredRegistrations.filter((r) => r.cardStatus === 'ISSUED').length;
  const pendingCount = filteredRegistrations.filter((r) => r.cardStatus === 'NOT_ISSUED').length;
  const companionsTotal = filteredRegistrations
    .filter((r) => r.cardStatus === 'ISSUED')
    .reduce((sum, r) => sum + (r.accompanyingPersonsCount || 0), 0);

  return (
    <AdminLayout
      title="Registrations Directory"
      subtitle="Browse, filter, soft-delete/restore, and export registration records (PRD Section 21)"
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            title="Reload registration list"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* Quick Operations Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtered Total</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{filteredRegistrations.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-600" />
              <span>Cards Issued</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{issuedCount}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cards Pending</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" />
              <span>Companions</span>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">{companionsTotal}</div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
          </div>
        )}

        {/* Quick Operational Audit Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Audits:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'HIGH_COMPANIONS', label: '⚠️ High Companions (≥5)' },
            { id: 'WALK_INS', label: '🏃 Walk-ins Only' },
            { id: 'PENDING', label: '⏳ Uncollected Cards' },
            { id: 'ISSUED', label: '✅ Active Issued Cards' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setAuditFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                auditFilter === pill.id
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by child name, mobile, or code (e.g. V-1, C-1001)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
              />
            </div>

            {/* Department Filter */}
            {categoryAccess === 'BOTH' && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as 'ALL' | 'BAL' | 'BLK')}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
              >
                <option value="ALL">All Departments</option>
                <option value="BAL">Bal Vibhag (BAL)</option>
                <option value="BLK">Balika Vibhag (BLK)</option>
              </select>
            )}

            {/* Area / Vistar Filter */}
            <select
              value={selectedVistar}
              onChange={(e) => setSelectedVistar(e.target.value as 'ALL' | 'CHANDLODIYA' | 'VADAJ')}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="ALL">All Areas (Vistar)</option>
              <option value="CHANDLODIYA">🏛️ Chandlodiya (31/10 Sat)</option>
              <option value="VADAJ">🏛️ Vadaj (01/11 Sun)</option>
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as 'ALL' | 'ONLINE' | 'ON_THE_SPOT')}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="ALL">All Sources</option>
              <option value="ONLINE">Online Public</option>
              <option value="ON_THE_SPOT">On-the-Spot</option>
            </select>

            {/* Card Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ISSUED' | 'NOT_ISSUED')}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="ALL">All Card Statuses</option>
              <option value="ISSUED">Card Issued</option>
              <option value="NOT_ISSUED">Card Pending</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'LATEST' | 'OLDEST' | 'NAME_AZ')}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="LATEST">Sort: Latest First</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="NAME_AZ">Sort: Name A–Z</option>
            </select>

            {/* Strict Read Limit Selector */}
            <select
              value={readLimit}
              onChange={(e) => setReadLimit(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold px-3 py-2 text-amber-800 focus:outline-none focus:bg-white"
              title="Database Read Limit"
            >
              <option value={300}>Fetch: 300 records</option>
              <option value={500}>Fetch: 500 records</option>
              <option value={1000}>Fetch: 1,000 records</option>
              <option value={2000}>Fetch: 2,000 records (All)</option>
            </select>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-black px-3 py-2 text-slate-900 focus:outline-none focus:bg-white"
              title="Rows per page"
            >
              <option value={25}>Show: 25 per page</option>
              <option value={50}>Show: 50 per page (Default)</option>
              <option value={100}>Show: 100 per page</option>
              <option value={200}>Show: 200 per page</option>
              <option value="ALL">Show: All ({filteredRegistrations.length})</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-white text-amber-600 focus:ring-0 cursor-pointer"
              />
              <span className={showDeleted ? 'text-rose-700 font-bold' : ''}>
                Show Soft-Deleted Records
              </span>
            </label>

            <div className="flex items-center gap-3">
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-amber-700 hover:text-amber-800 font-bold text-xs underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
              <div>
                Showing <strong className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-slate-900">{totalItems}</strong> registrations
                {pageSize !== 'ALL' && totalPages > 1 && (
                  <span className="text-slate-500 ml-1.5 font-medium">(Page {currentPage} of {totalPages})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Immutability Banner */}
        <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            Submitted child registration information is permanently immutable across all staff roles (PRD Section 17).
          </span>
        </div>

        {/* Registrations Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllOnPageSelected}
                      onChange={handleToggleSelectPage}
                      className="w-3.5 h-3.5 rounded bg-white border-slate-300 text-amber-600 focus:ring-0 cursor-pointer"
                      title={isAllOnPageSelected ? "Deselect current page" : "Select all on this page"}
                    />
                  </th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Child Full Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-2">Dept</th>
                  <th className="py-2.5 px-2">Area</th>
                  <th className="py-2.5 px-2">Source</th>
                  <th className="py-2.5 px-2.5">Card Status</th>
                  <th className="py-2.5 px-2 text-center">Family</th>
                  <th className="py-2.5 px-3 text-slate-500">Registered</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Select All Matching Banner across pages */}
                {isAllOnPageSelected && totalItems > paginatedRegistrations.length && (
                  <tr className="bg-amber-50 border-b border-amber-200">
                    <td colSpan={11} className="py-2.5 px-4 text-xs text-amber-950">
                      <div className="flex items-center justify-between">
                        <div>
                          {isAllMatchingSelected ? (
                            <span>All <strong>{totalItems}</strong> matching registrations across all pages are selected.</span>
                          ) : (
                            <span>All <strong>{paginatedRegistrations.length}</strong> registrations on this page are selected.</span>
                          )}
                        </div>
                        {!isAllMatchingSelected ? (
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="font-bold underline hover:text-slate-900 cursor-pointer ml-3"
                          >
                            Select all {totalItems} registrations across all pages
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="font-bold underline hover:text-slate-900 cursor-pointer ml-3"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      Loading registrations...
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      No registrations found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRegistrations.map((reg) => {
                    const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
                    return (
                      <tr 
                        key={reg.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedIds.has(reg.id) ? 'bg-amber-50/60' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(reg.id)}
                            onChange={() => handleToggleSelect(reg.id)}
                            className="w-3.5 h-3.5 rounded bg-white border-slate-300 text-amber-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{reg.registrationCode}</span>
                            {isCardPrePrinted(reg.registrationCode, reg.category, reg.vistar, printingSettings) ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans font-bold" title="Pre-Printed in Box">
                                🖨️
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-sans font-bold" title="Non-Printed (Manual Card Required)">
                                ✍️
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyCode(reg.registrationCode)}
                              title="Copy code"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              {copiedId === reg.registrationCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenInspector(reg)}
                            className="hover:text-amber-800 hover:underline text-left cursor-pointer"
                            title="Click to view details & contact parent"
                          >
                            {reg.fullName}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">
                          <a 
                            href={`tel:${reg.mobileNumber}`} 
                            className="hover:text-amber-800 flex items-center gap-1 transition-colors"
                            title="Call mobile number"
                          >
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
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            vistar === 'VADAJ'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {vistar === 'VADAJ' ? 'Vadaj' : 'Chandlodiya'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-600 font-medium whitespace-nowrap">
                          {reg.source === 'ONLINE' ? 'Online' : 'Walk-in'}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {reg.cardStatus === 'ISSUED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              Issued
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">
                          {reg.cardStatus === 'ISSUED' ? (
                            <span className={(reg.accompanyingPersonsCount || 0) >= 5 ? 'text-amber-700 font-black' : ''}>
                              {reg.accompanyingPersonsCount}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formatRegTime(reg.createdAt)}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenInspector(reg)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer"
                              title="Inspect details & actions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isCoordinator && (
                              reg.isDeleted ? (
                                <button
                                  onClick={() => setConfirmModal({ type: 'RESTORE', child: reg })}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCcw className="w-3 h-3" />
                                  <span>Restore</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmModal({ type: 'DELETE', child: reg })}
                                  className="px-2 py-1 rounded bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Navigation Bar */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Left: Row Count & Page Size Dropdown */}
            <div className="flex flex-wrap items-center gap-3 text-slate-600 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50 (Default)</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value="ALL">Show All ({totalItems})</option>
                </select>
              </div>

              <span className="text-slate-300 hidden sm:inline">•</span>

              <span className="text-slate-600">
                Showing <strong className="text-slate-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-slate-900 font-bold">{totalItems}</strong>
              </span>
            </div>

            {/* Right: Pagination Navigation Controls */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
                  title="First Page (Page 1)"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page Number Chips */}
                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers().map((p, idx) => (
                    typeof p === 'number' ? (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === p
                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none font-bold">
                        ...
                      </span>
                    )
                  ))}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors cursor-pointer"
                  title={`Last Page (Page ${totalPages})`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Table Live Summary Secondary Sub-Footer */}
          <div className="bg-slate-100/80 px-4 py-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-[11px]">
              <span>Loaded in memory: <strong className="text-slate-900">{registrations.length}</strong></span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-800 font-mono font-bold">Read Cap: {readLimit}</span>
            </div>
            <div className="flex items-center gap-3 font-medium flex-wrap text-[11px]">
              <span>Issued: <strong className="text-emerald-700 font-bold">{issuedCount}</strong></span>
              <span>•</span>
              <span>Pending: <strong className="text-amber-700 font-bold">{pendingCount}</strong></span>
              <span>•</span>
              <span>Family Companions: <strong className="text-blue-700 font-bold">{companionsTotal}</strong></span>
              <span>•</span>
              <span>Total Headcount: <strong className="text-amber-900 font-black">{issuedCount + companionsTotal}</strong></span>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-amber-400 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                {selectedIds.size} Selected
              </span>
              <span className="text-xs text-slate-700 font-semibold hidden sm:inline">
                Bulk action on checked registrations
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSelected}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>

              {isCoordinator && (
                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Child Detail Inspector Modal */}
        {detailChild && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 shadow-2xl text-left">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                      detailChild.category === 'BAL' ? 'bg-blue-600' : 'bg-rose-600'
                    }`}>
                      {detailChild.category === 'BAL' ? 'Bal Vibhag' : 'Balika Vibhag'}
                    </span>
                    <span className="font-mono text-amber-900 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {detailChild.registrationCode}
                    </span>
                    {isCardPrePrinted(detailChild.registrationCode, detailChild.category, detailChild.vistar, printingSettings) ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🖨️ Pre-Printed Card
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        ✍️ Non-Printed (Manual Card)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{detailChild.fullName}</h3>
                </div>

                <button
                  onClick={() => setDetailChild(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Child Details Grid */}
              <div className="grid grid-cols-2 gap-3 my-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">First Name</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{detailChild.firstName}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Father's Name</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{detailChild.fatherName}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Surname</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{detailChild.surname}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Registered Source</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{detailChild.source === 'ONLINE' ? 'Online Portal' : 'On-the-Spot'}</div>
                </div>
              </div>

              {/* Address & Locality */}
              {(detailChild.houseNumber || detailChild.societyName || detailChild.area) && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 text-xs">
                  <div className="text-[11px] text-slate-500 font-bold uppercase mb-1.5 flex items-center gap-1">
                    <span>📍 Address & Locality</span>
                  </div>
                  <div className="space-y-1 text-slate-900 font-medium">
                    {detailChild.area && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold">Locality / Area:</span>
                        <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{detailChild.area}</span>
                      </div>
                    )}
                    {(detailChild.houseNumber || detailChild.societyName) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold">Address:</span>
                        <span className="font-semibold">{[detailChild.houseNumber, detailChild.societyName].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Parent Communication */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Contact Mobile</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">{detailChild.mobileNumber}</div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${detailChild.mobileNumber}`}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/91${detailChild.mobileNumber}?text=${encodeURIComponent(`Jai Swaminarayan! Regarding Anandotsav 2026 registration for ${detailChild.fullName} (${detailChild.registrationCode}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Card Operations in Inspector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Card Status</span>
                  {detailChild.cardStatus === 'ISSUED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Active Issued (+{detailChild.accompanyingPersonsCount})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Not Issued (Pending)
                    </span>
                  )}
                </div>

                {/* Accompanying Count Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex justify-between">
                    <span>Accompanying Persons with Child:</span>
                    <span className="text-amber-800 font-mono font-black text-xs">{editDetailCompanions}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditDetailCompanions(n)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          editDetailCompanions === n
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {detailChild.cardStatus === 'NOT_ISSUED' ? (
                    <button
                      type="button"
                      onClick={handleInspectorIssue}
                      disabled={modalActionLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Issue Card Now (+{editDetailCompanions})</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleInspectorSaveCompanions}
                        disabled={modalActionLoading}
                        className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Update Companions</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInspectorReverse}
                        disabled={modalActionLoading}
                        className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reverse</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {bulkDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 shadow-2xl text-left">
              <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Bulk Soft-Delete?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                You are about to soft-delete <strong>{selectedIds.size}</strong> checked registration records.
                They will be hidden from volunteer search and excluded from active attendance counts.
                Codes will NOT be reused.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSoftDelete}
                  disabled={bulkActionLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {bulkActionLoading ? 'Deleting...' : `Yes, Delete ${selectedIds.size}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Single Soft Delete or Restore */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 shadow-2xl text-left">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {confirmModal.type === 'DELETE' ? 'Soft-Delete Registration?' : 'Restore Registration?'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {confirmModal.type === 'DELETE'
                  ? `Registration ${confirmModal.child.registrationCode} (${confirmModal.child.fullName}) will be hidden from volunteer search and excluded from active attendance counts. Registration code will NOT be deleted or reused.`
                  : `Registration ${confirmModal.child.registrationCode} (${confirmModal.child.fullName}) will be restored to active status.`}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
                    confirmModal.type === 'DELETE' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {confirmModal.type === 'DELETE' ? 'Yes, Soft Delete' : 'Yes, Restore'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Export Filter Pop-up Modal */}
        <ExcelExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          initialVistar={selectedVistar === 'ALL' ? 'COMBINED' : selectedVistar}
          initialCategory={selectedDept}
          initialRecords={registrations}
          printingSettings={printingSettings}
        />
      </div>
    </AdminLayout>
  );
};
