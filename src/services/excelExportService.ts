import * as XLSX from 'xlsx';
import type { Registration, Vistar, DepartmentCategory } from '@/types';
import { 
  getVistarFromRegistrationCode, 
  getCategoryFromRegistrationCode 
} from '@/services/registrationService';
import { 
  isCardPrePrinted, 
  type CardPrintingSettings, 
  getCardPrintingSettings 
} from '@/services/cardPrintingService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { generateAreaReport, normalizeAreaName } from '@/services/areaReportService';

/**
 * Standard column headers for the data table (only combined Child Full Name, no duplicate names)
 */
export const EXCEL_HEADERS = [
  'Sr. No.',
  'Registration Code',
  'Child Full Name',
  'Mobile Number',
  'Center / Vistar',
  'Festival Date & Time',
  'Department',
  'Area / Locality',
  'House No.',
  'Society Name',
  'Full Address',
  'Card Status',
  'Accompanying Persons',
  'Total Attendees',
  'Card Printing Type',
  'Registration Source',
  'Registered Date & Time',
  'Card Issued Date & Time',
  'Soft Deleted',
] as const;

/**
 * Summary KPI column headers displayed at the top of every sheet
 */
export const EXCEL_SUMMARY_METRIC_HEADERS = [
  'Total Registrations',
  'Online Registrations',
  'Walk-in (On-Spot)',
  'Cards Issued (Present)',
  'Cards Pending',
  'Accompanying Persons',
  'Total Attendees (Ground)',
  'Box Cards (Printed)',
  'Blank Cards (Manual)',
] as const;

/**
 * Formatted column widths for auto-sizing in Excel
 */
export const EXCEL_COL_WIDTHS = [
  { wch: 8 },  // Sr. No.
  { wch: 18 }, // Registration Code
  { wch: 30 }, // Child Full Name
  { wch: 15 }, // Mobile Number
  { wch: 16 }, // Center / Vistar
  { wch: 28 }, // Festival Date & Time
  { wch: 22 }, // Department
  { wch: 18 }, // Area / Locality
  { wch: 12 }, // House No.
  { wch: 22 }, // Society Name
  { wch: 34 }, // Full Address
  { wch: 24 }, // Card Status
  { wch: 22 }, // Accompanying Persons
  { wch: 16 }, // Total Attendees
  { wch: 24 }, // Card Printing Type
  { wch: 22 }, // Registration Source
  { wch: 22 }, // Registered Date & Time
  { wch: 22 }, // Card Issued Date & Time
  { wch: 14 }, // Soft Deleted
];

/**
 * Safe date formatter for Indian standard time (IST)
 */
export function formatDateTime(val?: unknown): string {
  if (!val) return '—';
  try {
    let date: Date;
    if (typeof (val as { toDate?: () => Date })?.toDate === 'function') {
      date = (val as { toDate: () => Date }).toDate();
    } else if (typeof val === 'string' || typeof val === 'number') {
      date = new Date(val);
    } else if (val instanceof Date) {
      date = val;
    } else {
      return String(val);
    }
    if (isNaN(date.getTime())) return String(val);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(val);
  }
}

/**
 * Natural registration code comparator (e.g., C-1, C-2, ..., C-9, C-10)
 */
export function compareRegistrationCodes(a?: string, b?: string): number {
  if (!a) return 1;
  if (!b) return -1;
  const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
  const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
  const prefixA = a.replace(/[^a-zA-Z]/g, '');
  const prefixB = b.replace(/[^a-zA-Z]/g, '');
  if (prefixA !== prefixB) {
    return prefixA.localeCompare(prefixB);
  }
  return numA - numB;
}

/**
 * Maps a single Registration record to a clean Excel row object
 */
export function mapRegistrationToExcelRow(
  reg: Registration,
  index: number,
  printingSettings?: CardPrintingSettings | null
): Record<string, string | number> {
  const vistar: Vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
  const category: DepartmentCategory = reg.category || getCategoryFromRegistrationCode(reg.registrationCode);
  const isIssued = reg.cardStatus === 'ISSUED';
  const companions = isIssued ? (reg.accompanyingPersonsCount || 0) : 0;
  const isPrinted = printingSettings 
    ? isCardPrePrinted(reg.registrationCode, category, vistar, printingSettings)
    : false;

  const fullAddress = [reg.houseNumber, reg.societyName, reg.area].filter(Boolean).join(', ') || '—';

  return {
    'Sr. No.': index,
    'Registration Code': reg.registrationCode || '—',
    'Child Full Name': reg.fullName || 'Walk-in Child',
    'Mobile Number': reg.mobileNumber || '',
    'Center / Vistar': vistar === 'CHANDLODIYA' ? 'Chandlodiya' : 'Vadaj',
    'Festival Date & Time': vistar === 'CHANDLODIYA' ? '31/10/2026 (Sat) 5:00-8:00 PM' : '01/11/2026 (Sun) 5:00-8:00 PM',
    'Department': category === 'BAL' ? 'Bal Vibhag (Boys)' : 'Balika Vibhag (Girls)',
    'Area / Locality': reg.area || '',
    'House No.': reg.houseNumber || '',
    'Society Name': reg.societyName || '',
    'Full Address': fullAddress,
    'Card Status': isIssued ? 'ISSUED (કાર્ડ આપેલ)' : 'NOT_ISSUED (બાકી)',
    'Accompanying Persons': companions,
    'Total Attendees': isIssued ? 1 + companions : 0,
    'Card Printing Type': isPrinted ? 'Box Card (Pre-Printed)' : 'Blank Card (Manual)',
    'Registration Source': reg.source === 'ONLINE' ? 'Online Public' : 'On-The-Spot Walk-in',
    'Registered Date & Time': formatDateTime(reg.createdAt),
    'Card Issued Date & Time': isIssued ? formatDateTime(reg.cardIssuedAt) : 'N/A',
    'Soft Deleted': reg.isDeleted ? 'YES (Deleted)' : 'NO (Active)',
  };
}

