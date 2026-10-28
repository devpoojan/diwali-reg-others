import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { 
  buildMultiSheetWorkbook, 
  buildFilteredWorkbook,
  filterRegistrationsForExport,
  mapRegistrationToExcelRow, 
  compareRegistrationCodes, 
  EXCEL_HEADERS,
  EXCEL_SUMMARY_METRIC_HEADERS 
} from '@/services/excelExportService';
import type { Registration } from '@/types';

describe('Excel 5-Sheet Export Service with Top Summary & Details', () => {
  const sampleRegistrations: Registration[] = [
    {
      id: 'reg-c-bal-1',
      registrationCode: 'C-1',
      category: 'BAL',
      vistar: 'CHANDLODIYA',
      firstName: 'Aarav',
      fatherName: 'Rajeshbhai',
      surname: 'Patel',
      fullName: 'Aarav Rajeshbhai Patel',
      mobileNumber: '9876543210',
      source: 'ONLINE',
      houseNumber: 'A-101',
      societyName: 'Shantiniketan',
      area: 'Chandlodiya',
      cardStatus: 'ISSUED',
      accompanyingPersonsCount: 2,
      cardIssuedAt: '2026-10-31T17:30:00.000Z',
      isDeleted: false,
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 'reg-c-blk-1',
      registrationCode: 'C-1002',
      category: 'BLK',
      vistar: 'CHANDLODIYA',
      firstName: 'Aanya',
      fatherName: 'Bhavinbhai',
      surname: 'Shah',
      fullName: 'Aanya Bhavinbhai Shah',
      mobileNumber: '9825012345',
      source: 'ON_THE_SPOT',
      houseNumber: 'B-204',
      societyName: 'Gokuldham',
      area: 'Ognaj',
      cardStatus: 'NOT_ISSUED',
      accompanyingPersonsCount: 0,
      isDeleted: false,
      createdAt: '2026-10-21T11:00:00.000Z',
      updatedAt: '2026-10-21T11:00:00.000Z',
    },
    {
      id: 'reg-v-bal-1',
      registrationCode: 'V-5',
      category: 'BAL',
      vistar: 'VADAJ',
      firstName: 'Dhruv',
      fatherName: 'Pravinbhai',
      surname: 'Prajapati',
      fullName: 'Dhruv Pravinbhai Prajapati',
      mobileNumber: '9428054321',
      source: 'ONLINE',
      area: 'Vadaj',
      cardStatus: 'ISSUED',
      accompanyingPersonsCount: 3,
      cardIssuedAt: '2026-11-01T17:45:00.000Z',
      isDeleted: false,
      createdAt: '2026-10-22T09:00:00.000Z',
      updatedAt: '2026-10-22T09:00:00.000Z',
    },
    {
      id: 'reg-v-blk-1',
      registrationCode: 'V-1015',
      category: 'BLK',
      vistar: 'VADAJ',
      firstName: 'Diya',
      fatherName: 'Manishbhai',
      surname: 'Solanki',
      fullName: 'Diya Manishbhai Solanki',
      mobileNumber: '9909011223',
      source: 'ONLINE',
      houseNumber: '12',
      societyName: 'Rameshwar Nagar',
      area: 'Nirnayanagar',
      cardStatus: 'NOT_ISSUED',
      accompanyingPersonsCount: 0,
      isDeleted: false,
      createdAt: '2026-10-22T14:00:00.000Z',
      updatedAt: '2026-10-22T14:00:00.000Z',
    },
    {
      id: 'reg-c-bal-10',
      registrationCode: 'C-10',
      category: 'BAL',
      vistar: 'CHANDLODIYA',
      firstName: 'Vivaan',
      fatherName: 'Kiritbhai',
      surname: 'Patel',
      fullName: 'Vivaan Kiritbhai Patel',
      mobileNumber: '9898011223',
      source: 'ONLINE',
      cardStatus: 'NOT_ISSUED',
      accompanyingPersonsCount: 0,
      isDeleted: false,
      createdAt: '2026-10-20T12:00:00.000Z',
      updatedAt: '2026-10-20T12:00:00.000Z',
    },
  ];

  it('generates an Excel workbook with Area Wise Report and 5 directory sheets', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    expect(wb.SheetNames).toEqual([
      'Area Wise Report',
      'All Combined',
      'Chandlodiya Bal',
      'Chandlodiya Balika',
      'Vadaj Bal',
      'Vadaj Balika',
    ]);
  });

  it('generates the Area Wise Report sheet with breakdowns for Chandlodiya, Vadaj, and Combined', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    const sheet = wb.Sheets['Area Wise Report'];
    expect(sheet).toBeDefined();

    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
    // Row 1: Main Title
    expect(String(rows[0][0])).toContain('AREA-WISE REGISTRATION & ATTENDANCE REPORT');
    // Row 4: Chandlodiya Header
    expect(String(rows[3][0])).toContain('CHANDLODIYA CENTER');
    // Row 5: Area Table Column Headings
    expect(rows[4]).toContain('Area / Locality');
    expect(rows[4]).toContain('Total Registrations');
    expect(rows[4]).toContain('% Share of Center');

    // Vadaj section should exist
    const hasVadaj = rows.some((r) => Array.isArray(r) && String(r[0]).includes('VADAJ CENTER'));
    expect(hasVadaj).toBe(true);

    // Combined section should exist
    const hasCombined = rows.some((r) => Array.isArray(r) && String(r[0]).includes('ALL CENTERS COMBINED'));
    expect(hasCombined).toBe(true);
  });

  it('ensures EXCEL_HEADERS only shows combined Child Full Name and does not duplicate first/father/surname', () => {
    expect(EXCEL_HEADERS).toContain('Child Full Name');
    expect(EXCEL_HEADERS as readonly string[]).not.toContain('First Name');
    expect(EXCEL_HEADERS as readonly string[]).not.toContain('Father Name');
    expect(EXCEL_HEADERS as readonly string[]).not.toContain('Surname');
  });

  it('displays sheet details at the top of every directory sheet (Row 1-3)', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    const directorySheets = wb.SheetNames.filter((n) => n !== 'Area Wise Report');

    for (const sheetName of directorySheets) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      // Row 1: Title
      expect(rows[0][0]).toContain('BAPS Anandotsav 2026');
      expect(rows[0][0]).toContain(sheetName);

      // Row 2: Venue and Schedule details
      expect(rows[1][0]).toBe('Center / Venue:');
      expect(rows[1][3]).toBe('Festival Schedule:');

      // Row 3: Scope and Code Range
      expect(rows[2][0]).toBe('Department:');
      expect(rows[2][2]).toBe('Target Code Range:');
      expect(rows[2][4]).toBe('Export Generated:');
    }
  });

  it('displays numeric summary metrics at the top of every sheet (Rows 5-7)', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);

    // Test "Chandlodiya Bal" partition metrics (2 records: C-1 issued (+2), C-10 not issued)
    const chdBalSheet = wb.Sheets['Chandlodiya Bal'];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(chdBalSheet, { header: 1 });

    // Row 5: Numeric section title
    expect(String(rows[4][0])).toContain('SHEET NUMERIC SUMMARY');

    // Row 6: Summary metric header
    expect(rows[5]).toEqual([...EXCEL_SUMMARY_METRIC_HEADERS]);

    // Row 7: Numeric metric values
    const metricsRow = rows[6];
    expect(metricsRow[0]).toBe(2); // Total Registrations
    expect(metricsRow[1]).toBe(2); // Online Registrations
    expect(metricsRow[2]).toBe(0); // Walk-ins
    expect(metricsRow[3]).toBe(1); // Cards Issued (C-1)
    expect(metricsRow[4]).toBe(1); // Cards Pending (C-10)
    expect(metricsRow[5]).toBe(2); // Accompanying Persons (from C-1)
    expect(metricsRow[6]).toBe(3); // Total Attendees (1 child + 2 companions = 3)
  });

  it('displays correct summary numbers on "All Combined" sheet', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    const sheet = wb.Sheets['All Combined'];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

    const metricsRow = rows[6];
    expect(metricsRow[0]).toBe(5); // Total 5
    expect(metricsRow[1]).toBe(4); // 4 Online
    expect(metricsRow[2]).toBe(1); // 1 Walk-in (C-1002)
    expect(metricsRow[3]).toBe(2); // 2 Issued (C-1, V-5)
    expect(metricsRow[4]).toBe(3); // 3 Pending (C-1002, V-1015, C-10)
    expect(metricsRow[5]).toBe(5); // Companions: 2 (from C-1) + 3 (from V-5) = 5
    expect(metricsRow[6]).toBe(7); // Total Attendees: 2 children + 5 companions = 7
  });

  it('ensures the data table column headings are present on Row 10 on directory sheets', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    const directorySheets = wb.SheetNames.filter((n) => n !== 'Area Wise Report');

    for (const sheetName of directorySheets) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      // Row 9: Table Section Header
      expect(rows[8][0]).toContain('DETAILED REGISTRATIONS DIRECTORY');

      // Row 10: Table Column Headings
      expect(rows[9]).toEqual([...EXCEL_HEADERS]);
    }
  });

  it('appends actual registration data starting from Row 11 in natural code order', () => {
    const wb = buildMultiSheetWorkbook(sampleRegistrations);
    const chdBalSheet = wb.Sheets['Chandlodiya Bal'];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(chdBalSheet, { header: 1 });

    // Row 11: First record (C-1)
    expect(rows[10][0]).toBe(1); // Sr. No. 1
    expect(rows[10][1]).toBe('C-1'); // Registration Code
    expect(rows[10][2]).toBe('Aarav Rajeshbhai Patel'); // Full Name

    // Row 12: Second record (C-10)
    expect(rows[11][0]).toBe(2); // Sr. No. 2
    expect(rows[11][1]).toBe('C-10'); // Registration Code
    expect(rows[11][2]).toBe('Vivaan Kiritbhai Patel'); // Full Name
  });

  it('displays full details and headings even when a partition has 0 records', () => {
    const chdOnlyRegistrations = sampleRegistrations.filter((r) => r.vistar === 'CHANDLODIYA');
    const wb = buildMultiSheetWorkbook(chdOnlyRegistrations);

    // Vadaj Bal has 0 records
    const vadBalSheet = wb.Sheets['Vadaj Bal'];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(vadBalSheet, { header: 1 });

    // Details at top
    expect(rows[0][0]).toContain('Vadaj Bal Vibhag (Boys)');
    // Summary numbers should be 0
    expect(rows[6][0]).toBe(0); // Total 0
    // Table column headings must still be present at row 10
    expect(rows[9]).toEqual([...EXCEL_HEADERS]);
  });

  it('correctly maps all data columns in mapRegistrationToExcelRow', () => {
    const reg = sampleRegistrations[0];
    const row = mapRegistrationToExcelRow(reg, 1);
    expect(row['Sr. No.']).toBe(1);
    expect(row['Registration Code']).toBe('C-1');
    expect(row['Child Full Name']).toBe('Aarav Rajeshbhai Patel');
    expect(row['Center / Vistar']).toBe('Chandlodiya');
    expect(row['Card Status']).toContain('ISSUED');
    expect(row['Accompanying Persons']).toBe(2);
    expect(row['Total Attendees']).toBe(3);
  });

  it('sorts registration codes naturally using compareRegistrationCodes', () => {
    const codes = ['C-10', 'C-2', 'C-1', 'C-20', 'C-3'];
    const sorted = [...codes].sort(compareRegistrationCodes);
    expect(sorted).toEqual(['C-1', 'C-2', 'C-3', 'C-10', 'C-20']);
  });

  describe('Filtered Excel Export Engine', () => {
    it('filters registrations by center, department, and area', () => {
      // Filter for Chandlodiya Bal
      const chdBal = filterRegistrationsForExport(sampleRegistrations, {
        vistar: 'CHANDLODIYA',
        category: 'BAL',
      });
      expect(chdBal.length).toBe(2); // C-1, C-10
      expect(chdBal.map((r) => r.registrationCode)).toEqual(['C-1', 'C-10']);

      // Filter for specific area 'Ognaj'
      const ognajOnly = filterRegistrationsForExport(sampleRegistrations, {
        area: 'Ognaj',
      });
      expect(ognajOnly.length).toBe(1); // C-1002
      expect(ognajOnly[0].registrationCode).toBe('C-1002');

      // Filter by card status 'ISSUED'
      const issuedOnly = filterRegistrationsForExport(sampleRegistrations, {
        cardStatus: 'ISSUED',
      });
      expect(issuedOnly.length).toBe(2); // C-1, V-5
      expect(issuedOnly.every((r) => r.cardStatus === 'ISSUED')).toBe(true);
    });

    it('builds a custom filtered workbook with specific locality sheet and summary block', () => {
      const wb = buildFilteredWorkbook(sampleRegistrations, {
        vistar: 'CHANDLODIYA',
        category: 'BLK',
        area: 'Ognaj',
      });

      expect(wb.SheetNames).toContain('Ognaj List');
      const sheet = wb.Sheets['Ognaj List'];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

      // Title Banner
      expect(rows[0][0]).toContain('Chandlodiya Balika Vibhag (Girls) Directory');
      // Summary Metrics Row
      const metricsRow = rows[6];
      expect(metricsRow[0]).toBe(1); // Total 1 (C-1002)
      expect(metricsRow[2]).toBe(1); // 1 Walk-in
      // Directory Table Header
      expect(rows[9]).toEqual([...EXCEL_HEADERS]);
      // First Data Row
      expect(rows[10][1]).toBe('C-1002');
      expect(rows[10][2]).toBe('Aanya Bhavinbhai Shah');
    });

    it('includes Area Wise Report sheet when area is ALL', () => {
      const wb = buildFilteredWorkbook(sampleRegistrations, {
        vistar: 'VADAJ',
        category: 'ALL',
        area: 'ALL',
      });

      expect(wb.SheetNames).toContain('Area Wise Report');
      expect(wb.SheetNames).toContain('Vadaj All');
    });

    it('filters multiple selected areas simultaneously', () => {
      const multiArea = filterRegistrationsForExport(sampleRegistrations, {
        areas: ['Ognaj', 'Chandlodiya'],
      });
      // Should match C-1 (Chandlodiya) and C-1002 (Ognaj)
      expect(multiArea.length).toBe(2);
      expect(multiArea.map((r) => r.registrationCode)).toEqual(['C-1', 'C-1002']);
    });

    it('splits multiple areas into separate sheets when splitByArea is true', () => {
      const wb = buildFilteredWorkbook(sampleRegistrations, {
        areas: ['Ognaj', 'Chandlodiya'],
        splitByArea: true,
      });

      // Contains master area breakdown report + individual sheets for each selected area
      expect(wb.SheetNames).toContain('Area Wise Report');
      expect(wb.SheetNames).toContain('Ognaj');
      expect(wb.SheetNames).toContain('Chandlodiya');

      // Ognaj sheet has 1 record
      const ognajRows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Ognaj'], { header: 1 });
      expect(ognajRows[6][0]).toBe(1); // 1 child (C-1002)

      // Chandlodiya sheet has 1 record (C-1)
      const chdRows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Chandlodiya'], { header: 1 });
      expect(chdRows[6][0]).toBe(1); // 1 child (C-1)
    });

    it('splits departments into separate Bal and Balika sheets when splitByDepartment is true', () => {
      const wb = buildFilteredWorkbook(sampleRegistrations, {
        vistar: 'CHANDLODIYA',
        splitByDepartment: true,
      });

      expect(wb.SheetNames).toContain('Chandlodiya Bal');
      expect(wb.SheetNames).toContain('Chandlodiya Balika');

      const balRows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Chandlodiya Bal'], { header: 1 });
      expect(balRows[6][0]).toBe(2); // 2 Bal boys (C-1, C-10)

      const blkRows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Chandlodiya Balika'], { header: 1 });
      expect(blkRows[6][0]).toBe(1); // 1 Balika girl (C-1002)
    });
  });
});
