/**
 * BAPS Anandotsav 2026 — Sync & Verification to Mumbai (asia-south1) Database
 *
 * Copies event settings, user profiles, statistics, and registrations from
 * (default) [nam5 - USA] to 'anandotsav' [asia-south1 - Mumbai, India].
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envPath = path.resolve(rootDir, '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY || "AIzaSyAYCZFL7XB1TNg1nWqCKTbyOW9N5pQCj_c",
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN || "diwali-test-3ab6c.firebaseapp.com",
  projectId: envVars.VITE_FIREBASE_PROJECT_ID || "diwali-test-3ab6c",
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET || "diwali-test-3ab6c.firebasestorage.app",
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || "461606904055",
  appId: envVars.VITE_FIREBASE_APP_ID || "1:461606904055:web:ba757233f13e705ee0b3f2",
};

const app = initializeApp(firebaseConfig, 'migrationApp');
const auth = getAuth(app);
const dbDefault = getFirestore(app); // nam5 (USA)
const dbMumbai = getFirestore(app, 'anandotsav'); // asia-south1 (Mumbai)

async function syncDatabases() {
  console.log('=================================================================');
  console.log('  BAPS Anandotsav 2026 — Migration to asia-south1 (Mumbai)       ');
  console.log('=================================================================\n');

  console.log('Authenticating superadmin session...');
  await signInWithEmailAndPassword(auth, 'superadmin@anandotsav.baps.org', 'Anandotsav@2026');
  console.log('✓ Super Admin session authenticated\n');

  const collectionsToSync = [
    'users',
    'eventSettings',
    'statistics',
    'chandlodiya',
    'vadaj',
    'registrations'
  ];

  for (const colName of collectionsToSync) {
    console.log(`Syncing collection /${colName}...`);
    const snap = await getDocs(collection(dbDefault, colName));
    console.log(`  Found ${snap.docs.length} documents in /${colName} (USA)`);

    if (snap.docs.length > 0) {
      // Chunk in batches of 400
      const chunks = [];
      for (let i = 0; i < snap.docs.length; i += 400) {
        chunks.push(snap.docs.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(dbMumbai);
        chunk.forEach((d) => {
          const targetRef = doc(dbMumbai, colName, d.id);
          batch.set(targetRef, d.data());
        });
        await batch.commit();
      }
    }
    console.log(`  ✓ Synced ${snap.docs.length} documents to /${colName} (Mumbai)\n`);
  }

  console.log('=================================================================');
  console.log('  DATABASE SYNC TO MUMBAI (asia-south1) COMPLETE!                ');
  console.log('=================================================================\n');

  // Measure Latency Comparison: USA (nam5) vs. Mumbai (asia-south1)
  console.log('Comparing Raw Query Latency: USA (nam5) vs. Mumbai (asia-south1)...');

  const usaLatencies = [];
  const mumbaiLatencies = [];

  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await getDocs(collection(dbDefault, 'chandlodiya'));
    usaLatencies.push(performance.now() - t0);
  }

  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await getDocs(collection(dbMumbai, 'chandlodiya'));
    mumbaiLatencies.push(performance.now() - t0);
  }

  const avgUsa = (usaLatencies.reduce((a, b) => a + b, 0) / usaLatencies.length).toFixed(2);
  const avgMumbai = (mumbaiLatencies.reduce((a, b) => a + b, 0) / mumbaiLatencies.length).toFixed(2);

  console.log(`USA Database (nam5)          Avg Latency: ${avgUsa} ms`);
  console.log(`Mumbai Database (asia-south1) Avg Latency: ${avgMumbai} ms`);
  console.log(`Latency Reduction                        : ${(avgUsa - avgMumbai).toFixed(2)} ms faster!`);
}

syncDatabases()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