export interface SheetMetadata {
  title: string;
  venue: string;
  schedule: string;
  dept: string;
  codeRange: string;
}

/**
 * Builds the dedicated "Area Wise Report" sheet with complete locality breakdowns
 * for Chandlodiya, Vadaj, and Combined totals.
 */
export function buildAreaReportSheet(records: Registration[]): XLSX.WorkSheet {
  const chdReport = generateAreaReport(records, 'CHANDLODIYA');
  const vadReport = generateAreaReport(records, 'VADAJ');
  const allReport = generateAreaReport(records, 'ALL');

  const nowStr = formatDateTime(new Date());

  const headers = [
    'Area / Locality',
    'Area (Gujarati)',
    'Total Registrations',
    'Bal (Boys)',
    'Balika (Girls)',
    'Cards Issued (Present)',
    'Cards Pending',
    'Accompanying Persons',
    'Total Attendees (Footfall)',
    '% Share of Center',
  ];

  const merges: XLSX.Range[] = [];
  const aoa: (string | number)[][] = [];

  // Row 1: Title Banner
  aoa.push(['BAPS ANANDOTSAV 2026 — AREA-WISE REGISTRATION & ATTENDANCE REPORT']);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });

  // Row 2: Subtitle
  aoa.push([`Complete Locality & Ground Attendance Breakdown | Export Generated: ${nowStr}`]);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });

  // Row 3: Spacer
  aoa.push([]);

  // --- SECTION 1: CHANDLODIYA ---
  const chdHeaderRowIdx = aoa.length;
  aoa.push(['🏢 1. CHANDLODIYA CENTER — AREA-WISE BREAKDOWN']);
  merges.push({ s: { r: chdHeaderRowIdx, c: 0 }, e: { r: chdHeaderRowIdx, c: 9 } });
  aoa.push(headers);

  chdReport.areas.forEach((area) => {
    aoa.push([
      area.displayName,
      area.displayGujarati,
      area.total,
      area.balCount,
      area.blkCount,
      area.issuedCount,
      area.pendingCount,
      area.companionsCount,
      area.totalAttendees,
      `${area.percentage}%`,
    ]);
  });

  aoa.push([
    'TOTAL CHANDLODIYA',
    'સંપૂર્ણ ચાંદલોડિયા',
    chdReport.totalRegistrations,
    chdReport.totalBal,
    chdReport.totalBlk,
    chdReport.totalIssued,
    chdReport.totalPending,
    chdReport.totalCompanions,
    chdReport.totalAttendees,
    '100%',
  ]);

  // Spacer
  aoa.push([]);

  // --- SECTION 2: VADAJ ---
  const vadHeaderRowIdx = aoa.length;
  aoa.push(['🏛️ 2. VADAJ CENTER — AREA-WISE BREAKDOWN']);
  merges.push({ s: { r: vadHeaderRowIdx, c: 0 }, e: { r: vadHeaderRowIdx, c: 9 } });
  aoa.push(headers);

  vadReport.areas.forEach((area) => {
    aoa.push([
      area.displayName,
      area.displayGujarati,
      area.total,
      area.balCount,
      area.blkCount,
      area.issuedCount,
      area.pendingCount,
      area.companionsCount,
      area.totalAttendees,
      `${area.percentage}%`,
    ]);
  });

  aoa.push([
    'TOTAL VADAJ',
    'સંપૂર્ણ વાડજ',
    vadReport.totalRegistrations,
    vadReport.totalBal,
    vadReport.totalBlk,
    vadReport.totalIssued,
    vadReport.totalPending,
    vadReport.totalCompanions,
    vadReport.totalAttendees,
    '100%',
  ]);

  // Spacer
  aoa.push([]);

  // --- SECTION 3: COMBINED ---
  const combHeaderRowIdx = aoa.length;
  aoa.push(['🌐 3. ALL CENTERS COMBINED — AREA-WISE SUMMARY']);
  merges.push({ s: { r: combHeaderRowIdx, c: 0 }, e: { r: combHeaderRowIdx, c: 9 } });
  aoa.push(headers);

  allReport.areas.forEach((area) => {
    aoa.push([
      area.displayName,
      area.displayGujarati,
      area.total,
      area.balCount,
      area.blkCount,
      area.issuedCount,
      area.pendingCount,
      area.companionsCount,
      area.totalAttendees,
      `${area.percentage}%`,
    ]);
  });

  aoa.push([
    'GRAND TOTAL (ALL CENTERS)',
    'સંપૂર્ણ સંયુક્ત',
    allReport.totalRegistrations,
    allReport.totalBal,
    allReport.totalBlk,
    allReport.totalIssued,
    allReport.totalPending,
    allReport.totalCompanions,
    allReport.totalAttendees,
    '100%',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 24 }, // Area / Locality
    { wch: 20 }, // Area (Gujarati)
    { wch: 20 }, // Total Registrations
    { wch: 14 }, // Bal
    { wch: 14 }, // Balika
    { wch: 22 }, // Cards Issued
    { wch: 16 }, // Cards Pending
    { wch: 22 }, // Accompanying Persons
    { wch: 24 }, // Total Attendees
    { wch: 18 }, // % Share
  ];
  ws['!merges'] = merges;

  return ws;
}

