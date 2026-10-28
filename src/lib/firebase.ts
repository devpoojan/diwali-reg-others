import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc,
  getDoc,
  type Firestore 
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import type { FirebaseProjectConfig } from '@/types';

const LOCAL_STORAGE_FIREBASE_KEY = 'baps_firebase_config';

/**
 * Retrieve current effective Firebase configuration.
 * Checks localStorage first for user-configured keys from Setup Wizard,
 * falling back to Vite environment variables.
 */
export function getEffectiveFirebaseConfig(): FirebaseProjectConfig {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_FIREBASE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse custom Firebase config:', e);
      }
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baps-anandotsav-2026.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baps-anandotsav-2026',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baps-anandotsav-2026.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || 'anandotsav',
  };
}

/**
 * Save custom Firebase configuration to localStorage.
 */
export function saveCustomFirebaseConfig(config: FirebaseProjectConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_FIREBASE_KEY, JSON.stringify(config));
  }
}

/**
 * Test a Firebase project configuration to verify Firestore and Auth readiness.
 */
export async function testFirebaseConnection(config: FirebaseProjectConfig): Promise<{ success: boolean; message: string }> {
  let testApp: FirebaseApp | null = null;
  try {
    const testAppName = `test-conn-${Date.now()}`;
    testApp = initializeApp(config, testAppName);
    
    // Check Firestore connection
    const targetDbId = config.databaseId || '(default)';
    let testDb: Firestore;
    try {
      testDb = getFirestore(testApp, targetDbId);
    } catch {
      testDb = getFirestore(testApp);
    }

    const docRef = doc(testDb, '_health', 'ping');
    await Promise.race([
      getDoc(docRef),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out (8s). Check Project ID & API Key.')), 8000)
      ),
    ]);

    return { 
      success: true, 
      message: `Successfully connected to Firebase project "${config.projectId}"!` 
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to Firebase';
    return { success: false, message: msg };
  } finally {
    if (testApp) {
      deleteApp(testApp).catch(() => {});
    }
  }
}

// Active Configuration
const activeConfig = getEffectiveFirebaseConfig();

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(activeConfig) : getApps()[0];
export const auth: Auth = getAuth(app);

export const databaseId: string = activeConfig.databaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || 'anandotsav';

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, databaseId);
} catch {
  try {
    firestoreInstance = getFirestore(app, databaseId);
  } catch {
    firestoreInstance = getFirestore(app);
  }
}

export const db: Firestore = firestoreInstance;
export const storage: FirebaseStorage = getStorage(app);

export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.projectId &&
  activeConfig.apiKey !== 'demo-api-key'
);
