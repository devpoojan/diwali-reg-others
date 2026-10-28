import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, runTransaction, serverTimestamp, increment, deleteDoc } from 'firebase/firestore';
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
        envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

const app = initializeApp({
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

async function testFlow() {
  console.log('Testing creation in chandlodiya collection...');
  const chdCounterRef = doc(db, 'chandlodiya', 'counter_BAL');
  const chdRegDoc = doc(collection(db, 'chandlodiya'));
  
  let chdCode = '';
  await runTransaction(db, async (t) => {
    const snap = await t.get(chdCounterRef);
    const lastNum = snap.exists() ? snap.data().lastAllocatedNumber : 0;
    const nextNum = lastNum + 1;
    chdCode = `C-${nextNum}`;
    t.set(chdRegDoc, {
      registrationCode: chdCode,
      vistar: 'CHANDLODIYA',
      category: 'BAL',
      firstName: 'TestChildChd',
      fatherName: 'Father',
      surname: 'Patel',
      fullName: 'TestChildChd Father Patel',
      mobileNumber: '9999988888',
      cardStatus: 'NOT_ISSUED',
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    t.set(chdCounterRef, { lastAllocatedNumber: nextNum }, { merge: true });
  });

  console.log(`Created in chandlodiya with code: ${chdCode}`);
  const verifyChd = await getDoc(chdRegDoc);
  console.log('Verified Chandlodiya Doc exists:', verifyChd.exists(), verifyChd.data().registrationCode);

  console.log('\nTesting creation in vadaj collection...');
  const vadCounterRef = doc(db, 'vadaj', 'counter_BAL');
  const vadRegDoc = doc(collection(db, 'vadaj'));
  
  let vadCode = '';
  await runTransaction(db, async (t) => {
    const snap = await t.get(vadCounterRef);
    const lastNum = snap.exists() ? snap.data().lastAllocatedNumber : 0;
    const nextNum = lastNum + 1;
    vadCode = `V-${nextNum}`;
    t.set(vadRegDoc, {
      registrationCode: vadCode,
      vistar: 'VADAJ',
      category: 'BAL',
      firstName: 'TestChildVad',
      fatherName: 'Father',
      surname: 'Shah',
      fullName: 'TestChildVad Father Shah',
      mobileNumber: '9999977777',
      cardStatus: 'NOT_ISSUED',
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    t.set(vadCounterRef, { lastAllocatedNumber: nextNum }, { merge: true });
  });

  console.log(`Created in vadaj with code: ${vadCode}`);
  const verifyVad = await getDoc(vadRegDoc);
  console.log('Verified Vadaj Doc exists:', verifyVad.exists(), verifyVad.data().registrationCode);

  // Clean up the two test records and reset counters
  console.log('\nCleaning up test records and restoring base counters...');
  await deleteDoc(chdRegDoc);
  await deleteDoc(vadRegDoc);
  await runTransaction(db, async (t) => {
    t.set(chdCounterRef, { category: 'BAL', vistar: 'CHANDLODIYA', lastAllocatedNumber: 1000 }, { merge: true });
    t.set(vadCounterRef, { category: 'BAL', vistar: 'VADAJ', lastAllocatedNumber: 0 }, { merge: true });
  });
  console.log('Cleanup completed. Base counters restored.');
}

testFlow().catch(console.error);
