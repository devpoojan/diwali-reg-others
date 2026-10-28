import type { Registration, Vistar, DepartmentCategory } from '@/types';
import { getVistarFromRegistrationCode } from '@/services/registrationService';

export interface AreaStatistics {
  areaKey: string;           // Normalized identifier, e.g. 'Nirnaynagar', 'Chandlodiya'
  displayName: string;       // Formatted English name, e.g. 'Nirnaynagar'
  displayGujarati: string;   // Gujarati name, e.g. 'નિર્ણયનગર'
  isPreset: boolean;         // True if one of the standard major areas
  total: number;
  balCount: number;
  blkCount: number;
  issuedCount: number;
  pendingCount: number;
  onlineCount: number;
  onSpotCount: number;
  companionsCount: number;
  totalAttendees: number;    // issuedCount + companionsCount
  percentage: number;        // % of total center registrations
  registrations: Registration[];
}

export interface CenterAreaReport {
  vistar: Vistar | 'ALL';
  totalRegistrations: number;
  totalBal: number;
  totalBlk: number;
  totalIssued: number;
  totalPending: number;
  totalCompanions: number;
  totalAttendees: number;
  areas: AreaStatistics[];
}

/**
 * Standard known areas with bilingual labels
 */
export const KNOWN_AREAS: Record<string, { en: string; gu: string }> = {
  chandlodiya: { en: 'Chandlodiya', gu: 'ચાંદલોડિયા' },
  nirnaynagar: { en: 'Nirnaynagar', gu: 'નિર્ણયનગર' },
  nirnayanagar: { en: 'Nirnaynagar', gu: 'નિર્ણયનગર' },
  ognaj: { en: 'Ognaj', gu: 'ઓગણજ' },
  tragad: { en: 'Tragad', gu: 'ત્રાગડ' },
  vadaj: { en: 'Vadaj', gu: 'વાડજ' },
  unspecified: { en: 'Unspecified', gu: 'નથી દર્શાવેલ' },
  other: { en: 'Other Areas', gu: 'અન્ય વિસ્તારો' },
};

/**
 * Normalize an area string for consistent aggregation
 */
export function normalizeAreaName(rawArea?: string | null): { key: string; name: string; gujarati: string } {
  if (!rawArea || !rawArea.trim()) {
    return {
      key: 'unspecified',
      name: 'Unspecified',
      gujarati: 'નથી દર્શાવેલ',
    };
  }

  const trimmed = rawArea.trim();
  const lower = trimmed.toLowerCase();

  // Standardize Nirnayanagar / Nirnaynagar
  if (lower === 'nirnayanagar' || lower === 'nirnaynagar') {
    return {
      key: 'nirnaynagar',
      name: 'Nirnaynagar',
      gujarati: 'નિર્ણયનગર',
    };
  }

  if (lower === 'chandlodiya' || lower === 'chandlodiyan') {
    return {
      key: 'chandlodiya',
      name: 'Chandlodiya',
      gujarati: 'ચાંદલોડિયા',
    };
  }

  if (lower === 'ognaj') {
    return {
      key: 'ognaj',
      name: 'Ognaj',
      gujarati: 'ઓગણજ',
    };
  }

  if (lower === 'tragad') {
    return {
      key: 'tragad',
      name: 'Tragad',
      gujarati: 'ત્રાગડ',
    };
  }

  if (lower === 'vadaj' || lower === 'nava vadaj' || lower === 'juni vadaj') {
    if (lower === 'vadaj') {
      return {
        key: 'vadaj',
        name: 'Vadaj',
        gujarati: 'વાડજ',
      };
    }
  }

  if (lower === 'other' || lower === 'others') {
    return {
      key: 'other',
      name: 'Other Areas',
      gujarati: 'અન્ય વિસ્તારો',
    };
  }

  // Capitalize custom area name cleanly (e.g. "ghatlodia" -> "Ghatlodia", "new ranip" -> "New Ranip")
  const capitalized = trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    key: lower,
    name: capitalized,
    gujarati: capitalized,
  };
}

/**
 * Compute comprehensive Area-Wise report for a selected Center (or ALL)
 */