/**
 * Builds a multi-sheet Excel Workbook with Area-Wise Report, Top Sheet Details & Numeric Metric Summary:
 * 1. Area Wise Report
 * 2. All Combined
 * 3. Chandlodiya Bal
 * 4. Chandlodiya Balika
 * 5. Vadaj Bal
 * 6. Vadaj Balika
 */
export function buildMultiSheetWorkbook(
  records: Registration[],
  printingSettings?: CardPrintingSettings | null
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Build and append Area Wise Report Sheet first
  const areaSheet = buildAreaReportSheet(records);
  XLSX.utils.book_append_sheet(wb, areaSheet, 'Area Wise Report');

  // Partition into the 4 sub-groups
  const chdBal: Registration[] = [];
  const chdBlk: Registration[] = [];
  const vadBal: Registration[] = [];
  const vadBlk: Registration[] = [];

  for (const reg of records) {
    const vistar: Vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
    const category: DepartmentCategory = reg.category || getCategoryFromRegistrationCode(reg.registrationCode);

    if (vistar === 'CHANDLODIYA') {
      if (category === 'BAL') chdBal.push(reg);
      else chdBlk.push(reg);
    } else {
      if (category === 'BAL') vadBal.push(reg);
      else vadBlk.push(reg);
    }
  }

  // Sort each partition naturally by code
  const sortedAll = [...records].sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));
  chdBal.sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));
  chdBlk.sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));
  vadBal.sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));
  vadBlk.sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));

  // 5 sheets matching the exact user specification
  const sheetConfigs: { 
    sheetName: string; 
    data: Registration[];
    meta: SheetMetadata;
  }[] = [
    { 
      sheetName: 'All Combined', 
      data: sortedAll,
      meta: {
        title: 'BAPS Anandotsav 2026 — Master Directory (All Combined)',
        venue: 'Chandlodiya (31/10) & Vadaj (01/11)',
        schedule: 'Chandlodiya: 31/10 Sat 5:00-8:00 PM | Vadaj: 01/11 Sun 5:00-8:00 PM',
        dept: 'All Vibhags (Bal & Balika)',
        codeRange: 'Chandlodiya (C-1+) & Vadaj (V-1+)',
      }
    },
    { 
      sheetName: 'Chandlodiya Bal', 
      data: chdBal,
      meta: {
        title: 'BAPS Anandotsav 2026 — Chandlodiya Bal Vibhag (Boys)',
        venue: 'BAPS Swaminarayan Sanskardham, Chandlodiya',
        schedule: '31/10/2026 (Saturday), 5:00 PM to 8:00 PM',
        dept: 'Bal Vibhag (Boys)',
        codeRange: 'C-1 to C-1000',
      }
    },
    { 
      sheetName: 'Chandlodiya Balika', 
      data: chdBlk,
      meta: {
        title: 'BAPS Anandotsav 2026 — Chandlodiya Balika Vibhag (Girls)',
        venue: 'BAPS Swaminarayan Sanskardham, Chandlodiya',
        schedule: '31/10/2026 (Saturday), 5:00 PM to 8:00 PM',
        dept: 'Balika Vibhag (Girls)',
        codeRange: 'C-1001 onwards',
      }
    },
    { 
      sheetName: 'Vadaj Bal', 
      data: vadBal,
      meta: {
        title: 'BAPS Anandotsav 2026 — Vadaj Bal Vibhag (Boys)',
        venue: 'BAPS Swaminarayan Sanskardham, Vadaj',
        schedule: '01/11/2026 (Sunday), 5:00 PM to 8:00 PM',
        dept: 'Bal Vibhag (Boys)',
        codeRange: 'V-1 to V-1000',
      }
    },
    { 
      sheetName: 'Vadaj Balika', 
      data: vadBlk,
      meta: {
        title: 'BAPS Anandotsav 2026 — Vadaj Balika Vibhag (Girls)',
        venue: 'BAPS Swaminarayan Sanskardham, Vadaj',
        schedule: '01/11/2026 (Sunday), 5:00 PM to 8:00 PM',
        dept: 'Balika Vibhag (Girls)',
        codeRange: 'V-1001 onwards',
      }
    },
  ];

  const exportTimestamp = formatDateTime(new Date());

  for (const config of sheetConfigs) {
    // Compute Sheet-Specific Numeric Metrics
    const totalCount = config.data.length;
    const onlineCount = config.data.filter((r) => r.source === 'ONLINE').length;
    const walkinCount = config.data.filter((r) => r.source === 'ON_THE_SPOT').length;
    const issuedCount = config.data.filter((r) => r.cardStatus === 'ISSUED').length;
    const pendingCount = config.data.filter((r) => r.cardStatus !== 'ISSUED').length;
    const companionsCount = config.data
      .filter((r) => r.cardStatus === 'ISSUED')
      .reduce((sum, r) => sum + (r.accompanyingPersonsCount || 0), 0);
    const totalAttendeesCount = issuedCount + companionsCount;
    const printedCount = config.data.filter((r) => {
      const vistar = r.vistar || getVistarFromRegistrationCode(r.registrationCode);
      const category = r.category || getCategoryFromRegistrationCode(r.registrationCode);
      return printingSettings ? isCardPrePrinted(r.registrationCode, category, vistar, printingSettings) : false;
    }).length;
    const manualCount = totalCount - printedCount;

    // Construct Sheet AOA Structure (Metadata + Summary Numbers + Directory Table)
    const sheetAoa: unknown[][] = [
      // Row 1: Header Title
      [config.meta.title],
      // Row 2: Venue & Schedule Details
      ['Center / Venue:', config.meta.venue, '', 'Festival Schedule:', config.meta.schedule],
      // Row 3: Scope & Export Metadata
      ['Department:', config.meta.dept, 'Target Code Range:', config.meta.codeRange, 'Export Generated:', exportTimestamp],
      // Row 4: Spacer
      [],
      // Row 5: Numeric Summary Section Title
      ['📊 SHEET NUMERIC SUMMARY (TOTALS FOR THIS SHEET):'],
      // Row 6: Numeric Summary Header
      [...EXCEL_SUMMARY_METRIC_HEADERS],
      // Row 7: Numeric Summary Values
      [
        totalCount,
        onlineCount,
        walkinCount,
        issuedCount,
        pendingCount,
        companionsCount,
        totalAttendeesCount,
        printedCount,
        manualCount,
      ],
      // Row 8: Spacer
      [],
      // Row 9: Table Section Header
      ['📋 DETAILED REGISTRATIONS DIRECTORY:'],
      // Row 10: Column Headings
      [...EXCEL_HEADERS],
    ];

    // Rows 11+: Actual Data Rows
    for (let i = 0; i < config.data.length; i++) {
      const reg = config.data[i];
      const rowObj = mapRegistrationToExcelRow(reg, i + 1, printingSettings);
      const rowVals = EXCEL_HEADERS.map((h) => rowObj[h] ?? '');
      sheetAoa.push(rowVals);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetAoa);
    ws['!cols'] = EXCEL_COL_WIDTHS;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title Banner
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // Summary Section Title
      { s: { r: 8, c: 0 }, e: { r: 8, c: 6 } }, // Directory Section Title
    ];

    XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
  }

  return wb;
}

