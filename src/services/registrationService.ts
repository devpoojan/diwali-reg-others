import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  getDoc,
  increment,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DepartmentCategory, Registration, RegistrationSource, Vistar } from '@/types';

/** Monotonically increasing search generation counter — used to discard stale in-flight results. */
let _searchGeneration = 0;
export function advanceSearchGeneration(): number {
  return ++_searchGeneration;
}
export function currentSearchGeneration(): number {
  return _searchGeneration;
}

export interface CreateRegistrationInput {
  category: DepartmentCategory;
  vistar: Vistar;
  firstName?: string;
  fatherName?: string;
  surname?: string;
  mobileNumber?: string;
  source: RegistrationSource;
  houseNumber?: string;
  societyName?: string;
  area?: string;
}

export interface PublicRegistrationResponse {
  success: boolean;
  message: string;
}

export interface StaffRegistrationResponse {
  success: boolean;
  registrationId: string;
  registrationCode: string;
}

/**
 * Generate comprehensive prefix tokens for fast Firestore search-as-you-type.
 */
export function generateSearchTokens(firstName: string = '', fatherName: string = '', surname: string = ''): string[] {
  const tokens = new Set<string>();
  const cleanFirst = (firstName || '').trim().toLowerCase();
  const cleanFather = (fatherName || '').trim().toLowerCase();
  const cleanSurname = (surname || '').trim().toLowerCase();
  const full = [cleanFirst, cleanFather, cleanSurname].filter(Boolean).join(' ');

  const words = [cleanFirst, cleanFather, cleanSurname, full];
  for (const word of words) {
    if (!word) continue;
    for (let i = 1; i <= Math.min(word.length, 25); i++) {
      tokens.add(word.substring(0, i));
    }
  }

  return Array.from(tokens);
}

/**
 * Helper to determine the Firestore collection for a Vistar.
 */
export function getVistarCollection(vistar: Vistar | string): 'chandlodiya' | 'vadaj' {
  if (vistar === 'CHANDLODIYA' || vistar === 'chandlodiya') return 'chandlodiya';
  return 'vadaj';
}

/**
 * Creates a registration with atomic sequential code generation.
 * - Vadaj: BAL is V-1 to 1000, BALIKA is V-1001 onwards in /vadaj
 * - Chandlodiya: BAL is C-1 to 1000, BALIKA is C-1001 onwards in /chandlodiya
 * - In walk-in (ON_THE_SPOT), all name and contact fields are optional.
 */
