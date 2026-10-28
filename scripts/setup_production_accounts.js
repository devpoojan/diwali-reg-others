import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc 
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

async function setupAccounts() {
  console.log('=== SETTING UP PRODUCTION STAFF ACCOUNTS IN FIREBASE AUTH & FIRESTORE ===');
  console.log(`Default password for all accounts: ${DEFAULT_PASSWORD}\n`);

  for (const acc of STAFF_ACCOUNTS) {
    let uid = '';
    let isNew = false;

    // 1. Check if user already exists in Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, acc.email, DEFAULT_PASSWORD);
      uid = cred.user.uid;
      console.log(`[EXISTS] User ${acc.email} exists in Firebase Auth (UID: ${uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Create user
        try {
          const newCred = await createUserWithEmailAndPassword(auth, acc.email, DEFAULT_PASSWORD);
          uid = newCred.user.uid;
          await updateProfile(newCred.user, { displayName: acc.displayName });
          isNew = true;
          console.log(`[CREATED] User ${acc.email} created in Firebase Auth (UID: ${uid})`);
        } catch (createErr) {
          console.error(`[ERROR] Failed to create user ${acc.email}:`, createErr.message);
          continue;
        }
      } else {
        console.error(`[ERROR] Login check error for ${acc.email}:`, err.code, err.message);
        continue;
      }
    }

    if (!uid) continue;

    // 2. Write profile to Firestore /users/{uid}
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

    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`  └─ Synced Firestore profile: users/${uid} [Role: ${acc.role}, Scope: ${acc.categoryAccess}]`);
  }

  console.log('\n=== ALL STAFF ACCOUNTS CONFIGURED SUCCESSFULLY! ===');
}

setupAccounts().then(() => process.exit(0)).catch((err) => {
  console.error('Account setup failed:', err);
  process.exit(1);
});
