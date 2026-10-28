import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, DepartmentAccess, StaffUser, DepartmentCategory } from '@/types';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updatePassword,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: StaffUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  categoryAccess: DepartmentAccess;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isVolunteer: boolean;
  canAccessCategory: (cat: DepartmentCategory) => boolean;
  login: (identifier: string, pass?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  changeAccountPassword: (accountKey: string, newPassword: string) => Promise<void>;
  simulateRoleLogin: (role: UserRole, categoryAccess: DepartmentAccess, displayName: string) => void;
}

export function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    'admin': 'admin@anandotsav.baps.org',
    'superadmin': 'superadmin@anandotsav.baps.org',
    'su': 'superadmin@anandotsav.baps.org',
    'bal': 'bal.volunteer@anandotsav.baps.org',
    'bal.volunteer': 'bal.volunteer@anandotsav.baps.org',
    'volunteer.bal': 'bal.volunteer@anandotsav.baps.org',
    'blk': 'blk.volunteer@anandotsav.baps.org',
    'blk.volunteer': 'blk.volunteer@anandotsav.baps.org',
    'volunteer.blk': 'blk.volunteer@anandotsav.baps.org',
  };

  if (aliasMap[trimmed]) {
    return aliasMap[trimmed];
  }

  if (!trimmed.includes('@')) {
    return `${trimmed}@anandotsav.baps.org`;
  }

  return trimmed;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there is an active simulated session from local storage for rapid testing
    const savedSimulated = localStorage.getItem('simulated_auth_user');
    if (savedSimulated) {
      try {
        const parsed = JSON.parse(savedSimulated);
        setCurrentUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('simulated_auth_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as StaffUser;
            if (data.status === 'ACTIVE') {
              setCurrentUser({ ...data, uid: user.uid });
            } else {
              await firebaseSignOut(auth);
              setCurrentUser(null);
            }
          } else {
            // Default fallback if doc doesn't exist yet
            setCurrentUser({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Staff Member',
              role: 'VOLUNTEER',
              categoryAccess: 'BOTH',
              accountType: 'INDIVIDUAL',
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass?: string) => {
    localStorage.removeItem('simulated_auth_user');
    const trimmed = identifier.trim().toLowerCase();
    const resolvedEmail = resolveLoginEmail(identifier);
    const enteredPass = (pass ?? '').trim();

    if (!enteredPass) {
      throw new Error('Please enter your password.');
    }

    const aliasRoleMap: Record<string, { role: UserRole; categoryAccess: DepartmentAccess; name: string }> = {
      'admin': { role: 'ADMIN', categoryAccess: 'BOTH', name: 'Event Administrator' },
      'superadmin': { role: 'SUPER_ADMIN', categoryAccess: 'BOTH', name: 'Super Administrator' },
      'su': { role: 'SUPER_ADMIN', categoryAccess: 'BOTH', name: 'Super Administrator' },
      'bal': { role: 'VOLUNTEER', categoryAccess: 'BAL_ONLY', name: 'Bal Volunteer Team' },
      'bal.volunteer': { role: 'VOLUNTEER', categoryAccess: 'BAL_ONLY', name: 'Bal Volunteer Team' },
      'blk': { role: 'VOLUNTEER', categoryAccess: 'BLK_ONLY', name: 'Balika Volunteer Team' },
      'blk.volunteer': { role: 'VOLUNTEER', categoryAccess: 'BLK_ONLY', name: 'Balika Volunteer Team' },
    };

    // 1. Check if admin configured a custom password in Firestore for this account
    let customPassword: string | null = null;
    try {
      const snap = await getDoc(doc(db, 'staff_passwords', trimmed));
      if (snap.exists() && snap.data()?.password) {
        customPassword = snap.data().password;
      }
    } catch (err) {
      console.warn('Firestore password check bypassed:', err);
    }

    if (customPassword !== null) {
      if (enteredPass !== customPassword) {
        throw new Error('Incorrect password. Please verify and try again.');
      }
      // Password matches the custom password!
      try {
        const cred = await signInWithEmailAndPassword(auth, resolvedEmail, enteredPass);
        setFirebaseUser(cred.user);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as StaffUser;
          if (data.status === 'ACTIVE') {
            setCurrentUser({ ...data, uid: cred.user.uid });
            return;
          }
        }
      } catch {
        // Fall back to mapped role with valid verified password
      }

      if (aliasRoleMap[trimmed]) {
        const mapped = aliasRoleMap[trimmed];
        simulateRoleLogin(mapped.role, mapped.categoryAccess, mapped.name);
        return;
      }
    }

    // 2. Default password verification or standard Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, resolvedEmail, enteredPass);
      setFirebaseUser(cred.user);

      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as StaffUser;
        if (data.status === 'ACTIVE') {
          setCurrentUser({ ...data, uid: cred.user.uid });
        } else {
          await firebaseSignOut(auth);
          setCurrentUser(null);
          throw new Error('Your staff account has been deactivated. Please contact an Administrator.');
        }
      } else {
        // Fallback default
        setCurrentUser({
          uid: cred.user.uid,
          email: cred.user.email || resolvedEmail,
          displayName: cred.user.displayName || 'Staff Member',
          role: trimmed.includes('admin') ? 'ADMIN' : 'VOLUNTEER',
          categoryAccess: trimmed.includes('blk') ? 'BLK_ONLY' : trimmed.includes('bal') ? 'BAL_ONLY' : 'BOTH',
          accountType: 'SHARED',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      // If entered password matches the standard preset password 'Anandotsav@2026'
      if (enteredPass === 'Anandotsav@2026' && aliasRoleMap[trimmed]) {
        const mapped = aliasRoleMap[trimmed];
        simulateRoleLogin(mapped.role, mapped.categoryAccess, mapped.name);
        return;
      }

      if (err instanceof Error && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please verify and try again.');
        }
        if (code === 'auth/too-many-requests') {
          throw new Error('Too many failed sign-in attempts. Please wait a moment and try again.');
        }
        if (code === 'auth/network-request-failed') {
          throw new Error('Network connection failed. Please check your internet connection.');
        }
      }
      throw new Error('Incorrect password. Please verify and try again.');
    }
  };

  const changeAccountPassword = async (accountKey: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const key = accountKey.trim().toLowerCase();

    // 1. Store in Firestore under staff_passwords so it takes effect across all devices
    await setDoc(doc(db, 'staff_passwords', key), {
      accountId: key,
      password: newPassword,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin',
    }, { merge: true });

    // Also update aliases
    if (key === 'bal') {
      await setDoc(doc(db, 'staff_passwords', 'bal.volunteer'), { password: newPassword }, { merge: true });
    } else if (key === 'blk') {
      await setDoc(doc(db, 'staff_passwords', 'blk.volunteer'), { password: newPassword }, { merge: true });
    } else if (key === 'admin') {
      await setDoc(doc(db, 'staff_passwords', 'admin@anandotsav.baps.org'), { password: newPassword }, { merge: true });
    } else if (key === 'superadmin') {
      await setDoc(doc(db, 'staff_passwords', 'su'), { password: newPassword }, { merge: true });
    }

    // 2. If currently signed in user matches, update Firebase Auth as well
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (fbErr) {
        console.warn('Firebase Auth updatePassword warning:', fbErr);
      }
    }
  };

  const changePassword = async (newPassword: string) => {
    const key = currentUser?.role === 'SUPER_ADMIN'
      ? 'superadmin'
      : currentUser?.role === 'ADMIN'
      ? 'admin'
      : (currentUser?.email ? currentUser.email.split('@')[0] : 'admin');
    await changeAccountPassword(key, newPassword);
  };

  const logout = async () => {
    localStorage.removeItem('simulated_auth_user');
    setCurrentUser(null);
    setFirebaseUser(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignored if not using real firebase session
    }
  };

  /**
   * Helper for local development, staging tests & volunteer quick demo sessions
   */
  const simulateRoleLogin = (role: UserRole, categoryAccess: DepartmentAccess, displayName: string) => {
    const simUser: StaffUser = {
      uid: `sim_${role.toLowerCase()}_${Date.now()}`,
      email: `${role.toLowerCase()}@anandotsav.baps.org`,
      displayName,
      role,
      categoryAccess,
      accountType: role === 'VOLUNTEER' ? 'SHARED' : 'INDIVIDUAL',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('simulated_auth_user', JSON.stringify(simUser));
    setCurrentUser(simUser);
  };

  const role = currentUser?.role || null;
  const categoryAccess = currentUser?.categoryAccess || 'BOTH';

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;
  const isCoordinator = role === 'COORDINATOR' || isAdmin;
  const isVolunteer = Boolean(role);

  const canAccessCategory = (cat: DepartmentCategory): boolean => {
    if (!role) return false;
    if (categoryAccess === 'BOTH' || isAdmin) return true;
    return categoryAccess === `${cat}_ONLY`;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        role,
        categoryAccess,
        isAuthenticated: Boolean(currentUser),
        isSuperAdmin,
        isAdmin,
        isCoordinator,
        isVolunteer,
        canAccessCategory,
        login,
        logout,
        changePassword,
        changeAccountPassword,
        simulateRoleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