export async function createRegistration(
  input: CreateRegistrationInput
): Promise<StaffRegistrationResponse> {
  const firstName = input.firstName ? input.firstName.trim() : '';
  const fatherName = input.fatherName ? input.fatherName.trim() : '';
  const surname = input.surname ? input.surname.trim() : '';
  const mobileNumber = input.mobileNumber ? input.mobileNumber.replace(/\D/g, '') : '';
  const houseNumber = input.houseNumber ? input.houseNumber.trim() : '';
  const societyName = input.societyName ? input.societyName.trim() : '';
  const area = input.area ? input.area.trim() : '';
  const nameParts = [firstName, fatherName, surname].filter(Boolean);
  const fullName = nameParts.length > 0 
    ? nameParts.join(' ') 
    : (input.source === 'ON_THE_SPOT' ? 'Walk-in Child' : '');
  const category = input.category;
  const vistar = input.vistar;
  const source = input.source;

  if (!vistar) {
    throw new Error('Vistar (Area) is required.');
  }

  // Strict validation applies only to public ONLINE registrations
  if (source === 'ONLINE') {
    if (!firstName || !fatherName || !surname) {
      throw new Error('First name, father name, and surname are required.');
    }

    const englishNameRegex = /^[A-Za-z\s.'-]+$/;
    if (!englishNameRegex.test(firstName) || !englishNameRegex.test(fatherName) || !englishNameRegex.test(surname)) {
      throw new Error('Child name, father name, and surname must only contain English letters (A–Z).');
    }

    if (mobileNumber.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
  }

  const vistarColName = getVistarCollection(vistar);
  const areaColRef = collection(db, vistarColName);
  const areaCounterRef = doc(db, vistarColName, `counter_${category}`);
  
  // Legacy references maintained for full backward compatibility & dual synchronization
  const legacyCounterRef = doc(db, 'registrationCounters', `${vistar}_${category}`);
  const statsRef = doc(db, 'statistics', category);
  const vistarStatsRef = doc(db, 'statistics', `${vistar}_${category}`);
  
  // Create document reference directly inside center collection (e.g. /chandlodiya/{id} or /vadaj/{id})
  const areaRegDoc = doc(areaColRef);
  const regId = areaRegDoc.id;
  const legacyRegDoc = doc(db, 'registrations', regId);

  let allocatedCode = '';

  await runTransaction(db, async (transaction) => {
    // 1. Read registration counter directly from center collection or fallback
    const areaCounterSnap = await transaction.get(areaCounterRef);
    
    // New Code Specifications:
    // VADAJ: BAL -> V-1 to 1000, BALIKA -> V-1001 onwards
    // CHANDLODIYA: BAL -> C-1 to 1000, BALIKA -> C-1001 onwards
    const defaultBase = category === 'BLK' ? 1000 : 0;
    
    let lastNumber = defaultBase;
    if (areaCounterSnap.exists()) {
      const stored = areaCounterSnap.data()?.lastAllocatedNumber;
      if (typeof stored === 'number') {
        if (category === 'BAL') {
          // If stored counter was from previous legacy base (>= 1000), reset to 0
          lastNumber = stored >= 1000 ? 0 : stored;
        } else {
          // BLK must be at least 1000 so next allocated is 1001+
          lastNumber = stored < 1000 ? 1000 : stored;
        }
      }
    } else {
      const legacyCounterSnap = await transaction.get(legacyCounterRef);
      if (legacyCounterSnap.exists()) {
        const stored = legacyCounterSnap.data()?.lastAllocatedNumber;
        if (typeof stored === 'number') {
          if (category === 'BAL') {
            lastNumber = stored >= 1000 ? 0 : stored;
          } else {
            lastNumber = stored < 1000 ? 1000 : stored;
          }
        }
      }
    }

    const nextNumber = lastNumber + 1;
    const centerPrefix = vistar === 'CHANDLODIYA' ? 'C' : 'V';
    allocatedCode = `${centerPrefix}-${nextNumber}`;

    // 2. Prepare registration document
    const searchTokens = generateSearchTokens(firstName, fatherName, surname);
    const now = new Date().toISOString();

    const recordData: Omit<Registration, 'id'> & { serverCreatedAt: DocumentData; serverUpdatedAt: DocumentData } = {
      registrationCode: allocatedCode,
      category,
      vistar,
      firstName,
      fatherName,
      surname,
      fullName,
      mobileNumber,
      source,
      houseNumber,
      societyName,
      area,
      cardStatus: 'NOT_ISSUED',
      accompanyingPersonsCount: 0,
      cardIssuedAt: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: now,
      updatedAt: now,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
      fullNameNormalized: fullName.toLowerCase(),
      mobileNumberNormalized: mobileNumber,
      registrationCodeNormalized: allocatedCode.replace('-', '').toLowerCase(),
      nameSearchTokens: searchTokens,
    };

    // 3. Atomic writes: Primary write to center collection + dual sync to registrations
    transaction.set(areaRegDoc, recordData);
    transaction.set(legacyRegDoc, recordData);

    // Update center counter and legacy counter
    transaction.set(areaCounterRef, {
      category,
      vistar,
      lastAllocatedNumber: nextNumber,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(legacyCounterRef, {
      category,
      vistar,
      lastAllocatedNumber: nextNumber,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update aggregate statistics with non-conflicting increment
    transaction.set(statsRef, {
      category,
      totalRegistrations: increment(1),
      onlineRegistrations: source === 'ONLINE' ? increment(1) : increment(0),
      onSpotRegistrations: source === 'ON_THE_SPOT' ? increment(1) : increment(0),
      cardsPending: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Also update vistar-scoped statistics
    transaction.set(vistarStatsRef, {
      category,
      vistar,
      totalRegistrations: increment(1),
      onlineRegistrations: source === 'ONLINE' ? increment(1) : increment(0),
      onSpotRegistrations: source === 'ON_THE_SPOT' ? increment(1) : increment(0),
      cardsPending: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  return {
    success: true,
    registrationId: regId,
    registrationCode: allocatedCode,
  };
}

interface RegistrationDocLookup {
  cRef: ReturnType<typeof doc> | null;
  vRef: ReturnType<typeof doc> | null;
  lRef: ReturnType<typeof doc> | null;
  activeRef: ReturnType<typeof doc>;
  data: Registration;
}

/**
 * Resolves a registration across center collections ('chandlodiya', 'vadaj') and legacy 'registrations'.
 */
async function resolveRegistrationDoc(
  transaction: { get: (ref: ReturnType<typeof doc>) => Promise<DocumentData> },
  registrationId: string,
  vistarHint?: Vistar | string
): Promise<RegistrationDocLookup> {
  const cRef = doc(db, 'chandlodiya', registrationId);
  const vRef = doc(db, 'vadaj', registrationId);
  const lRef = doc(db, 'registrations', registrationId);

  // If a known vistar hint is provided, target that specific center collection first
  if (vistarHint === 'CHANDLODIYA') {
    const snapC = await transaction.get(cRef);
    if (snapC.exists()) {
      return {
        cRef,
        vRef: null,
        lRef: null,
        activeRef: snapC.ref,
        data: snapC.data() as Registration,
      };
    }
  } else if (vistarHint === 'VADAJ') {
    const snapV = await transaction.get(vRef);
    if (snapV.exists()) {
      return {
        cRef: null,
        vRef,
        lRef: null,
        activeRef: snapV.ref,
        data: snapV.data() as Registration,
      };
    }
  }

  // Fallback: check remaining collections
  const [snapC, snapV, snapL] = await Promise.all([
    transaction.get(cRef),
    transaction.get(vRef),
    transaction.get(lRef),
  ]);

  const snap = snapC.exists() ? snapC : snapV.exists() ? snapV : snapL;
  if (!snap.exists()) {
    throw new Error('Registration not found.');
  }

  return {
    cRef: snapC.exists() ? cRef : null,
    vRef: snapV.exists() ? vRef : null,
    lRef: snapL.exists() ? lRef : null,
    activeRef: snap.ref,
    data: snap.data() as Registration,
  };
}

function updateRegistrationInAllLocations(
  transaction: { update: (ref: ReturnType<typeof doc>, data: DocumentData) => void },
  lookup: RegistrationDocLookup,
  updateData: DocumentData
) {
  if (lookup.cRef) transaction.update(lookup.cRef, updateData);
  if (lookup.vRef) transaction.update(lookup.vRef, updateData);
  if (lookup.lRef) transaction.update(lookup.lRef, updateData);
  if (!lookup.cRef && !lookup.vRef && !lookup.lRef && lookup.activeRef) {
    transaction.update(lookup.activeRef, updateData);
  }
}

/**
 * Resolves vistar directly from code prefix (C- -> CHANDLODIYA, V- -> VADAJ).
 */
export function getVistarFromRegistrationCode(code?: string): Vistar {
  if (!code) return 'VADAJ';
  const upper = code.toUpperCase();
  if (upper.startsWith('C-')) {
    return 'CHANDLODIYA';
  }
  return 'VADAJ';
}

/**
 * Resolves category from code (<= 1000 -> BAL, > 1000 -> BLK).
 */
export function getCategoryFromRegistrationCode(code?: string): DepartmentCategory {
  if (!code) return 'BAL';
  const match = code.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > 1000) return 'BLK';
    return 'BAL';
  }
  return 'BAL';
}

/**
 * Detect the intended search type from the raw input.
 * Returns 'code', 'mobile', or 'name'.
 */
export function detectSearchType(trimmed: string): 'code' | 'mobile' | 'name' {
  const upper = trimmed.toUpperCase();
  if (
    upper.startsWith('V-') || 
    upper.startsWith('C-')
  ) {
    return 'code';
  }
  // Pure digits: if 10 digits, it's an exact 10-digit mobile lookup
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 10 && digitsOnly === trimmed) return 'mobile';
  // Pure numbers of 1 to 6 digits are code sequence numbers (e.g. 1..1000, 1001+)
  if (/^\d+$/.test(trimmed) && trimmed.length <= 6) return 'code';
  if (digitsOnly.length >= 3 && digitsOnly === trimmed) return 'mobile';
  return 'name';
}

/**
 * Volunteer search supporting:
 * 1. Exact registration code (e.g. V-1, C-1001, or pure number 42 -> V-42 / C-42)
 * 2. Mobile number (3+ digit prefix triggers exact-match on full number; full 10-digit is exact)
 * 3. Child name search-as-you-type (prefix-matched via nameSearchTokens array-contains)
 *
 * OPTIMIZED: Fires exactly ONE query type per collection instead of three in parallel.
 * Searches directly across center collections ('chandlodiya', 'vadaj').
 * The legacy 'registrations' collection is NOT queried — all records are dual-written to
 * center collections on creation. This eliminates 4–5 redundant Firestore round trips.
 *
 * @param generation - Monotonic counter snapshot. Caller compares after await to discard stale results.
 */
export async function searchRegistrations(
  searchTerm: string,
  categoryScope: DepartmentCategory | 'BOTH',
  vistarScope?: Vistar | 'ALL',
  generation?: number
): Promise<{ results: Registration[]; generation: number }> {
  const trimmed = searchTerm.trim();
  if (!trimmed) return { results: [], generation: generation ?? 0 };

  const searchType = detectSearchType(trimmed);
  const upperCode = trimmed.toUpperCase();
  const digitsOnly = trimmed.replace(/\D/g, '');
  const lowerSearch = trimmed.toLowerCase();

  // Smart collection targeting:
  // 1. If vistarScope is specified, query only that center.
  // 2. If code pattern indicates Chandlodiya (C-) or Vadaj (V-), route directly to that single collection.
  let targetCollections: ('chandlodiya' | 'vadaj')[];
  if (vistarScope === 'CHANDLODIYA') {
    targetCollections = ['chandlodiya'];
  } else if (vistarScope === 'VADAJ') {
    targetCollections = ['vadaj'];
  } else if (searchType === 'code') {
    if (upperCode.startsWith('C-')) {
      targetCollections = ['chandlodiya'];
    } else if (upperCode.startsWith('V-')) {
      targetCollections = ['vadaj'];
    } else {
      targetCollections = ['chandlodiya', 'vadaj'];
    }
  } else {
    targetCollections = ['chandlodiya', 'vadaj'];
  }

  const resultsMap = new Map<string, Registration>();

  const addDocs = (docs: DocumentData[], areaName?: Vistar) => {
    for (const d of docs) {
      if (d.id.startsWith('_') || d.id.startsWith('counter_')) continue;
      const data = d.data() as Registration;
      if (!data.isDeleted) {
        resultsMap.set(d.id, {
          ...data,
          id: d.id,
          vistar: data.vistar || areaName || getVistarFromRegistrationCode(data.registrationCode),
        });
      }
    }
  };

  // Fire ONE query per collection based on detected search type.
  // Collections queries run in parallel via Promise.all for maximum throughput.
  const collectionPromises = targetCollections.map(async (colName) => {
    const colRef = collection(db, colName);
    const areaName: Vistar = colName === 'chandlodiya' ? 'CHANDLODIYA' : 'VADAJ';

    if (searchType === 'code') {
      const centerPrefix = colName === 'chandlodiya' ? 'C' : 'V';
      const exactCode = /^\d+$/.test(trimmed)
        ? `${centerPrefix}-${parseInt(trimmed, 10)}`
        : upperCode;

      let q = query(
        colRef,
        where('registrationCode', '==', exactCode),
        where('isDeleted', '==', false),
        limit(5)
      );
      if (categoryScope !== 'BOTH') {
        q = query(colRef,
          where('category', '==', categoryScope),
          where('registrationCode', '==', exactCode),
          where('isDeleted', '==', false),
          limit(5)
        );
      }
      const snap = await getDocs(q);

      // Fallback: If no code matched and number is 3+ digits, also check mobile number
      if (snap.empty && digitsOnly.length >= 3 && /^\d+$/.test(trimmed)) {
        const mobQuery = query(
          colRef,
          where('mobileNumber', '==', digitsOnly),
          where('isDeleted', '==', false),
          limit(5)
        );
        const mobSnap = await getDocs(mobQuery);
        return { docs: mobSnap.docs, areaName };
      }

      return { docs: snap.docs, areaName };
    }

    if (searchType === 'mobile') {
      // Exact mobile number lookup (limit 10 covers all family siblings)
      let q = query(
        colRef,
        where('mobileNumber', '==', digitsOnly),
        where('isDeleted', '==', false),
        limit(10)
      );
      if (categoryScope !== 'BOTH') {
        q = query(colRef,
          where('category', '==', categoryScope),
          where('mobileNumber', '==', digitsOnly),
          where('isDeleted', '==', false),
          limit(10)
        );
      }
      const snap = await getDocs(q);
      return { docs: snap.docs, areaName };
    }

    // searchType === 'name' — prefix token search (top 15 matches)
    let q = query(
      colRef,
      where('nameSearchTokens', 'array-contains', lowerSearch),
      where('isDeleted', '==', false),
      limit(15)
    );
    if (categoryScope !== 'BOTH') {
      q = query(colRef,
        where('category', '==', categoryScope),
        where('nameSearchTokens', 'array-contains', lowerSearch),
        where('isDeleted', '==', false),
        limit(15)
      );
    }
    const snap = await getDocs(q);
    return { docs: snap.docs, areaName };
  });

  const collectionResults = await Promise.all(collectionPromises);
  for (const { docs, areaName } of collectionResults) {
    addDocs(docs, areaName);
  }

  let results = Array.from(resultsMap.values());
  if (vistarScope && vistarScope !== 'ALL') {
    results = results.filter((r) => r.vistar === vistarScope);
  }

  // Always show non-issued cards first and issued cards below
  results.sort((a, b) => {
    const aIssued = a.cardStatus === 'ISSUED' ? 1 : 0;
    const bIssued = b.cardStatus === 'ISSUED' ? 1 : 0;
    return aIssued - bIssued;
  });

  return { results, generation: generation ?? 0 };
}

/**
 * Atomic Card Issuance with mandatory accompanying person count.
 */
export async function issueCard(
  registrationId: string,
  accompanyingCount: number,
  vistarHint?: Vistar | string
): Promise<void> {
  if (accompanyingCount < 0 || !Number.isInteger(accompanyingCount)) {
    throw new Error('Accompanying count must be an integer 0 or greater.');
  }

  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    if (data.isDeleted) {
      throw new Error('Cannot issue card for a deleted registration.');
    }

    if (data.cardStatus === 'ISSUED') {
      throw new Error('Card has already been issued for this registration.');
    }

    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);
    const statsRef = doc(db, 'statistics', data.category);
    const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
    const now = new Date().toISOString();

    // 1. Update registration across center collection and sync
    const updatePayload = {
      cardStatus: 'ISSUED',
      accompanyingPersonsCount: accompanyingCount,
      cardIssuedAt: now,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };
    updateRegistrationInAllLocations(transaction, lookup, updatePayload);

    // 2. Update department statistics atomically with non-conflicting increment
    const statsPayload = {
      category: data.category,
      cardsIssued: increment(1),
      cardsPending: increment(-1),
      accompanyingPersonsPresent: increment(accompanyingCount),
      updatedAt: serverTimestamp(),
    };
    transaction.set(statsRef, statsPayload, { merge: true });
    transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
  });
}

/**
 * Reverse issued card to NOT_ISSUED.
 */
export async function reverseCard(
  registrationId: string,
  vistarHint?: Vistar | string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    if (data.cardStatus !== 'ISSUED') {
      throw new Error('Card is not currently issued.');
    }

    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);
    const statsRef = doc(db, 'statistics', data.category);
    const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
    const now = new Date().toISOString();
    const prevCompanions = data.accompanyingPersonsCount || 0;

    // 1. Reset registration status across center collection and sync
    const updatePayload = {
      cardStatus: 'NOT_ISSUED',
      cardIssuedAt: null,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };
    updateRegistrationInAllLocations(transaction, lookup, updatePayload);

    // 2. Adjust statistics atomically with non-conflicting increment
    const statsPayload = {
      category: data.category,
      cardsIssued: increment(-1),
      cardsPending: increment(1),
      accompanyingPersonsPresent: increment(-prevCompanions),
      updatedAt: serverTimestamp(),
    };
    transaction.set(statsRef, statsPayload, { merge: true });
    transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
  });
}

/**
 * Edit accompanying persons count on an already issued card.
 */
export async function updateAccompanyingCount(
  registrationId: string,
  newCount: number,
  vistarHint?: Vistar | string
): Promise<void> {
  if (newCount < 0 || !Number.isInteger(newCount)) {
    throw new Error('Accompanying count must be an integer 0 or greater.');
  }

  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    if (data.cardStatus !== 'ISSUED') {
      throw new Error('Accompanying count can only be edited on an issued card.');
    }

    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);
    const statsRef = doc(db, 'statistics', data.category);
    const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
    const oldCount = data.accompanyingPersonsCount || 0;
    const delta = newCount - oldCount;
    const now = new Date().toISOString();

    // 1. Update count on registration across center collection and sync
    const updatePayload = {
      accompanyingPersonsCount: newCount,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };
    updateRegistrationInAllLocations(transaction, lookup, updatePayload);

    // 2. Apply delta to attendance statistics atomically with increment
    const statsPayload = {
      category: data.category,
      accompanyingPersonsPresent: increment(delta),
      updatedAt: serverTimestamp(),
    };
    transaction.set(statsRef, statsPayload, { merge: true });
    transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
  });
}