/**
 * Primary export runner:
 * Fetches all registrations (or uses customRecords), builds 5 sheets, and initiates browser download.
 */
export async function exportAllRegistrationsToExcel(options?: {
  customRecords?: Registration[];
  fileName?: string;
  printingSettings?: CardPrintingSettings | null;
  includeDeleted?: boolean;
}): Promise<{ count: number; fileName: string }> {
  let records = options?.customRecords;
  let printingSettings = options?.printingSettings;

  // If no printing settings passed, fetch from Firestore
  if (!printingSettings) {
    try {
      printingSettings = await getCardPrintingSettings();
    } catch {
      // Ignore fallback
    }
  }

  // If no custom records provided, fetch all active records from both centers
  if (!records) {
    const targetCols: ('chandlodiya' | 'vadaj')[] = ['chandlodiya', 'vadaj'];
    const isDeleted = Boolean(options?.includeDeleted);

    const promises = targetCols.map(async (colName) => {
      const colRef = collection(db, colName);
      const q = query(colRef, where('isDeleted', '==', isDeleted));
      const snap = await getDocs(q);
      const areaName: Vistar = colName === 'chandlodiya' ? 'CHANDLODIYA' : 'VADAJ';
      return snap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({
          ...d.data(),
          id: d.id,
          vistar: (d.data() as Registration).vistar || areaName,
        })) as Registration[];
    });

    const results = await Promise.all(promises);
    records = results.flat();

    // Fallback to legacy collection if both center collections are empty
    if (records.length === 0) {
      const colRef = collection(db, 'registrations');
      const q = query(colRef, where('isDeleted', '==', isDeleted));
      const snap = await getDocs(q);
      records = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[];
    }
  }

  const wb = buildMultiSheetWorkbook(records, printingSettings);
  const fileName = options?.fileName || 'Anandotsav_2026_All_Registrations_5_Sheets.xlsx';

  XLSX.writeFile(wb, fileName);

  return { count: records.length, fileName };
}

