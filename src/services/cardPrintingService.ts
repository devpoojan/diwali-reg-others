import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DepartmentCategory, Vistar } from '@/types';

export interface CardPrintingSettings {
  chandlodiyaBalCutoff: number; // e.g. 50 (means C-1 to C-50 are printed)
  chandlodiyaBlkCutoff: number; // e.g. 1040 (means C-1001 to C-1040 are printed)
  vadajBalCutoff: number;        // e.g. 50 (means V-1 to V-50 are printed)
  vadajBlkCutoff: number;        // e.g. 1040 (means V-1001 to V-1040 are printed)
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PRINTING_SETTINGS: CardPrintingSettings = {
  chandlodiyaBalCutoff: 0,
  chandlodiyaBlkCutoff: 0,
  vadajBalCutoff: 0,
  vadajBlkCutoff: 0,
  updatedAt: new Date().toISOString(),
};

const PRINTING_DOC_PATH = ['eventSettings', 'cardPrinting'] as const;

/**
 * Fetch current card printing cutoff settings from Firestore
 */
export async function getCardPrintingSettings(): Promise<CardPrintingSettings> {
  try {
    const snap = await getDoc(doc(db, PRINTING_DOC_PATH[0], PRINTING_DOC_PATH[1]));
    if (snap.exists()) {
      const data = snap.data();
      return {
        chandlodiyaBalCutoff: Number(data.chandlodiyaBalCutoff) || 0,
        chandlodiyaBlkCutoff: Number(data.chandlodiyaBlkCutoff) || 0,
        vadajBalCutoff: Number(data.vadajBalCutoff) || 0,
        vadajBlkCutoff: Number(data.vadajBlkCutoff) || 0,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || '',
      };
    }
    return DEFAULT_PRINTING_SETTINGS;
  } catch (error) {
    console.error('Failed to fetch card printing settings:', error);
    return DEFAULT_PRINTING_SETTINGS;
  }
}

/**
 * Save card printing cutoff settings to Firestore
 */
export async function updateCardPrintingSettings(
  settings: Partial<CardPrintingSettings>,
  updatedBy: string = 'admin'
): Promise<void> {
  const ref = doc(db, PRINTING_DOC_PATH[0], PRINTING_DOC_PATH[1]);
  const payload = {
    chandlodiyaBalCutoff: Math.max(0, Number(settings.chandlodiyaBalCutoff) || 0),
    chandlodiyaBlkCutoff: Math.max(0, Number(settings.chandlodiyaBlkCutoff) || 0),
    vadajBalCutoff: Math.max(0, Number(settings.vadajBalCutoff) || 0),
    vadajBlkCutoff: Math.max(0, Number(settings.vadajBlkCutoff) || 0),
    updatedAt: new Date().toISOString(),
    updatedBy,
    serverUpdatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
}

/**
 * Subscribe in real time to card printing cutoff settings
 */
export function subscribeToCardPrintingSettings(
  callback: (settings: CardPrintingSettings) => void
): () => void {
  const ref = doc(db, PRINTING_DOC_PATH[0], PRINTING_DOC_PATH[1]);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          chandlodiyaBalCutoff: Number(data.chandlodiyaBalCutoff) || 0,
          chandlodiyaBlkCutoff: Number(data.chandlodiyaBlkCutoff) || 0,
          vadajBalCutoff: Number(data.vadajBalCutoff) || 0,
          vadajBlkCutoff: Number(data.vadajBlkCutoff) || 0,
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || '',
        });
      } else {
        callback(DEFAULT_PRINTING_SETTINGS);
      }
    },
    (err) => {
      console.warn('Realtime subscription to cardPrinting failed:', err);
      callback(DEFAULT_PRINTING_SETTINGS);
    }
  );
}

/**
 * Determines whether a registration card was pre-printed or needs to be written manually.
 *
 * @param registrationCode e.g. "C-15", "V-1025"
 * @param category "BAL" | "BLK"
 * @param vistar "CHANDLODIYA" | "VADAJ"
 * @param settings CardPrintingSettings
 */
export function isCardPrePrinted(
  registrationCode: string | undefined | null,
  category: DepartmentCategory | string | undefined | null,
  vistar: Vistar | string | undefined | null,
  settings: CardPrintingSettings | null | undefined
): boolean {
  if (!settings || !registrationCode) return false;

  const match = registrationCode.match(/(\d+)/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return false;

  const upperCode = registrationCode.toUpperCase();
  const isChandlodiya =
    vistar === 'CHANDLODIYA' ||
    upperCode.startsWith('C-');

  const isBal =
    category === 'BAL' ||
    (category !== 'BLK' && num <= 1000);

  let cutoff = 0;
  if (isChandlodiya) {
    cutoff = isBal ? settings.chandlodiyaBalCutoff : settings.chandlodiyaBlkCutoff;
  } else {
    cutoff = isBal ? settings.vadajBalCutoff : settings.vadajBlkCutoff;
  }

  if (!cutoff || cutoff <= 0) return false;

  return num <= cutoff;
}

/**
 * Formats a sequence number into a readable registration code string (C- or V-)
 */
export function formatCodeNumber(
  _category: 'BAL' | 'BLK',
  num: number,
  vistar?: Vistar
): string {
  if (!num || num <= 0) return 'None (0)';
  if (vistar === 'CHANDLODIYA') return `C-${num}`;
  if (vistar === 'VADAJ') return `V-${num}`;
  return `V-${num}`;
}
