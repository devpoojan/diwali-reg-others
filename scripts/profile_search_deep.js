/**
 * BAPS Anandotsav 2026 — Deep Search Performance Instrumentation & Bottleneck Profiler
 *
 * Instruments every micro-phase of Volunteer Search:
 * 1. Network RTT Floor (HTTP/2 TLS to firestore.googleapis.com)
 * 2. Auth token acquisition overhead
 * 3. Query construction time
 * 4. Wire transmission & Server execution time
 * 5. Document deserialization & snapshot hydration time
 * 6. Client result filtering & deduplication time
 * 7. Concurrency model comparison: Lockstep Batches vs. Worker Pool
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
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

const app = initializeApp(firebaseConfig, 'profilerApp');
const db = getFirestore(app);
const auth = getAuth(app);

function calculateStats(arr) {
  if (arr.length === 0) return { min: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = +(sum / sorted.length).toFixed(2);
  const getP = (p) => sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];

  return {
    min: +sorted[0].toFixed(2),
    avg,
    p50: +getP(50).toFixed(2),
    p90: +getP(90).toFixed(2),
    p95: +getP(95).toFixed(2),
    p99: +getP(99).toFixed(2),
    max: +sorted[sorted.length - 1].toFixed(2),
  };
}

// Measure Raw Network RTT to Firestore Host
function measureRawHttpsPing() {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: '/',
      method: 'GET',
      headers: { 'User-Agent': 'Node-Profiler' }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve(performance.now() - t0);
      });
    });
    req.on('error', () => resolve(performance.now() - t0));
    req.end();
  });
}

async function runProfiler() {
  console.log('=================================================================');
  console.log('  BAPS Anandotsav 2026 — Deep Search Performance Profiler        ');
  console.log('=================================================================\n');

  // Phase 1: Measure Raw Network Baseline
  console.log('Measuring Raw Network Transport to firestore.googleapis.com...');
  const pingLatencies = [];
  for (let i = 0; i < 5; i++) {
    const ping = await measureRawHttpsPing();
    pingLatencies.push(ping);
  }
  const pingStats = calculateStats(pingLatencies);
  console.log(`✓ Network RTT: Min=${pingStats.min}ms | Avg=${pingStats.avg}ms | p50=${pingStats.p50}ms\n`);

  // Phase 2: Authenticate and Measure Token Overhead
  console.log('Authenticating staff session...');
  const tAuthStart = performance.now();
  const userCredential = await signInWithEmailAndPassword(auth, 'admin@anandotsav.baps.org', 'Anandotsav@2026');
  const authDuration = performance.now() - tAuthStart;
  console.log(`✓ Auth complete in ${authDuration.toFixed(2)}ms (UID: ${userCredential.user.uid})\n`);

  // Phase 3: Sample Real Database Records
  console.log('Collecting sample records for realistic test queries...');
  const sampleRecords = [];
  for (const colName of ['chandlodiya', 'vadaj']) {
    const snap = await getDocs(query(collection(db, colName), where('isDeleted', '==', false), limit(25)));
    snap.docs.forEach((docSnap) => {
      if (!docSnap.id.startsWith('counter_')) {
        const d = docSnap.data();
        sampleRecords.push({
          col: colName,
          category: d.category || 'BAL',
          code: d.registrationCode || '',
          mobile: d.mobileNumber || '',
          firstName: d.firstName || '',
          fullName: d.fullName || '',
        });
      }
    });
  }
  console.log(`✓ Collected ${sampleRecords.length} records.\n`);

  // Phase 4: Micro-Phased Query Profiling (100 individual searches)
  console.log('Executing 100 Micro-Phased Instrumentation Runs...');
  const phaseMetrics = {
    queryBuild: [],
    firestoreExecution: [],
    hydration: [],
    dedupAndMap: [],
    totalTime: [],
  };

  for (let i = 0; i < 100; i++) {
    const rec = sampleRecords[i % sampleRecords.length];
    const isName = i % 3 === 0;
    const isMobile = i % 3 === 1;
    const term = isName ? rec.firstName.slice(0, 3).toLowerCase() : (isMobile ? rec.mobile : rec.code);

    const t0 = performance.now();

    // Micro-phase 1: Query Building
    const tBuildStart = performance.now();
    const colRef = collection(db, rec.col);
    let q;
    if (isName) {
      q = query(colRef, where('category', '==', rec.category), where('nameSearchTokens', 'array-contains', term), where('isDeleted', '==', false), limit(15));
    } else if (isMobile) {
      q = query(colRef, where('category', '==', rec.category), where('mobileNumber', '==', term), where('isDeleted', '==', false), limit(10));
    } else {
      q = query(colRef, where('category', '==', rec.category), where('registrationCode', '==', term), where('isDeleted', '==', false), limit(5));
    }
    const tBuildEnd = performance.now();
    phaseMetrics.queryBuild.push(tBuildEnd - tBuildStart);

    // Micro-phase 2: Firestore Execution (Wire RTT + Server processing)
    const tQueryStart = performance.now();
    const snap = await getDocs(q);
    const tQueryEnd = performance.now();
    phaseMetrics.firestoreExecution.push(tQueryEnd - tQueryStart);

    // Micro-phase 3: Deserialization / Hydration
    const tHydrateStart = performance.now();
    const docs = snap.docs.map((d) => d.data());
    const tHydrateEnd = performance.now();
    phaseMetrics.hydration.push(tHydrateEnd - tHydrateStart);

    // Micro-phase 4: Result processing & deduplication
    const tProcessStart = performance.now();
    const map = new Map();
    docs.forEach((d) => map.set(d.registrationCode, d));
    const finalResults = Array.from(map.values());
    const tProcessEnd = performance.now();
    phaseMetrics.dedupAndMap.push(tProcessEnd - tProcessStart);

    const tTotal = performance.now() - t0;
    phaseMetrics.totalTime.push(tTotal);
  }

  const qbStats = calculateStats(phaseMetrics.queryBuild);
  const fsStats = calculateStats(phaseMetrics.firestoreExecution);
  const hyStats = calculateStats(phaseMetrics.hydration);
  const procStats = calculateStats(phaseMetrics.dedupAndMap);
  const totStats = calculateStats(phaseMetrics.totalTime);

  console.log('-----------------------------------------------------------------');
  console.log('MICRO-PHASE TIMING BREAKDOWN (100 Sequential Single-Station Queries):');
  console.log(`1. Query Build & Token Init  : Avg=${qbStats.avg}ms | p50=${qbStats.p50}ms | p95=${qbStats.p95}ms`);
  console.log(`2. Firestore Wire + Engine   : Avg=${fsStats.avg}ms | p50=${fsStats.p50}ms | p95=${fsStats.p95}ms`);
  console.log(`3. Document Hydration        : Avg=${hyStats.avg}ms | p50=${hyStats.p50}ms | p95=${hyStats.p95}ms`);
  console.log(`4. Dedup & In-Memory Map     : Avg=${procStats.avg}ms | p50=${procStats.p50}ms | p95=${procStats.p95}ms`);
  console.log(`>> TOTAL End-to-End Latency  : Avg=${totStats.avg}ms | p50=${totStats.p50}ms | p95=${totStats.p95}ms | Max=${totStats.max}ms`);
  console.log('-----------------------------------------------------------------\n');

  // Phase 5: Concurrency Architecture Comparison (100 queries at concurrency 10)
  console.log('Comparing Concurrency Models: Lockstep Batching vs. Worker Pool...');

  // Test Set of 100 queries
  const testQueries = [];
  for (let i = 0; i < 100; i++) {
    const rec = sampleRecords[i % sampleRecords.length];
    const isName = i % 3 === 0;
    const isMobile = i % 3 === 1;
    const term = isName ? rec.firstName.slice(0, 3).toLowerCase() : (isMobile ? rec.mobile : rec.code);
    testQueries.push({ rec, isName, isMobile, term });
  }

  // Model A: Lockstep Batches of 10 (Promise.all in for loop)
  const lockstepLatencies = [];
  const tLockstepStart = performance.now();
  for (let i = 0; i < testQueries.length; i += 10) {
    const batch = testQueries.slice(i, i + 10);
    const promises = batch.map(async (item) => {
      const qStart = performance.now();
      const colRef = collection(db, item.rec.col);
      let q;
      if (item.isName) {
        q = query(colRef, where('category', '==', item.rec.category), where('nameSearchTokens', 'array-contains', item.term), where('isDeleted', '==', false), limit(15));
      } else if (item.isMobile) {
        q = query(colRef, where('category', '==', item.rec.category), where('mobileNumber', '==', item.term), where('isDeleted', '==', false), limit(10));
      } else {
        q = query(colRef, where('category', '==', item.rec.category), where('registrationCode', '==', item.term), where('isDeleted', '==', false), limit(5));
      }
      await getDocs(q);
      const elapsed = performance.now() - qStart;
      lockstepLatencies.push(elapsed);
    });
    await Promise.all(promises);
  }
  const lockstepDuration = performance.now() - tLockstepStart;
  const lockstepStats = calculateStats(lockstepLatencies);

  // Model B: True Worker Pool (10 parallel persistent workers consuming a shared queue)
  const poolLatencies = [];
  let queryIndex = 0;
  const tPoolStart = performance.now();

  async function poolWorker() {
    while (queryIndex < testQueries.length) {
      const idx = queryIndex++;
      if (idx >= testQueries.length) break;
      const item = testQueries[idx];
      const qStart = performance.now();
      const colRef = collection(db, item.rec.col);
      let q;
      if (item.isName) {
        q = query(colRef, where('category', '==', item.rec.category), where('nameSearchTokens', 'array-contains', item.term), where('isDeleted', '==', false), limit(15));
      } else if (item.isMobile) {
        q = query(colRef, where('category', '==', item.rec.category), where('mobileNumber', '==', item.term), where('isDeleted', '==', false), limit(10));
      } else {
        q = query(colRef, where('category', '==', item.rec.category), where('registrationCode', '==', item.term), where('isDeleted', '==', false), limit(5));
      }
      await getDocs(q);
      const elapsed = performance.now() - qStart;
      poolLatencies.push(elapsed);
    }
  }

  const workers = Array.from({ length: 10 }, () => poolWorker());
  await Promise.all(workers);
  const poolDuration = performance.now() - tPoolStart;
  const poolStats = calculateStats(poolLatencies);

  console.log('CONCURRENCY MODEL COMPARISON:');
  console.log(`Lockstep Batches (Promise.all in for-loop): Duration=${(lockstepDuration/1000).toFixed(2)}s | p50=${lockstepStats.p50}ms | p90=${lockstepStats.p90}ms | p95=${lockstepStats.p95}ms | p99=${lockstepStats.p99}ms | Max=${lockstepStats.max}ms`);
  console.log(`True Worker Pool (10 continuous workers) : Duration=${(poolDuration/1000).toFixed(2)}s | p50=${poolStats.p50}ms | p90=${poolStats.p90}ms | p95=${poolStats.p95}ms | p99=${poolStats.p99}ms | Max=${poolStats.max}ms\n`);

  console.log('Sample raw latencies from Lockstep Batch:');
  console.log(lockstepLatencies.slice(0, 20).map((v) => +v.toFixed(1)).join(', '));
  console.log('Sample raw latencies from Worker Pool:');
  console.log(poolLatencies.slice(0, 20).map((v) => +v.toFixed(1)).join(', '));
}

runProfiler().catch(console.error);