export interface ExportFilterOptions {
  vistar?: Vistar | 'COMBINED';
  category?: DepartmentCategory | 'ALL';
  area?: string | 'ALL';
  areas?: string[]; // Multiple areas selection support
  cardStatus?: 'ALL' | 'ISSUED' | 'NOT_ISSUED';
  printingType?: 'ALL' | 'PRINTED' | 'NON_PRINTED';
  source?: 'ALL' | 'ONLINE' | 'ON_THE_SPOT';
  splitByArea?: boolean; // When multiple areas selected, export each to a separate sheet
  splitByDepartment?: boolean; // Export Bal and Balika to separate sheets
  customRecords?: Registration[];
  printingSettings?: CardPrintingSettings | null;
  fileName?: string;
  includeDeleted?: boolean;
}

/**
 * Sanitize a string to be a valid Excel worksheet title (max 31 chars, no forbidden chars)
 */
export function sanitizeSheetName(name: string, fallback = 'Sheet'): string {
  const clean = name.replace(/[\\/?*[\]:]/g, ' ').trim();
  return (clean.slice(0, 30) || fallback).trim();
}

/**
 * Filter registrations according to export filter options (supports single area or multiple areas)
 */
export function filterRegistrationsForExport(
  records: Registration[],
  filters: {
    vistar?: Vistar | 'COMBINED';
    category?: DepartmentCategory | 'ALL';
    area?: string | 'ALL';
    areas?: string[];
    cardStatus?: 'ALL' | 'ISSUED' | 'NOT_ISSUED';
    printingType?: 'ALL' | 'PRINTED' | 'NON_PRINTED';
    source?: 'ALL' | 'ONLINE' | 'ON_THE_SPOT';
  },
  printingSettings?: CardPrintingSettings | null
): Registration[] {
  // Normalize selected areas list
  const selectedAreas = (filters.areas && filters.areas.length > 0)
    ? filters.areas
    : (filters.area ? [filters.area] : ['ALL']);

  const isAllAreas = selectedAreas.includes('ALL') || selectedAreas.length === 0;

  return records.filter((reg) => {
    if (reg.isDeleted) return false;

    // Filter by Center / Vistar
    if (filters.vistar && filters.vistar !== 'COMBINED') {
      const vistar = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
      if (vistar !== filters.vistar) return false;
    }

    // Filter by Category / Department
    if (filters.category && filters.category !== 'ALL') {
      const category = reg.category || getCategoryFromRegistrationCode(reg.registrationCode);
      if (category !== filters.category) return false;
    }

    // Filter by Multiple Areas / Localities
    if (!isAllAreas) {
      const norm = normalizeAreaName(reg.area);
      const regAreaLower = (reg.area || '').toLowerCase().trim();
      const isMatched = selectedAreas.some((target) => {
        const targetNorm = normalizeAreaName(target);
        return (
          norm.key === targetNorm.key ||
          norm.name.toLowerCase() === target.toLowerCase().trim() ||
          regAreaLower.includes(target.toLowerCase().trim())
        );
      });
      if (!isMatched) return false;
    }

    // Filter by Card Status
    if (filters.cardStatus && filters.cardStatus !== 'ALL') {
      if (filters.cardStatus === 'ISSUED' && reg.cardStatus !== 'ISSUED') return false;
      if (filters.cardStatus === 'NOT_ISSUED' && reg.cardStatus === 'ISSUED') return false;
    }

    // Filter by Card Printing Type (Box vs Blank Card)
    if (filters.printingType && filters.printingType !== 'ALL' && printingSettings) {
      const v = reg.vistar || getVistarFromRegistrationCode(reg.registrationCode);
      const c = reg.category || getCategoryFromRegistrationCode(reg.registrationCode);
      const isPrinted = isCardPrePrinted(reg.registrationCode, c, v, printingSettings);
      if (filters.printingType === 'PRINTED' && !isPrinted) return false;
      if (filters.printingType === 'NON_PRINTED' && isPrinted) return false;
    }

    // Filter by Registration Source
    if (filters.source && filters.source !== 'ALL') {
      if (reg.source !== filters.source) return false;
    }

    return true;
  });
}