export function generateAreaReport(
  allRegistrations: Registration[],
  selectedVistar: Vistar | 'ALL' = 'CHANDLODIYA'
): CenterAreaReport {
  // 1. Filter out soft-deleted records and filter by selected vistar if not ALL
  const targetRegistrations = allRegistrations.filter((reg) => {
    if (reg.isDeleted) return false;
    if (selectedVistar === 'ALL') return true;
    const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
    return vistar === selectedVistar;
  });

  const totalRegistrations = targetRegistrations.length;
  let totalBal = 0;
  let totalBlk = 0;
  let totalIssued = 0;
  let totalPending = 0;
  let totalCompanions = 0;

  // 2. Group registrations by normalized area
  const areaGroups: Record<string, {
    displayName: string;
    displayGujarati: string;
    isPreset: boolean;
    records: Registration[];
  }> = {};

  targetRegistrations.forEach((reg) => {
    if (reg.category === 'BAL') totalBal += 1;
    else totalBlk += 1;

    const isIssued = reg.cardStatus === 'ISSUED';
    const comp = isIssued ? (reg.accompanyingPersonsCount || 0) : 0;
    if (isIssued) {
      totalIssued += 1;
      totalCompanions += comp;
    } else {
      totalPending += 1;
    }

    const { key, name, gujarati } = normalizeAreaName(reg.area);

    if (!areaGroups[key]) {
      const isPreset = ['chandlodiya', 'nirnaynagar', 'ognaj', 'tragad', 'vadaj'].includes(key);
      areaGroups[key] = {
        displayName: name,
        displayGujarati: gujarati,
        isPreset,
        records: [],
      };
    }

    areaGroups[key].records.push(reg);
  });

  // 3. Compile AreaStatistics for each group
  const areaStatsList: AreaStatistics[] = Object.keys(areaGroups).map((key) => {
    const group = areaGroups[key];
    const records = group.records;
    const count = records.length;

    let bal = 0;
    let blk = 0;
    let issued = 0;
    let pending = 0;
    let companions = 0;

    records.forEach((r) => {
      if (r.category === 'BAL') bal += 1;
      else blk += 1;

      if (r.cardStatus === 'ISSUED') {
        issued += 1;
        companions += (r.accompanyingPersonsCount || 0);
      } else {
        pending += 1;
      }
    });

    const online = records.filter((r) => r.source === 'ONLINE').length;
    const onSpot = count - online;
    const pct = totalRegistrations > 0 ? Number(((count / totalRegistrations) * 100).toFixed(1)) : 0;

    return {
      areaKey: key,
      displayName: group.displayName,
      displayGujarati: group.displayGujarati,
      isPreset: group.isPreset,
      total: count,
      balCount: bal,
      blkCount: blk,
      issuedCount: issued,
      pendingCount: pending,
      onlineCount: online,
      onSpotCount: onSpot,
      companionsCount: companions,
      totalAttendees: issued + companions,
      percentage: pct,
      registrations: records,
    };
  });

  // 4. Sort areas logically:
  // Primary preset priority depends on selected center
  const priorityOrder = selectedVistar === 'VADAJ'
    ? ['vadaj', 'nirnaynagar', 'chandlodiya', 'ognaj', 'tragad']
    : ['chandlodiya', 'nirnaynagar', 'ognaj', 'tragad', 'vadaj'];

  areaStatsList.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.areaKey);
    const bPriority = priorityOrder.indexOf(b.areaKey);

    // If both are in preset priority, respect defined priority order
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    // Preset priority comes before custom areas
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    // Unspecified should appear near the end
    if (a.areaKey === 'unspecified') return 1;
    if (b.areaKey === 'unspecified') return -1;

    // Otherwise sort custom areas by highest count first, then alphabetically
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return {
    vistar: selectedVistar,
    totalRegistrations,
    totalBal,
    totalBlk,
    totalIssued,
    totalPending,
    totalCompanions,
    totalAttendees: totalIssued + totalCompanions,
    areas: areaStatsList,
  };
}

/**
 * Filter and sort registrations within an area
 */
export interface AreaFilterOptions {
  searchTerm?: string;
  category?: 'ALL' | DepartmentCategory;
  cardStatus?: 'ALL' | 'ISSUED' | 'NOT_ISSUED';
  source?: 'ALL' | 'ONLINE' | 'ON_THE_SPOT';
  sortBy?: 'CODE' | 'NAME_AZ' | 'LATEST' | 'OLDEST';
}

export function filterAreaRegistrations(
  registrations: Registration[],
  filters: AreaFilterOptions
): Registration[] {
  const {
    searchTerm = '',
    category = 'ALL',
    cardStatus = 'ALL',
    source = 'ALL',
    sortBy = 'CODE',
  } = filters;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = registrations.filter((reg) => {
    // 1. Department Filter
    if (category !== 'ALL' && reg.category !== category) return false;

    // 2. Card Status Filter
    if (cardStatus !== 'ALL' && reg.cardStatus !== cardStatus) return false;

    // 3. Source Filter
    if (source !== 'ALL' && reg.source !== source) return false;

    // 4. Search Filter
    if (normalizedSearch) {
      const code = (reg.registrationCode || '').toLowerCase();
      const name = (reg.fullName || '').toLowerCase();
      const mobile = (reg.mobileNumber || '').toLowerCase();
      const house = (reg.houseNumber || '').toLowerCase();
      const society = (reg.societyName || '').toLowerCase();
      const area = (reg.area || '').toLowerCase();

      const match =
        code.includes(normalizedSearch) ||
        name.includes(normalizedSearch) ||
        mobile.includes(normalizedSearch) ||
        house.includes(normalizedSearch) ||
        society.includes(normalizedSearch) ||
        area.includes(normalizedSearch);

      if (!match) return false;
    }

    return true;
  });

  // Sort
  return filtered.sort((a, b) => {
    if (sortBy === 'NAME_AZ') {
      return (a.fullName || '').localeCompare(b.fullName || '');
    }
    if (sortBy === 'LATEST') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    // Default 'CODE' natural sort
    const numA = parseInt((a.registrationCode || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.registrationCode || '').replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}
