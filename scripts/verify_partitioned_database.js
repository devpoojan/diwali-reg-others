import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        envVars[key] = val;
      }
    }
  });
}

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
  console.log('--- Checking Firestore Partitioned Structure ---');

  // Check chandlodiya
  const chdSnap = await getDocs(collection(db, 'chandlodiya'));
  console.log(`\nCollection 'chandlodiya': ${chdSnap.size} document(s)`);
  chdSnap.forEach((d) => {
    console.log(`  - [chandlodiya/${d.id}]`, JSON.stringify(d.data()));
  });

  // Check vadaj
  const vadSnap = await getDocs(collection(db, 'vadaj'));
  console.log(`\nCollection 'vadaj': ${vadSnap.size} document(s)`);
  vadSnap.forEach((d) => {
    console.log(`  - [vadaj/${d.id}]`, JSON.stringify(d.data()));
  });

  // Check legacy registrations (should be 0 or clean)
  const regSnap = await getDocs(collection(db, 'registrations'));
  console.log(`\nCollection 'registrations': ${regSnap.size} document(s)`);

  // Check registrationCounters
  const cntSnap = await getDocs(collection(db, 'registrationCounters'));
  console.log(`\nCollection 'registrationCounters': ${cntSnap.size} document(s)`);
  cntSnap.forEach((d) => {
    console.log(`  - [registrationCounters/${d.id}]`, JSON.stringify(d.data()));
  });

  console.log('\n--- Verification Finished Successfully ---');
}

verify().catch(console.error);