/**
 * Creates a standard directory worksheet with title banner, summary KPIs, and data table
 */
export function createDirectoryWorksheet(
  records: Registration[],
  title: string,
  venueSchedule: string,
  filterDescription: string,
  areaSubtitle: string,
  printingSettings?: CardPrintingSettings | null
): XLSX.WorkSheet {
  const exportTimestamp = formatDateTime(new Date());
  const sortedRecords = [...records].sort((a, b) => compareRegistrationCodes(a.registrationCode, b.registrationCode));

  const totalCount = sortedRecords.length;
  const onlineCount = sortedRecords.filter((r) => r.source === 'ONLINE').length;
  const walkinCount = sortedRecords.filter((r) => r.source === 'ON_THE_SPOT').length;
  const issuedCount = sortedRecords.filter((r) => r.cardStatus === 'ISSUED').length;
  const pendingCount = sortedRecords.filter((r) => r.cardStatus !== 'ISSUED').length;
  const companionsCount = sortedRecords
    .filter((r) => r.cardStatus === 'ISSUED')
    .reduce((sum, r) => sum + (r.accompanyingPersonsCount || 0), 0);
  const totalAttendeesCount = issuedCount + companionsCount;
  const printedCount = sortedRecords.filter((r) => {
    const v = r.vistar || getVistarFromRegistrationCode(r.registrationCode);
    const c = r.category || getCategoryFromRegistrationCode(r.registrationCode);
    return printingSettings ? isCardPrePrinted(r.registrationCode, c, v, printingSettings) : false;
  }).length;
  const manualCount = totalCount - printedCount;

  const sheetAoa: unknown[][] = [
    // Row 1: Header Title
    [title],
    // Row 2: Venue & Schedule Details
    ['Center / Schedule:', venueSchedule, '', 'Area / Locality:', areaSubtitle],
    // Row 3: Scope & Export Metadata
    [
      'Filters Applied:',
      filterDescription,
      '',
      'Export Generated:',
      exportTimestamp,
    ],
    // Row 4: Spacer
    [],
    // Row 5: Numeric Summary Section Title
    ['📊 SHEET NUMERIC SUMMARY (MATCHING RECORDS):'],
    // Row 6: Numeric Summary Header
    [...EXCEL_SUMMARY_METRIC_HEADERS],
    // Row 7: Numeric Summary Values
    [
      totalCount,
      onlineCount,
      walkinCount,
      issuedCount,
      pendingCount,
      companionsCount,
      totalAttendeesCount,
      printedCount,
      manualCount,
    ],
    // Row 8: Spacer
    [],
    // Row 9: Table Section Header
    [`📋 REGISTRATIONS DIRECTORY (${totalCount} Records):`],
    // Row 10: Column Headings
    [...EXCEL_HEADERS],
  ];

  // Rows 11+: Actual Data Rows
  for (let i = 0; i < sortedRecords.length; i++) {
    const reg = sortedRecords[i];
    const rowObj = mapRegistrationToExcelRow(reg, i + 1, printingSettings);
    const rowVals = EXCEL_HEADERS.map((h) => rowObj[h] ?? '');
    sheetAoa.push(rowVals);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetAoa);
  ws['!cols'] = EXCEL_COL_WIDTHS;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title Banner
    { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // Summary Section Title
    { s: { r: 8, c: 0 }, e: { r: 8, c: 6 } }, // Directory Section Title
  ];

  return ws;
}

/**
 * Builds a focused filtered Excel workbook tailored to specific filters,
 * with full support for multiple areas, per-area tabs, department splits, and printing status.
 */