/**
 * Soft delete a registration.
 */
export async function softDeleteRegistration(
  registrationId: string,
  deletedByStaffUid: string,
  vistarHint?: Vistar | string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    if (data.isDeleted) return;

    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);
    const statsRef = doc(db, 'statistics', data.category);
    const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
    const now = new Date().toISOString();

    // 1. Mark as soft-deleted across center collection and sync
    const updatePayload = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: deletedByStaffUid,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };
    updateRegistrationInAllLocations(transaction, lookup, updatePayload);

    // 2. Exclude from active statistics atomically
    const statsPayload = {
      category: data.category,
      totalRegistrations: increment(-1),
      onlineRegistrations: data.source === 'ONLINE' ? increment(-1) : increment(0),
      onSpotRegistrations: data.source === 'ON_THE_SPOT' ? increment(-1) : increment(0),
      cardsIssued: data.cardStatus === 'ISSUED' ? increment(-1) : increment(0),
      cardsPending: data.cardStatus === 'NOT_ISSUED' ? increment(-1) : increment(0),
      accompanyingPersonsPresent: data.cardStatus === 'ISSUED' ? increment(-(data.accompanyingPersonsCount || 0)) : increment(0),
      updatedAt: serverTimestamp(),
    };
    transaction.set(statsRef, statsPayload, { merge: true });
    transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
  });
}

