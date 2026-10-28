import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { EventSettings, CenterConfig } from '@/types';

const SETTINGS_DOC_ID = 'current';
const LOCAL_STORAGE_SETUP_KEY = 'baps_event_setup_completed';

export const DEFAULT_CENTERS: CenterConfig[] = [
  {
    id: 'chandlodiya',
    name: 'Chandlodiya',
    gujaratiName: 'ચાંદલોડિયા',
    codePrefix: 'C',
    date: '2026-10-31',
    day: 'Saturday (શનિવાર)',
    time: '05:00 PM – 08:00 PM',
    venue: 'BAPS Swaminarayan Sanskardham, Chandlodiya',
    address: 'Near Chandlodiya Lake, Ahmedabad',
    balStartCode: 1,
    balikaStartCode: 1001,
    balBoxCutoff: 400,
    balikaBoxCutoff: 1400,
  },
  {
    id: 'vadaj',
    name: 'Vadaj',
    gujaratiName: 'વાડજ',
    codePrefix: 'V',
    date: '2026-11-01',
    day: 'Sunday (રવિવાર)',
    time: '05:00 PM – 08:00 PM',
    venue: 'BAPS Swaminarayan Sanskardham, Vadaj',
    address: 'BAPS Mandir Road, Vadaj, Ahmedabad',
    balStartCode: 1,
    balikaStartCode: 1001,
    balBoxCutoff: 400,
    balikaBoxCutoff: 1400,
  },
];

export const DEFAULT_LOCALITIES: string[] = [
  'Chandlodiya',
  'Vadaj',
  'Nirnaynagar',
  'Ognaj',
  'Tragad',
  'Ranip',
  'Gota',
  'Sola',
  'Ghatlodiya',
  'Memnagar',
  'Naranpura',
  'Akhbarnagar',
  'Usmanpura',
  'Ambawadi',
  'Satellite',
  'Vastrapur',
  'Jodhpur',
  'Bopal',
  'Other',
];

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  eventName: 'Anandotsav 2026',
  organizationName: 'BAPS Swaminarayan Sanstha',
  helplinePhone: '+91 98765 43210',
  helplineWhatsApp: '+91 98765 43210',
  eventDate: '2026-11-01',
  eventTime: '05:00 PM – 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી)',
  venue: 'BAPS Swaminarayan Sanskardham (Chandlodiya & Vadaj)',
  address: 'Ahmedabad, Gujarat',
  description: 'Grand Diwali Children Celebration featuring adventure game zones, cultural exhibitions, joyful challenges, festive treats, and exciting prizes for all Bal and Balika participants.',
  instructions: 'Please arrive on time at your chosen venue. Hand over your child name or mobile number at the entry registration counter to collect the physical games card.',
  contactInformation: '+91 98765 43210 / info@anandotsav.org',
  logoUrl: '/anandotsav-logo.png',
  bannerUrl: null,
  photoUrls: [],
  publicRegistrationEnabled: true,
  onSpotRegistrationEnabled: true,
  automaticClosingAt: null,
  broadcastAnnouncement: null,
  broadcastActive: false,

  setupCompleted: false,
  centers: DEFAULT_CENTERS,
  customAreas: DEFAULT_LOCALITIES,
  
  // Specific Vistar Details (Legacy sync)
  vadajDate: '2026-11-01',
  vadajDay: 'Sunday (રવિવાર)',
  vadajTime: '05:00 PM – 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી)',
  vadajVenue: 'BAPS Swaminarayan Sanskardham, Vadaj',

  chandlodiyaDate: '2026-10-31',
  chandlodiyaDay: 'Saturday (શનિવાર)',
  chandlodiyaTime: '05:00 PM – 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી)',
  chandlodiyaVenue: 'BAPS Swaminarayan Sanskardham, Chandlodiya',

  updatedAt: new Date().toISOString(),
};

/**
 * Fetch current event settings. Falls back to default if not yet populated.
 */
export async function getEventSettings(): Promise<EventSettings> {
  try {
    const snap = await getDoc(doc(db, 'eventSettings', SETTINGS_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() as EventSettings;
      // Ensure centers array exists
      if (!data.centers || data.centers.length === 0) {
        data.centers = DEFAULT_CENTERS;
      }
      return data;
    }
    // Seed default settings on first load
    await setDoc(doc(db, 'eventSettings', SETTINGS_DOC_ID), {
      ...DEFAULT_EVENT_SETTINGS,
      serverUpdatedAt: serverTimestamp(),
    });
    return DEFAULT_EVENT_SETTINGS;
  } catch (err) {
    console.warn('Error reading event settings, returning defaults:', err);
    return DEFAULT_EVENT_SETTINGS;
  }
}

/**
 * Check if the initial setup wizard has been completed.
 */
export async function isSetupCompleted(): Promise<boolean> {
  // Check local cache first for instant page loads
  if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_SETUP_KEY) === 'true') {
    return true;
  }

  try {
    const settings = await getEventSettings();
    const isDone = Boolean(settings.setupCompleted);
    if (isDone && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SETUP_KEY, 'true');
    }
    return isDone;
  } catch {
    return false;
  }
}

/**
 * Mark setup wizard as completed and persist settings.
 */
export async function completeSetupWizard(settings: Partial<EventSettings>): Promise<void> {
  const current = await getEventSettings();
  const merged: EventSettings = {
    ...current,
    ...settings,
    setupCompleted: true,
    setupCompletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'eventSettings', SETTINGS_DOC_ID), {
    ...merged,
    serverUpdatedAt: serverTimestamp(),
  }, { merge: true });

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SETUP_KEY, 'true');
  }
}

/**
 * Fetch configured centers.
 */
export async function getEffectiveCenters(): Promise<CenterConfig[]> {
  try {
    const s = await getEventSettings();
    if (s.centers && s.centers.length > 0) {
      return s.centers;
    }
    return DEFAULT_CENTERS;
  } catch {
    return DEFAULT_CENTERS;
  }
}

/**
 * Update event settings in Firestore.
 */
export async function updateEventSettings(updates: Partial<EventSettings>): Promise<void> {
  const current = await getEventSettings();
  const merged: EventSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'eventSettings', SETTINGS_DOC_ID), {
    ...merged,
    serverUpdatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Upload an image file for logo or banner.
 * Tries Firebase Storage first; falls back to an optimized base64 data URL.
 */
export async function uploadBrandingImage(file: File): Promise<string> {
  // Option 1: Try Firebase Storage
  try {
    if (storage && storage.app) {
      const ext = file.name.split('.').pop() || 'png';
      const storageRef = ref(storage, `branding/logo_${Date.now()}.${ext}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    }
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed or not enabled, falling back to base64:', storageErr);
  }

  // Option 2: Fallback to high-quality compressed Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        return reject(new Error('Failed to read image file'));
      }

      // Resize image to max 600px width/height for fast loading
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(result); // Return original if canvas fails
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/png', 0.9);
        resolve(compressed);
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