export function buildFilteredWorkbook(
  records: Registration[],
  filters: {
    vistar?: Vistar | 'COMBINED';
    category?: DepartmentCategory | 'ALL';
    area?: string | 'ALL';
    areas?: string[];
    cardStatus?: 'ALL' | 'ISSUED' | 'NOT_ISSUED';
    printingType?: 'ALL' | 'PRINTED' | 'NON_PRINTED';
    source?: 'ALL' | 'ONLINE' | 'ON_THE_SPOT';
    splitByArea?: boolean;
    splitByDepartment?: boolean;
  },
  printingSettings?: CardPrintingSettings | null
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Filter records
  const filtered = filterRegistrationsForExport(records, filters, printingSettings);

  // Normalize selected areas list
  const selectedAreas = (filters.areas && filters.areas.length > 0)
    ? filters.areas
    : (filters.area ? [filters.area] : ['ALL']);
  const isAllAreas = selectedAreas.includes('ALL') || selectedAreas.length === 0;

  // Determine metadata labels
  const vistarLabel = filters.vistar === 'CHANDLODIYA' ? 'Chandlodiya' : filters.vistar === 'VADAJ' ? 'Vadaj' : 'All Centers Combined';
  const categoryLabel = filters.category === 'BAL' ? 'Bal Vibhag (Boys)' : filters.category === 'BLK' ? 'Balika Vibhag (Girls)' : 'All Departments (Bal & Balika)';
  const areaLabel = isAllAreas ? 'All Areas' : selectedAreas.join(', ');
  const statusLabel = filters.cardStatus === 'ISSUED' ? 'Issued Only (Present)' : filters.cardStatus === 'NOT_ISSUED' ? 'Pending Only' : 'All Card Statuses';
  const printTypeLabel = filters.printingType === 'PRINTED' ? 'Box Cards Only (Pre-printed)' : filters.printingType === 'NON_PRINTED' ? 'Blank Cards Only (Manual)' : 'All Cards';
  const sourceLabel = filters.source === 'ONLINE' ? 'Online Public Only' : filters.source === 'ON_THE_SPOT' ? 'Walk-in (Spot) Only' : 'All Sources';

  const filterDesc = `Vibhag: ${categoryLabel} | Status: ${statusLabel} | Type: ${printTypeLabel} | Channel: ${sourceLabel}`;
  const venueSchedule =
    filters.vistar === 'CHANDLODIYA'
      ? 'BAPS Swaminarayan Sanskardham, Chandlodiya | 31/10/2026 (Sat) 5:00-8:00 PM'
      : filters.vistar === 'VADAJ'
      ? 'BAPS Swaminarayan Sanskardham, Vadaj | 01/11/2026 (Sun) 5:00-8:00 PM'
      : 'Chandlodiya (31/10) & Vadaj (01/11)';

  // 1. If multiple areas or ALL areas are selected, attach Area-Wise Report sheet first
  if (isAllAreas || selectedAreas.length > 1) {
    const areaSheet = buildAreaReportSheet(filtered);
    XLSX.utils.book_append_sheet(wb, areaSheet, 'Area Wise Report');
  }

  // 2. Case A: Split by Area (each selected area gets its own dedicated tab!)
  if (filters.splitByArea && (!isAllAreas || selectedAreas.length > 1)) {
    const areasToExport = isAllAreas
      ? Array.from(new Set(filtered.map((r) => normalizeAreaName(r.area).name))).filter(Boolean)
      : selectedAreas;

    const usedSheetNames = new Set<string>(['Area Wise Report']);

    for (const a of areasToExport) {
      const areaRecords = filtered.filter((r) => {
        const norm = normalizeAreaName(r.area);
        return norm.name.toLowerCase() === a.toLowerCase() || norm.key === normalizeAreaName(a).key;
      });

      if (areaRecords.length === 0) continue;

      let sheetName = sanitizeSheetName(a, 'Area');
      let counter = 2;
      while (usedSheetNames.has(sheetName)) {
        sheetName = sanitizeSheetName(`${a.slice(0, 25)} (${counter})`);
        counter++;
      }
      usedSheetNames.add(sheetName);

      const title = `BAPS Anandotsav 2026 — ${a} Locality Directory (${vistarLabel})`;
      const ws = createDirectoryWorksheet(areaRecords, title, venueSchedule, filterDesc, a, printingSettings);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    return wb;
  }

  // 3. Case B: Split by Department (separate Bal and Balika sheets)
  if (filters.splitByDepartment && (!filters.category || filters.category === 'ALL')) {
    const balRecords = filtered.filter((r) => (r.category || getCategoryFromRegistrationCode(r.registrationCode)) === 'BAL');
    const blkRecords = filtered.filter((r) => (r.category || getCategoryFromRegistrationCode(r.registrationCode)) === 'BLK');

    const balWs = createDirectoryWorksheet(
      balRecords,
      `BAPS Anandotsav 2026 — ${vistarLabel} Bal Vibhag (Boys)`,
      venueSchedule,
      filterDesc,
      areaLabel,
      printingSettings
    );
    XLSX.utils.book_append_sheet(wb, balWs, sanitizeSheetName(`${vistarLabel} Bal`));

    const blkWs = createDirectoryWorksheet(
      blkRecords,
      `BAPS Anandotsav 2026 — ${vistarLabel} Balika Vibhag (Girls)`,
      venueSchedule,
      filterDesc,
      areaLabel,
      printingSettings
    );
    XLSX.utils.book_append_sheet(wb, blkWs, sanitizeSheetName(`${vistarLabel} Balika`));

    return wb;
  }

  // 4. Case C: Unified Directory Sheet
  const sheetTitle = `BAPS Anandotsav 2026 — ${vistarLabel} ${categoryLabel} Directory`;
  const ws = createDirectoryWorksheet(filtered, sheetTitle, venueSchedule, filterDesc, areaLabel, printingSettings);

  let mainSheetName = 'Registrations';
  if (!isAllAreas && selectedAreas.length === 1) {
    mainSheetName = sanitizeSheetName(`${selectedAreas[0]} List`);
  } else if (!isAllAreas && selectedAreas.length > 1) {
    mainSheetName = sanitizeSheetName(`${selectedAreas.length} Areas Combined`);
  } else if (filters.vistar === 'CHANDLODIYA') {
    mainSheetName = filters.category === 'BAL' ? 'Chandlodiya Bal' : filters.category === 'BLK' ? 'Chandlodiya Balika' : 'Chandlodiya All';
  } else if (filters.vistar === 'VADAJ') {
    mainSheetName = filters.category === 'BAL' ? 'Vadaj Bal' : filters.category === 'BLK' ? 'Vadaj Balika' : 'Vadaj All';
  }

  XLSX.utils.book_append_sheet(wb, ws, mainSheetName);
  return wb;
}

/**
 * Filtered export runner:
 * Accepts dynamic filters (Vistar, Category, Area/Multiple Areas, Status, Source, Printing Type),
 * builds a customized Excel file, and triggers download.
 */
export async function exportFilteredToExcel(
  options: ExportFilterOptions
): Promise<{ count: number; fileName: string }> {
  let records = options?.customRecords;
  let printingSettings = options?.printingSettings;

  if (!printingSettings) {
    try {
      printingSettings = await getCardPrintingSettings();
    } catch {}
  }

  if (!records) {
    const targetCols: ('chandlodiya' | 'vadaj')[] = ['chandlodiya', 'vadaj'];
    const isDeleted = Boolean(options?.includeDeleted);

    const promises = targetCols.map(async (colName) => {
      const colRef = collection(db, colName);
      const q = query(colRef, where('isDeleted', '==', isDeleted));
      const snap = await getDocs(q);
      const areaName: Vistar = colName === 'chandlodiya' ? 'CHANDLODIYA' : 'VADAJ';
      return snap.docs
        .filter((d) => !d.id.startsWith('_') && !d.id.startsWith('counter_'))
        .map((d) => ({
          ...d.data(),
          id: d.id,
          vistar: (d.data() as Registration).vistar || areaName,
        })) as Registration[];
    });

    const results = await Promise.all(promises);
    records = results.flat();

    if (records.length === 0) {
      const colRef = collection(db, 'registrations');
      const q = query(colRef, where('isDeleted', '==', isDeleted));
      const snap = await getDocs(q);
      records = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Registration[];
    }
  }

  // Filter records
  const filtered = filterRegistrationsForExport(
    records,
    {
      vistar: options.vistar,
      category: options.category,
      area: options.area,
      areas: options.areas,
      cardStatus: options.cardStatus,
      printingType: options.printingType,
      source: options.source,
    },
    printingSettings
  );

  // Normalize selected areas
  const selectedAreas = (options.areas && options.areas.length > 0)
    ? options.areas
    : (options.area ? [options.area] : ['ALL']);
  const isAllAreas = selectedAreas.includes('ALL') || selectedAreas.length === 0;

  // Determine file name
  const vistarTag = options.vistar === 'CHANDLODIYA' ? 'Chandlodiya' : options.vistar === 'VADAJ' ? 'Vadaj' : 'Combined';
  const categoryTag = options.category === 'BAL' ? 'Bal' : options.category === 'BLK' ? 'Balika' : 'AllDepts';
  const areaTag = !isAllAreas
    ? (selectedAreas.length === 1 ? `_${selectedAreas[0].replace(/\s+/g, '_')}` : `_${selectedAreas.length}_Areas`)
    : '';
  const defaultFileName = `Anandotsav_2026_${vistarTag}_${categoryTag}${areaTag}_Export.xlsx`;
  const fileName = options.fileName || defaultFileName;

  // If user selected all defaults and no splits, build multi-sheet master workbook; otherwise build filtered workbook
  const isMasterExport =
    (!options.vistar || options.vistar === 'COMBINED') &&
    (!options.category || options.category === 'ALL') &&
    isAllAreas &&
    (!options.cardStatus || options.cardStatus === 'ALL') &&
    (!options.printingType || options.printingType === 'ALL') &&
    (!options.source || options.source === 'ALL') &&
    !options.splitByArea &&
    !options.splitByDepartment;

  const wb = isMasterExport
    ? buildMultiSheetWorkbook(records, printingSettings)
    : buildFilteredWorkbook(
        records,
        {
          vistar: options.vistar,
          category: options.category,
          area: options.area,
          areas: options.areas,
          cardStatus: options.cardStatus,
          printingType: options.printingType,
          source: options.source,
          splitByArea: options.splitByArea,
          splitByDepartment: options.splitByDepartment,
        },
        printingSettings
      );

  XLSX.writeFile(wb, fileName);
  return { count: filtered.length, fileName };
}
