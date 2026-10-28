import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { getEventSettings, updateEventSettings } from '@/services/eventSettingsService';
import { deleteAllRegistrations } from '@/services/registrationService';
import { 
  Power, 
  CalendarClock, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Info, 
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const RegistrationSettingsPage: React.FC = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [onSpotEnabled, setOnSpotEnabled] = useState(true);
  const [autoCloseDateTime, setAutoCloseDateTime] = useState('');

  // Simple Danger Zone Modal States
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getEventSettings();
        setPublicEnabled(s.publicRegistrationEnabled);
        setOnSpotEnabled(s.onSpotRegistrationEnabled);
        setAutoCloseDateTime(s.automaticClosingAt || '');
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await updateEventSettings({
        publicRegistrationEnabled: publicEnabled,
        onSpotRegistrationEnabled: onSpotEnabled,
        automaticClosingAt: autoCloseDateTime || null,
      });

      setFeedback({
        type: 'success',
        message: 'Registration availability settings updated successfully in real-time!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    if (!isAdmin && !isSuperAdmin) {
      setDangerError('❌ Unauthorized: only Super Admin or Admin can perform this action.');
      return;
    }

    setDeletingAll(true);
    setDangerError(null);
    try {
      const res = await deleteAllRegistrations();
      setDangerModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Successfully deleted all ${res.deletedCount} registrations (${res.chandlodiyaCount} Chandlodiya, ${res.vadajCount} Vadaj, ${res.legacyCount} Legacy). Sequential counters (Vadaj: V-1, Chandlodiya: C-1) and attendance statistics have been reset!`,
      });
    } catch (err: unknown) {
      console.error('Error executing delete all registrations:', err);
      const msg = err instanceof Error ? err.message : 'Database error occurred.';
      setDangerError(`Failed to delete registrations: ${msg}`);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <AdminLayout
      title="Registration Availability Controls"
      subtitle="Manage public online registration, on-the-spot quick registration, and automatic closing dates (PRD Section 11)"
    >
      <div className="max-w-3xl mx-auto">
        {feedback && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}>
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading settings from Cloud Firestore...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-left">
            {/* Setting 1: Public Registration Manual Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    publicEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Public Online Registration
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Controls whether parents and guardians can access and submit child registrations on the public website.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setPublicEnabled(!publicEnabled)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 cursor-pointer ${
                    publicEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    publicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Current Public Portal Status:</span>
                <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  publicEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {publicEnabled ? 'Active (Open)' : 'Closed (Shows Event Info Only)'}
                </span>
              </div>
            </div>

            {/* Setting 2: Automatic Closing Date & Time */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Automatic Public Registration Closing Date &amp; Time
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    When this time is reached, public registration will automatically close and display the "Registration Closed" notice while keeping event information visible.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Closing Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={autoCloseDateTime}
                    onChange={(e) => setAutoCloseDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setAutoCloseDateTime('')}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors w-full cursor-pointer shadow-xs"
                  >
                    Clear Auto-Close Schedule
                  </button>
                </div>
              </div>

              {autoCloseDateTime && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Scheduled to auto-close on: <strong>{new Date(autoCloseDateTime).toLocaleString()}</strong></span>
                </div>
              )}
            </div>

            {/* Setting 3: On-the-Spot Registration Independent Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    onSpotEnabled ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      On-the-Spot (Quick Registration)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Controls whether ground volunteers can register walk-in children on event day via the Quick Register panel. Operates independently of public registration.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setOnSpotEnabled(!onSpotEnabled)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 cursor-pointer ${
                    onSpotEnabled ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    onSpotEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-extrabold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            RESTRICTED DANGER ZONE: PURGE ALL REGISTRATIONS
            ======================================================== */}
        {!loading && (isAdmin || isSuperAdmin) && (
          <div className="mt-10 pt-8 border-t-2 border-dashed border-rose-200">
            <div className="bg-rose-50/80 rounded-2xl border-2 border-rose-300 p-5 sm:p-6 shadow-sm text-left relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <AlertTriangle className="w-6 h-6 text-amber-200" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200/90 text-rose-950 font-black text-[10px] uppercase tracking-wider mb-1">
                      ⚠️ Restricted Danger Zone • Admins Only
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-rose-950">
                      Delete All Registrations &amp; Reset Counters
                    </h3>
                    <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed max-w-xl">
                      Permanently wipe all child registrations across Chandlodiya, Vadaj, and legacy databases. All attendance metrics will be reset, and sequential registration code counters will be reset to baseline (<code className="font-bold">0001</code> for Vadaj, <code className="font-bold">1001</code> for Chandlodiya).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDangerError(null);
                    setDangerModalOpen(true);
                  }}
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Registrations</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clean, Simple Confirmation Modal for Resetting All Registrations */}
        {dangerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-100 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-950">Delete All Registrations?</h3>
                  <p className="text-xs text-rose-700 font-medium">Reset test database &amp; counters</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <p>
                  This will permanently delete all registrations across <strong>Chandlodiya</strong> and <strong>Vadaj</strong> collections:
                </p>
                <ul className="list-disc list-inside space-y-1 bg-rose-50/70 p-3 rounded-2xl border border-rose-200 text-rose-900 font-medium">
                  <li>All child names, phone numbers, and records wiped</li>
                  <li>Attendance logs and card issuance reset to 0</li>
                  <li>Counters reset: <strong>V-1</strong> / <strong>C-1</strong> (Bal) &amp; <strong>V-1001</strong> / <strong>C-1001</strong> (Balika)</li>
                </ul>
                <p className="text-rose-600 font-bold">
                  Are you sure you want to proceed?
                </p>
              </div>

              {dangerError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-900 text-xs font-semibold">
                  {dangerError}
                </div>
              )}

              <div className="flex gap-3 pt-5 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  disabled={deletingAll}
                  onClick={() => setDangerModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingAll}
                  onClick={handleExecuteDeleteAll}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Delete All</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}      </div>
    </AdminLayout>
  );
};
