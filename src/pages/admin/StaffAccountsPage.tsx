import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/staff/AdminLayout';
import { ChangePasswordModal } from '@/components/staff/ChangePasswordModal';
import type { DepartmentAccess } from '@/types';
import { 
  CheckCircle2, 
  Users, 
  Shield, 
  KeyRound 
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface StaffAccountItem {
  id: string;
  accountKey: string;
  email: string;
  displayName: string;
  role: 'VOLUNTEER' | 'ADMIN' | 'SUPER_ADMIN';
  categoryAccess: DepartmentAccess;
  accountType: 'INDIVIDUAL' | 'SHARED';
  status: 'ACTIVE' | 'DISABLED';
  lastActive: string;
}

export const StaffAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<StaffAccountItem[]>([
    {
      id: 'vol-bal-shared',
      accountKey: 'bal',
      email: 'bal.volunteer@anandotsav.baps.org',
      displayName: 'BAL Volunteer Team Account',
      role: 'VOLUNTEER',
      categoryAccess: 'BAL_ONLY',
      accountType: 'SHARED',
      status: 'ACTIVE',
      lastActive: 'Active (Shared Team)',
    },
    {
      id: 'vol-blk-shared',
      accountKey: 'blk',
      email: 'blk.volunteer@anandotsav.baps.org',
      displayName: 'BLK Volunteer Team Account',
      role: 'VOLUNTEER',
      categoryAccess: 'BLK_ONLY',
      accountType: 'SHARED',
      status: 'ACTIVE',
      lastActive: 'Active (Shared Team)',
    },
    {
      id: 'admin-main',
      accountKey: 'admin',
      email: 'admin@anandotsav.baps.org',
      displayName: 'Main Event Admin',
      role: 'ADMIN',
      categoryAccess: 'BOTH',
      accountType: 'INDIVIDUAL',
      status: 'ACTIVE',
      lastActive: 'Active',
    },
    {
      id: 'superadmin-main',
      accountKey: 'superadmin',
      email: 'superadmin@anandotsav.baps.org',
      displayName: 'Super Administrator',
      role: 'SUPER_ADMIN',
      categoryAccess: 'BOTH',
      accountType: 'INDIVIDUAL',
      status: 'ACTIVE',
      lastActive: 'Active',
    },
  ]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetAccountKey, setTargetAccountKey] = useState<string>('admin');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      if (!snap.empty) {
        const liveItems: StaffAccountItem[] = snap.docs
          .filter((docSnap) => {
            const d = docSnap.data();
            const id = docSnap.id.toLowerCase();
            const email = (d.email || '').toLowerCase();
            const displayName = (d.displayName || '').toLowerCase();
            const role = (d.role || '').toUpperCase();

            // Strictly hide coordinator accounts
            if (
              role === 'COORDINATOR' ||
              id.includes('coord') ||
              email.includes('coord') ||
              displayName.includes('coordinator')
            ) {
              return false;
            }
            return true;
          })
          .map((docSnap) => {
            const d = docSnap.data();
            const email = (d.email || '').toLowerCase();
            let accountKey = 'admin';
            if (email.includes('bal')) accountKey = 'bal';
            else if (email.includes('blk')) accountKey = 'blk';
            else if (email.includes('super')) accountKey = 'superadmin';

            return {
              id: docSnap.id,
              accountKey,
              email: d.email || '',
              displayName: d.displayName || d.email,
              role: (d.role === 'SUPER_ADMIN' || d.role === 'ADMIN') ? d.role : 'VOLUNTEER',
              categoryAccess: d.categoryAccess || 'BOTH',
              accountType: d.accountType || (d.role === 'VOLUNTEER' ? 'SHARED' : 'INDIVIDUAL'),
              status: d.status || 'ACTIVE',
              lastActive: d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString() : 'Active',
            };
          });
        
        if (liveItems.length > 0) {
          setAccounts(liveItems);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleToggleStatus = async (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const nextStatus = target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    try {
      await updateDoc(doc(db, 'users', id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      setFeedback(`Status updated to ${nextStatus}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to update status in Firestore:', err);
      setAccounts(accounts.map((acc) => acc.id === id ? { ...acc, status: nextStatus } : acc));
      setFeedback('Status updated locally.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const openPasswordChange = (accountKey: string) => {
    setTargetAccountKey(accountKey);
    setPasswordModalOpen(true);
  };

  return (
    <AdminLayout
      title="Staff Accounts &amp; Password Management"
      subtitle="Manage volunteer shared accounts, administrative access, and account passwords"
      actions={
        <button
          onClick={() => openPasswordChange('admin')}
          className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Change Account Password</span>
        </button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6 text-left">
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}

        {/* Informational Guidance */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-3 shadow-xs">
          <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900">Admin Security Note:</strong> Account passwords can only be changed by Administrators from this Admin console. Click <strong>Change Password</strong> on any account below to set a new password.
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Account / Name</th>
                  <th className="py-3.5 px-4">Email / Login ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department Scope</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts
                  .filter((acc) => {
                    const id = acc.id.toLowerCase();
                    const email = acc.email.toLowerCase();
                    const name = acc.displayName.toLowerCase();
                    return !id.includes('coord') && !email.includes('coord') && !name.includes('coordinator') && (acc.role as string) !== 'COORDINATOR';
                  })
                  .map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {acc.accountType === 'SHARED' ? (
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{acc.displayName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {acc.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800 border border-slate-300">
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.categoryAccess === 'BAL_ONLY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                          BAL ONLY
                        </span>
                      ) : acc.categoryAccess === 'BLK_ONLY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200">
                          BLK ONLY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
                          BAL &amp; BLK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {acc.accountType === 'SHARED' ? 'Shared Team' : 'Individual'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPasswordChange(acc.accountKey)}
                          className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Change Password for this account"
                        >
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          <span>Change Password</span>
                        </button>

                        {acc.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(acc.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                              acc.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {acc.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        targetAccount={targetAccountKey}
      />
    </AdminLayout>
  );
};
