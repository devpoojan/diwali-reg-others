import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYCZFL7XB1TNg1nWqCKTbyOW9N5pQCj_c",
  authDomain: "diwali-test-3ab6c.firebaseapp.com",
  projectId: "diwali-test-3ab6c",
  storageBucket: "diwali-test-3ab6c.firebasestorage.app",
  messagingSenderId: "461606904055",
  appId: "1:461606904055:web:ba757233f13e705ee0b3f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = 'Anandotsav@2026';

const STAFF_ACCOUNTS = [
  {
    email: 'superadmin@anandotsav.baps.org',
    displayName: 'Super Admin',
    role: 'SUPER_ADMIN',
    categoryAccess: 'BOTH',
    accountType: 'INDIVIDUAL',
    usernameAliases: ['superadmin', 'su']
  },
  {
    email: 'admin@anandotsav.baps.org',
    displayName: 'Event Administrator',
    role: 'ADMIN',
    categoryAccess: 'BOTH',
    accountType: 'INDIVIDUAL',
    usernameAliases: ['admin']
  },
  {
    email: 'bal.volunteer@anandotsav.baps.org',
    displayName: 'BAL Volunteer Team (Shared)',
    role: 'VOLUNTEER',
    categoryAccess: 'BAL_ONLY',
    accountType: 'SHARED',
    usernameAliases: ['bal', 'bal.volunteer', 'volunteer.bal']
  },
  {
    email: 'blk.volunteer@anandotsav.baps.org',
    displayName: 'BLK Volunteer Team (Shared)',
    role: 'VOLUNTEER',
    categoryAccess: 'BLK_ONLY',
    accountType: 'SHARED',
    usernameAliases: ['blk', 'blk.volunteer', 'volunteer.blk']
  },
  {
    email: 'coordinator.bal@anandotsav.baps.org',
    displayName: 'BAL Vibhag Coordinator',
    role: 'COORDINATOR',
    categoryAccess: 'BAL_ONLY',
    accountType: 'INDIVIDUAL',
    usernameAliases: ['coord.bal', 'coordinator.bal']
  },
  {
    email: 'coordinator.blk@anandotsav.baps.org',
    displayName: 'BLK Vibhag Coordinator',
    role: 'COORDINATOR',
    categoryAccess: 'BLK_ONLY',
    accountType: 'INDIVIDUAL',
    usernameAliases: ['coord.blk', 'coordinator.blk']
  }
];

async function deleteCollectionDocs(collName, keepPrefixes = []) {
  console.log(`Checking collection '${collName}'...`);
  const snap = await getDocs(collection(db, collName));
  const docsToDelete = snap.docs.filter((d) => {
    return !keepPrefixes.some((prefix) => d.id.startsWith(prefix));
  });

  console.log(`Found ${docsToDelete.length} documents to clean in '${collName}'`);
  if (docsToDelete.length === 0) return;

  const batch = writeBatch(db);
  docsToDelete.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
  console.log(`Deleted ${docsToDelete.length} documents from '${collName}'.`);
}

