import React, { useState } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { issueCard, reverseCard, updateAccompanyingCount, searchRegistrations } from '@/services/registrationService';
import type { Registration } from '@/types';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  RotateCcw, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check, 
  Copy, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const HelpdeskLookupPage: React.FC = () => {
  const { categoryAccess } = useAuth();
  const [phoneQuery, setPhoneQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Registration[]>([]);
  const [searched, setSearched] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Per-child companion count in edit mode
  const [companionInputs, setCompanionInputs] = useState<Record<string, number>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search registrations by phone number or child name
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phoneQuery.trim();
    if (!clean) return;

    setLoading(true);
    setFeedback(null);
    setSearched(true);

    try {
      const activeScope = categoryAccess === 'BAL_ONLY' ? 'BAL' : categoryAccess === 'BLK_ONLY' ? 'BLK' : 'BOTH';
      const { results: list } = await searchRegistrations(clean, activeScope);
      setResults(list);

      // Pre-fill companion inputs
      const initialCompanions: Record<string, number> = {};
      list.forEach((r) => {
        initialCompanions[r.id] = r.accompanyingPersonsCount || 0;
      });
      setCompanionInputs(initialCompanions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing helpdesk search.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleIssueSingle = async (child: Registration) => {
    setSubmittingId(child.id);
    const count = companionInputs[child.id] || 0;
    try {
      await issueCard(child.id, count, child.vistar);
      setFeedback({
        type: 'success',
        message: `Card issued for ${child.fullName} (${child.registrationCode}) with ${count} companion(s)!`,
      });
      // Update local item
      setResults((prev) =>
        prev.map((r) =>
          r.id === child.id
            ? { ...r, cardStatus: 'ISSUED', accompanyingPersonsCount: count }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue card.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReverseSingle = async (child: Registration) => {
    if (!confirm(`Reverse card for ${child.fullName}?`)) return;
    setSubmittingId(child.id);
    try {
      await reverseCard(child.id, child.vistar);
      setFeedback({
        type: 'success',
        message: `Card for ${child.fullName} reversed back to Not Issued.`,
      });
      setResults((prev) =>
        prev.map((r) =>
          r.id === child.id
            ? { ...r, cardStatus: 'NOT_ISSUED' }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reverse card.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUpdateCompanionsSingle = async (child: Registration) => {
    setSubmittingId(child.id);
    const newCount = companionInputs[child.id] || 0;
    try {
      await updateAccompanyingCount(child.id, newCount, child.vistar);
      setFeedback({
        type: 'success',
        message: `Updated companion count for ${child.fullName} to ${newCount}.`,
      });
      setResults((prev) =>
        prev.map((r) =>
          r.id === child.id
            ? { ...r, accompanyingPersonsCount: newCount }
            : r
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update companion count.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingId(null);
    }
  };

  // WhatsApp quick link builder
  const getWhatsAppLink = (mobile: string, names: string[]) => {
    const cleanPhone = mobile.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Jai Swaminarayan!\nRegarding Anandotsav 2026 registration for: ${names.join(', ')}.\nEvent Desk: BAPS Shri Swaminarayan Mandir Ground.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  return (
    <AdminLayout
      title="Helpdesk &amp; Family Lookup Tool"
      subtitle="Group registrations by parent mobile number to inspect siblings, batch issue cards, and contact families directly."
    >
      <div className="space-y-6 text-left">
        {/* Search Input Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="Enter 10-digit parent mobile number, child name, or code..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl text-slate-900 font-semibold text-sm placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !phoneQuery.trim()}
              className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup Family</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Tip: When parents arrive with multiple children, entering their phone number brings up all siblings across BAL and BLK together.
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}

        {/* Results Container */}
        {searched && (
          <div>
            {results.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">No Family Registrations Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No records match "{phoneQuery}". Make sure the 10-digit mobile number is correct, or register on-the-spot.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Family Summary Header */}
                <div className="bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 p-5 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Family Grouping Found ({results.length} Child Records)</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Phone: {results[0]?.mobileNumber}</span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${results[0]?.mobileNumber}`}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call Parent</span>
                    </a>

                    <a
                      href={getWhatsAppLink(results[0]?.mobileNumber, results.map((r) => r.fullName))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Sibling Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((child) => {
                    const isIssued = child.cardStatus === 'ISSUED';
                    const isSubmitting = submittingId === child.id;

                    return (
                      <div
                        key={child.id}
                        className={`p-5 rounded-2xl border transition-all shadow-xs ${
                          isIssued 
                            ? 'bg-emerald-50/30 border-emerald-300' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                child.category === 'BAL' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {child.category === 'BAL' ? 'Bal Vibhag (Boys)' : 'Balika Vibhag (Girls)'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                                🏛️ {child.vistar === 'CHANDLODIYA' ? 'Chandlodiya' : 'Vadaj'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {child.source === 'ONLINE' ? 'Online Entry' : 'Walk-in'}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-slate-900 leading-tight">
                              {child.fullName}
                            </h4>

                            <div className="flex items-center gap-1.5 mt-1 text-xs">
                              <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {child.registrationCode}
                              </span>
                              <button
                                onClick={() => handleCopy(child.registrationCode)}
                                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy registration code"
                              >
                                {copiedCode === child.registrationCode ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div>
                            {isIssued ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                                Card Issued
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Companions Count Stepper */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Accompanying Persons:</span>
                            <span className="text-amber-700 font-mono text-xs font-bold">
                              {companionInputs[child.id] ?? child.accompanyingPersonsCount ?? 0}
                            </span>
                          </label>

                          <div className="flex items-center gap-2">
                            {[0, 1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() =>
                                  setCompanionInputs((prev) => ({ ...prev, [child.id]: num }))
                                }
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  (companionInputs[child.id] ?? child.accompanyingPersonsCount ?? 0) === num
                                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex items-center gap-2">
                          {!isIssued ? (
                            <button
                              type="button"
                              onClick={() => handleIssueSingle(child)}
                              disabled={isSubmitting}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                              <span>Issue Games Card</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateCompanionsSingle(child)}
                                disabled={isSubmitting}
                                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                                <span>Save Companions</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReverseSingle(child)}
                                disabled={isSubmitting}
                                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reverse</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