/**
 * Restore a soft-deleted registration.
 */
export async function restoreRegistration(
  registrationId: string,
  vistarHint?: Vistar | string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    if (!data.isDeleted) return;

    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);
    const statsRef = doc(db, 'statistics', data.category);
    const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
    const now = new Date().toISOString();

    // 1. Restore record across center collection and sync
    const updatePayload = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };
    updateRegistrationInAllLocations(transaction, lookup, updatePayload);

    // 2. Re-include in active statistics atomically
    const statsPayload = {
      category: data.category,
      totalRegistrations: increment(1),
      onlineRegistrations: data.source === 'ONLINE' ? increment(1) : increment(0),
      onSpotRegistrations: data.source === 'ON_THE_SPOT' ? increment(1) : increment(0),
      cardsIssued: data.cardStatus === 'ISSUED' ? increment(1) : increment(0),
      cardsPending: data.cardStatus === 'NOT_ISSUED' ? increment(1) : increment(0),
      accompanyingPersonsPresent: data.cardStatus === 'ISSUED' ? increment(data.accompanyingPersonsCount || 0) : increment(0),
      updatedAt: serverTimestamp(),
    };
    transaction.set(statsRef, statsPayload, { merge: true });
    transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
  });
}

/**
 * Permanently delete a single registration across all collections ('chandlodiya', 'vadaj', 'registrations').
 */