async function main() {
  console.log("==================================================================");
  console.log("     BAPS ANANDOTSAV 2026 — PRODUCTION DATABASE SETUP           ");
  console.log("==================================================================\n");

  console.log("Authenticating Super Admin session...");
  await signInWithEmailAndPassword(auth, 'superadmin@anandotsav.baps.org', DEFAULT_PASSWORD);
  console.log("✓ Super Admin authenticated successfully\n");

  // 1. Clean test registration data from center collections
  await deleteCollectionDocs('registrations');
  await deleteCollectionDocs('registrationCounters');
  await deleteCollectionDocs('chandlodiya', ['_center_config', 'counter_']);
  await deleteCollectionDocs('vadaj', ['_center_config', 'counter_']);

  console.log("\n--- Initializing Center Configurations & Counters ---");

  // 2. Initialize Chandlodiya Center
  await setDoc(doc(db, 'chandlodiya', '_center_config'), {
    vistar: 'CHANDLODIYA',
    name: 'BAPS Swaminarayan Sanskardham, Chandlodiya',
    eventDate: '2026-10-31',
    eventDayGujarati: 'શનિવાર',
    eventDateGujarati: '૩૧/૧૦/૨૦૨૬',
    eventTime: '05:00 PM to 08:00 PM',
    eventTimeGujarati: 'સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી',
    balSeriesBase: 1000,
    blkSeriesBase: 1000,
    createdAt: new Date().toISOString()
  });

  await setDoc(doc(db, 'chandlodiya', 'counter_BAL'), {
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    lastAllocatedNumber: 1000,
    updatedAt: new Date().toISOString()
  });

  await setDoc(doc(db, 'chandlodiya', 'counter_BLK'), {
    category: 'BLK',
    vistar: 'CHANDLODIYA',
    lastAllocatedNumber: 1000,
    updatedAt: new Date().toISOString()
  });
  console.log("✓ Chandlodiya center & counters initialized (BAL: 1000, BLK: 1000)");

  // 3. Initialize Vadaj Center
  await setDoc(doc(db, 'vadaj', '_center_config'), {
    vistar: 'VADAJ',
    name: 'BAPS Swaminarayan Sanskardham, Vadaj',
    eventDate: '2026-11-01',
    eventDayGujarati: 'રવિવાર',
    eventDateGujarati: '૦૧/૧૧/૨૦૨૬',
    eventTime: '05:00 PM to 08:00 PM',
    eventTimeGujarati: 'સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી',
    balSeriesBase: 0,
    blkSeriesBase: 0,
    createdAt: new Date().toISOString()
  });

  await setDoc(doc(db, 'vadaj', 'counter_BAL'), {
    category: 'BAL',
    vistar: 'VADAJ',
    lastAllocatedNumber: 0,
    updatedAt: new Date().toISOString()
  });

  await setDoc(doc(db, 'vadaj', 'counter_BLK'), {
    category: 'BLK',
    vistar: 'VADAJ',
    lastAllocatedNumber: 0,
    updatedAt: new Date().toISOString()
  });
  console.log("✓ Vadaj center & counters initialized (BAL: 0, BLK: 0)");

  // 4. Initialize Event Settings
  console.log("\n--- Initializing Event Settings ---");
  await setDoc(doc(db, 'eventSettings', 'current'), {
    publicRegistrationEnabled: true,
    onSpotRegistrationEnabled: true,
    automaticClosingAt: null,
    broadcastActive: false,
    broadcastAnnouncement: '',
    eventName: 'આનંદોત્સવ ૨૦૨૬',
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log("✓ Event settings (current) initialized (Public: ON, On-spot: ON)");

  // 5. Initialize Card Printing Settings
  await setDoc(doc(db, 'eventSettings', 'cardPrinting'), {
    chandlodiyaBalCutoff: 1000,
    chandlodiyaBlkCutoff: 1000,
    vadajBalCutoff: 0,
    vadajBlkCutoff: 0,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Production System Setup'
  }, { merge: true });
  console.log("✓ Card printing cutoff settings initialized");

  // 6. Initialize Statistics
  console.log("\n--- Resetting Department & Vistar Statistics ---");
  const statsKeys = [
    'BAL',
    'BLK',
    'CHANDLODIYA_BAL',
    'CHANDLODIYA_BLK',
    'VADAJ_BAL',
    'VADAJ_BLK'
  ];

  for (const key of statsKeys) {
    const isBlk = key.includes('BLK');
    const isChd = key.includes('CHANDLODIYA');
    const isVad = key.includes('VADAJ');
    const category = isBlk ? 'BLK' : 'BAL';
    const vistar = isChd ? 'CHANDLODIYA' : isVad ? 'VADAJ' : undefined;

    await setDoc(doc(db, 'statistics', key), {
      category,
      ...(vistar ? { vistar } : {}),
      totalRegistrations: 0,
      activeRegistrations: 0,
      cardsIssued: 0,
      accompanyingPersonsCount: 0,
      totalAttendance: 0,
      updatedAt: new Date().toISOString()
    });
  }
  console.log("✓ All 6 statistics records initialized to 0");

  // 7. Seed & Verify Staff Accounts in Firebase Auth & Firestore
  console.log("\n--- Verifying & Seeding Staff Accounts ---");
  console.log(`Default password for all staff: ${DEFAULT_PASSWORD}`);

  for (const acc of STAFF_ACCOUNTS) {
    let uid = '';
    let isNew = false;

    try {
      const cred = await signInWithEmailAndPassword(auth, acc.email, DEFAULT_PASSWORD);
      uid = cred.user.uid;
      console.log(`✓ [AUTH OK] ${acc.email} (UID: ${uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, acc.email, DEFAULT_PASSWORD);
          uid = newCred.user.uid;
          await updateProfile(newCred.user, { displayName: acc.displayName });
          isNew = true;
          console.log(`+ [AUTH CREATED] ${acc.email} (UID: ${uid})`);
        } catch (createErr) {
          console.error(`✗ [AUTH FAILED] ${acc.email}:`, createErr.message);
          continue;
        }
      } else {
        console.error(`✗ [AUTH ERROR] ${acc.email}:`, err.code, err.message);
        continue;
      }
    }

    if (!uid) continue;

    const userDocRef = doc(db, 'users', uid);
    const profileData = {
      uid,
      email: acc.email,
      displayName: acc.displayName,
      role: acc.role,
      categoryAccess: acc.categoryAccess,
      accountType: acc.accountType,
      status: 'ACTIVE',
      usernameAliases: acc.usernameAliases,
      updatedAt: new Date().toISOString()
    };

    if (isNew) {
      profileData.createdAt = new Date().toISOString();
    }

    // Ensure Super Admin privileges when updating users collection
    await signInWithEmailAndPassword(auth, 'superadmin@anandotsav.baps.org', DEFAULT_PASSWORD);
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`  └─ Synced Firestore users/${uid} [${acc.role} | ${acc.categoryAccess}]`);
  }

  console.log("\n==================================================================");
  console.log("      PRODUCTION DATABASE IS READY FOR TESTING!                  ");
  console.log("==================================================================");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
