import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYCZFL7XB1TNg1nWqCKTbyOW9N5pQCj_c",
  authDomain: "diwali-test-3ab6c.firebaseapp.com",
  projectId: "diwali-test-3ab6c",
  storageBucket: "diwali-test-3ab6c.firebasestorage.app",
  messagingSenderId: "461606904055",
  appId: "1:461606904055:web:ba757233f13e705ee0b3f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Checking Firestore collections for diwali-test-3ab6c...");
  const regSnap = await getDocs(collection(db, 'registrations'));
  console.log(`Found ${regSnap.size} documents in 'registrations'`);

  let chdCount = 0;
  let vadCount = 0;

  for (const d of regSnap.docs) {
    const data = d.data();
    const vistar = data.vistar || (data.registrationCode && data.registrationCode.includes('-1') ? 'CHANDLODIYA' : 'VADAJ');
    const targetColl = vistar === 'CHANDLODIYA' ? 'chandlodiya' : 'vadaj';

    await setDoc(doc(db, targetColl, d.id), {
      ...data,
      vistar: vistar
    });

    if (targetColl === 'chandlodiya') chdCount++;
    else vadCount++;
  }

  console.log(`Copied ${chdCount} documents to 'chandlodiya' collection`);
  console.log(`Copied ${vadCount} documents to 'vadaj' collection`);

  // Ensure both collections exist in Firestore Console by adding an info/center document
  await setDoc(doc(db, 'chandlodiya', '_center_info'), {
    vistar: 'CHANDLODIYA',
    name: 'BAPS Swaminarayan Sanskardham, Chandlodiya',
    eventDate: '31/10/2026 (Saturday)',
    eventTime: '05:00 PM to 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી)',
    seriesCode: 'C-1 to C-1000 (BAL) / C-1001+ (BLK)',
    updatedAt: new Date().toISOString()
  });
  console.log("Verified 'chandlodiya' collection with _center_info document");

  await setDoc(doc(db, 'vadaj', '_center_info'), {
    vistar: 'VADAJ',
    name: 'BAPS Swaminarayan Sanskardham, Vadaj',
    eventDate: '01/11/2026 (Sunday)',
    eventTime: '05:00 PM to 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી)',
    seriesCode: 'V-1 to V-1000 (BAL) / V-1001+ (BLK)',
    updatedAt: new Date().toISOString()
  });
  console.log("Verified 'vadaj' collection with _center_info document");

  console.log("SUCCESS: Firestore now has 'chandlodiya' and 'vadaj' as active collections!");
}

run().then(() => process.exit(0)).catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