export async function deleteRegistrationPermanently(
  registrationId: string,
  vistarHint?: Vistar | string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const lookup = await resolveRegistrationDoc(transaction, registrationId, vistarHint);
    const data = lookup.data;
    const vistar = data.vistar || getVistarFromRegistrationCode(data.registrationCode);

    // If it wasn't already soft-deleted, adjust statistics atomically
    if (!data.isDeleted) {
      const statsRef = doc(db, 'statistics', data.category);
      const vistarStatsRef = doc(db, 'statistics', `${vistar}_${data.category}`);
      const statsPayload = {
        category: data.category,
        totalRegistrations: increment(-1),
        onlineRegistrations: data.source === 'ONLINE' ? increment(-1) : increment(0),
        onSpotRegistrations: data.source === 'ON_THE_SPOT' ? increment(-1) : increment(0),
        cardsIssued: data.cardStatus === 'ISSUED' ? increment(-1) : increment(0),
        cardsPending: data.cardStatus === 'NOT_ISSUED' ? increment(-1) : increment(0),
        accompanyingPersonsPresent: data.cardStatus === 'ISSUED' ? increment(-(data.accompanyingPersonsCount || 0)) : increment(0),
        updatedAt: serverTimestamp(),
      };
      transaction.set(statsRef, statsPayload, { merge: true });
      transaction.set(vistarStatsRef, { ...statsPayload, vistar }, { merge: true });
    }

    if (lookup.cRef) transaction.delete(lookup.cRef);
    if (lookup.vRef) transaction.delete(lookup.vRef);
    if (lookup.lRef) transaction.delete(lookup.lRef);
    if (!lookup.cRef && !lookup.vRef && !lookup.lRef && lookup.activeRef) {
      transaction.delete(lookup.activeRef);
    }
  });
}

/**
 * Fetch a single registration by ID (checks 'chandlodiya', 'vadaj', and 'registrations').
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  const cSnap = await getDoc(doc(db, 'chandlodiya', id));
  if (cSnap.exists() && !id.startsWith('_') && !id.startsWith('counter_')) {
    return { ...cSnap.data(), id: cSnap.id, vistar: 'CHANDLODIYA' } as Registration;
  }
  const vSnap = await getDoc(doc(db, 'vadaj', id));
  if (vSnap.exists() && !id.startsWith('_') && !id.startsWith('counter_')) {
    return { ...vSnap.data(), id: vSnap.id, vistar: 'VADAJ' } as Registration;
  }
  const snap = await getDoc(doc(db, 'registrations', id));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as Registration;
}

/**
 * Permanently deletes all child registrations across 'chandlodiya', 'vadaj', and legacy 'registrations',
 * and resets all sequential counters and statistics back to their starting numbers.
 * 
 * Restricted strictly to Super Admin and Admin after 5 verification checkpoints and master password check.
 */
export async function deleteAllRegistrations(): Promise<{
  deletedCount: number;
  chandlodiyaCount: number;
  vadajCount: number;
  legacyCount: number;
}> {
  // 1. Fetch all non-system documents from chandlodiya
  const cSnap = await getDocs(collection(db, 'chandlodiya'));
  const cDocsToDelete = cSnap.docs.filter(
    (d) => !d.id.startsWith('_') && !d.id.startsWith('counter_')
  );

  // 2. Fetch all non-system documents from vadaj
  const vSnap = await getDocs(collection(db, 'vadaj'));
  const vDocsToDelete = vSnap.docs.filter(
    (d) => !d.id.startsWith('_') && !d.id.startsWith('counter_')
  );

  // 3. Fetch all documents from legacy registrations collection
  const legSnap = await getDocs(collection(db, 'registrations'));
  const legDocsToDelete = legSnap.docs;

  // 4. Batch delete in chunks of 400
  const allDocRefs = [
    ...cDocsToDelete.map((d) => d.ref),
    ...vDocsToDelete.map((d) => d.ref),
    ...legDocsToDelete.map((d) => d.ref),
  ];

  const CHUNK_SIZE = 400;
  for (let i = 0; i < allDocRefs.length; i += CHUNK_SIZE) {
    const chunk = allDocRefs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // 5. Reset sequence counters in partition collections
  // BAL starts from 0 (so next allocated is 1..1000), BLK starts from 1000 (so next allocated is 1001..)
  await setDoc(doc(db, 'chandlodiya', 'counter_BAL'), {
    lastAllocatedNumber: 0,
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'chandlodiya', 'counter_BLK'), {
    lastAllocatedNumber: 1000,
    category: 'BLK',
    vistar: 'CHANDLODIYA',
    updatedAt: serverTimestamp(),
  });

  // Vadaj starts from 0 for BAL and 1000 for BLK
  await setDoc(doc(db, 'vadaj', 'counter_BAL'), {
    lastAllocatedNumber: 0,
    category: 'BAL',
    vistar: 'VADAJ',
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'vadaj', 'counter_BLK'), {
    lastAllocatedNumber: 1000,
    category: 'BLK',
    vistar: 'VADAJ',
    updatedAt: serverTimestamp(),
  });

  // 6. Reset legacy counters in registrationCounters
  await setDoc(doc(db, 'registrationCounters', 'CHANDLODIYA_BAL'), {
    lastAllocatedNumber: 0,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'registrationCounters', 'CHANDLODIYA_BLK'), {
    lastAllocatedNumber: 1000,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'registrationCounters', 'VADAJ_BAL'), {
    lastAllocatedNumber: 0,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'registrationCounters', 'VADAJ_BLK'), {
    lastAllocatedNumber: 1000,
    updatedAt: serverTimestamp(),
  });

  // 7. Reset active statistics documents
  const statsKeys = [
    'BAL',
    'BLK',
    'CHANDLODIYA_BAL',
    'CHANDLODIYA_BLK',
    'VADAJ_BAL',
    'VADAJ_BLK',
  ];
  for (const key of statsKeys) {
    await setDoc(doc(db, 'statistics', key), {
      totalRegistrations: 0,
      onlineRegistrations: 0,
      onSpotRegistrations: 0,
      cardsIssued: 0,
      cardsPending: 0,
      accompanyingPersonsPresent: 0,
      updatedAt: serverTimestamp(),
    });
  }

  // 8. Reset card printing cutoff settings to 0
  await setDoc(
    doc(db, 'eventSettings', 'cardPrinting'),
    {
      chandlodiyaBalCutoff: 0,
      chandlodiyaBlkCutoff: 0,
      vadajBalCutoff: 0,
      vadajBlkCutoff: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    deletedCount: allDocRefs.length,
    chandlodiyaCount: cDocsToDelete.length,
    vadajCount: vDocsToDelete.length,
    legacyCount: legDocsToDelete.length,
  };
}
