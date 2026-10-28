import { describe, it, expect } from 'vitest';
import { 
  normalizeAreaName, 
  generateAreaReport, 
  filterAreaRegistrations
} from '@/services/areaReportService';
import type { Registration } from '@/types';

const mockRegistrations: Registration[] = [
  {
    id: 'chd-1',
    registrationCode: 'C-1',
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    firstName: 'Aarav',
    fatherName: 'Rajeshbhai',
    surname: 'Patel',
    fullName: 'Aarav Rajeshbhai Patel',
    mobileNumber: '9876543210',
    source: 'ONLINE',
    area: 'Chandlodiya',
    houseNumber: '12',
    societyName: 'Shreeji Park',
    cardStatus: 'ISSUED',
    accompanyingPersonsCount: 2,
    isDeleted: false,
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'chd-2',
    registrationCode: 'C-2',
    category: 'BLK',
    vistar: 'CHANDLODIYA',
    firstName: 'Pooja',
    fatherName: 'Maheshbhai',
    surname: 'Shah',
    fullName: 'Pooja Maheshbhai Shah',
    mobileNumber: '9876543211',
    source: 'ONLINE',
    area: 'Nirnaynagar',
    houseNumber: '45',
    societyName: 'Akshar Flats',
    cardStatus: 'NOT_ISSUED',
    accompanyingPersonsCount: 0,
    isDeleted: false,
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'chd-3',
    registrationCode: 'C-3',
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    firstName: 'Tirth',
    fatherName: 'Bipimbhai',
    surname: 'Patel',
    fullName: 'Tirth Bipimbhai Patel',
    mobileNumber: '9876543212',
    source: 'ON_THE_SPOT',
    area: 'nirnayanagar', // Alternate spelling
    houseNumber: '88',
    societyName: 'Swaminarayan Nagar',
    cardStatus: 'ISSUED',
    accompanyingPersonsCount: 1,
    isDeleted: false,
    createdAt: '2026-10-20T12:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
  },
  {
    id: 'chd-4',
    registrationCode: 'C-4',
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    firstName: 'Dev',
    fatherName: 'Sureshbhai',
    surname: 'Chauhan',
    fullName: 'Dev Sureshbhai Chauhan',
    mobileNumber: '9876543213',
    source: 'ONLINE',
    area: 'Ognaj',
    cardStatus: 'NOT_ISSUED',
    accompanyingPersonsCount: 0,
    isDeleted: false,
    createdAt: '2026-10-20T13:00:00Z',
    updatedAt: '2026-10-20T13:00:00Z',
  },
  {
    id: 'chd-5',
    registrationCode: 'C-5',
    category: 'BLK',
    vistar: 'CHANDLODIYA',
    firstName: 'Diya',
    fatherName: 'Hiteshbhai',
    surname: 'Dave',
    fullName: 'Diya Hiteshbhai Dave',
    mobileNumber: '9876543214',
    source: 'ONLINE',
    area: 'Ghatlodia', // Custom other area
    cardStatus: 'ISSUED',
    accompanyingPersonsCount: 0,
    isDeleted: false,
    createdAt: '2026-10-20T14:00:00Z',
    updatedAt: '2026-10-20T14:00:00Z',
  },
  {
    id: 'chd-deleted',
    registrationCode: 'C-99',
    category: 'BAL',
    vistar: 'CHANDLODIYA',
    firstName: 'Deleted',
    fatherName: 'Test',
    surname: 'Record',
    fullName: 'Deleted Test Record',
    mobileNumber: '9999999999',
    source: 'ONLINE',
    area: 'Chandlodiya',
    cardStatus: 'NOT_ISSUED',
    accompanyingPersonsCount: 0,
    isDeleted: true, // Soft-deleted
    createdAt: '2026-10-20T15:00:00Z',
    updatedAt: '2026-10-20T15:00:00Z',
  },
  // Vadaj registrations
  {
    id: 'vad-1',
    registrationCode: 'V-1',
    category: 'BAL',
    vistar: 'VADAJ',
    firstName: 'Karan',
    fatherName: 'Mukeshbhai',
    surname: 'Joshi',
    fullName: 'Karan Mukeshbhai Joshi',
    mobileNumber: '9876543220',
    source: 'ONLINE',
    area: 'Vadaj',
    cardStatus: 'ISSUED',
    accompanyingPersonsCount: 3,
    isDeleted: false,
    createdAt: '2026-10-21T09:00:00Z',
    updatedAt: '2026-10-21T09:00:00Z',
  },
  {
    id: 'vad-2',
    registrationCode: 'V-2',
    category: 'BLK',
    vistar: 'VADAJ',
    firstName: 'Khushi',
    fatherName: 'Pravinbhai',
    surname: 'Prajapati',
    fullName: 'Khushi Pravinbhai Prajapati',
    mobileNumber: '9876543221',
    source: 'ONLINE',
    area: 'Nirnaynagar',
    cardStatus: 'NOT_ISSUED',
    accompanyingPersonsCount: 0,
    isDeleted: false,
    createdAt: '2026-10-21T10:00:00Z',
    updatedAt: '2026-10-21T10:00:00Z',
  },
];

describe('Area-Wise Report Service (areaReportService)', () => {
  describe('normalizeAreaName', () => {
    it('normalizes Nirnayanagar and Nirnaynagar to Nirnaynagar', () => {
      const res1 = normalizeAreaName('Nirnayanagar');
      const res2 = normalizeAreaName('nirnaynagar');
      expect(res1.key).toBe('nirnaynagar');
      expect(res1.name).toBe('Nirnaynagar');
      expect(res1.gujarati).toBe('નિર્ણયનગર');
      expect(res2.key).toBe('nirnaynagar');
    });

    it('normalizes Chandlodiya, Ognaj, Tragad, Vadaj', () => {
      expect(normalizeAreaName('chandlodiya').name).toBe('Chandlodiya');
      expect(normalizeAreaName('ognaj').name).toBe('Ognaj');
      expect(normalizeAreaName('Tragad').name).toBe('Tragad');
      expect(normalizeAreaName('Vadaj').name).toBe('Vadaj');
    });

    it('handles custom user-typed areas with clean capitalization', () => {
      const res = normalizeAreaName('new ranip cross road');
      expect(res.name).toBe('New Ranip Cross Road');
      expect(res.key).toBe('new ranip cross road');
    });

    it('handles empty or missing area as Unspecified', () => {
      expect(normalizeAreaName(null).name).toBe('Unspecified');
      expect(normalizeAreaName('').name).toBe('Unspecified');
      expect(normalizeAreaName('   ').name).toBe('Unspecified');
    });
  });

  describe('generateAreaReport', () => {
    it('filters out soft-deleted records and partitions by selected center', () => {
      const report = generateAreaReport(mockRegistrations, 'CHANDLODIYA');
      expect(report.totalRegistrations).toBe(5); // 5 active Chandlodiya, excludes C-99 (deleted) and Vadaj
      expect(report.totalBal).toBe(3); // C-1, C-3, C-4
      expect(report.totalBlk).toBe(2); // C-2, C-5
      expect(report.totalIssued).toBe(3); // C-1, C-3, C-5
      expect(report.totalPending).toBe(2); // C-2, C-4
      expect(report.totalCompanions).toBe(3); // C-1 (2) + C-3 (1) + C-5 (0)
      expect(report.totalAttendees).toBe(6); // 3 issued + 3 companions
    });

    it('groups Nirnaynagar and nirnayanagar together under one area bucket', () => {
      const report = generateAreaReport(mockRegistrations, 'CHANDLODIYA');
      const nirnayArea = report.areas.find((a) => a.areaKey === 'nirnaynagar');
      expect(nirnayArea).toBeDefined();
      expect(nirnayArea?.total).toBe(2); // C-2 and C-3 combined
      expect(nirnayArea?.balCount).toBe(1);
      expect(nirnayArea?.blkCount).toBe(1);
      expect(nirnayArea?.issuedCount).toBe(1); // C-3
      expect(nirnayArea?.pendingCount).toBe(1); // C-2
      expect(nirnayArea?.percentage).toBe(40); // 2 out of 5 = 40%
    });

    it('computes Vadaj center report correctly', () => {
      const report = generateAreaReport(mockRegistrations, 'VADAJ');
      expect(report.totalRegistrations).toBe(2);
      expect(report.totalBal).toBe(1);
      expect(report.totalBlk).toBe(1);
      expect(report.totalIssued).toBe(1);
      expect(report.totalCompanions).toBe(3);
      expect(report.totalAttendees).toBe(4);

      const vadajArea = report.areas.find((a) => a.areaKey === 'vadaj');
      expect(vadajArea?.total).toBe(1);
      expect(vadajArea?.percentage).toBe(50);
    });

    it('correctly includes custom localities like Ghatlodia', () => {
      const report = generateAreaReport(mockRegistrations, 'CHANDLODIYA');
      const ghatlodiaArea = report.areas.find((a) => a.displayName === 'Ghatlodia');
      expect(ghatlodiaArea).toBeDefined();
      expect(ghatlodiaArea?.total).toBe(1);
      expect(ghatlodiaArea?.balCount).toBe(0);
      expect(ghatlodiaArea?.blkCount).toBe(1);
    });
  });

  describe('filterAreaRegistrations', () => {
    it('filters by search term across name, mobile, code, and address', () => {
      const results1 = filterAreaRegistrations(mockRegistrations, { searchTerm: 'C-1' });
      expect(results1.length).toBe(1);
      expect(results1[0].fullName).toBe('Aarav Rajeshbhai Patel');

      const results2 = filterAreaRegistrations(mockRegistrations, { searchTerm: 'Shreeji' });
      expect(results2.length).toBe(1);
      expect(results2[0].societyName).toBe('Shreeji Park');

      const results3 = filterAreaRegistrations(mockRegistrations, { searchTerm: '9876543213' });
      expect(results3.length).toBe(1);
      expect(results3[0].registrationCode).toBe('C-4');
    });

    it('filters by department category', () => {
      const balOnly = filterAreaRegistrations(mockRegistrations, { category: 'BAL' });
      expect(balOnly.every((r) => r.category === 'BAL')).toBe(true);

      const blkOnly = filterAreaRegistrations(mockRegistrations, { category: 'BLK' });
      expect(blkOnly.every((r) => r.category === 'BLK')).toBe(true);
    });

    it('filters by cardStatus and source', () => {
      const issued = filterAreaRegistrations(mockRegistrations, { cardStatus: 'ISSUED' });
      expect(issued.every((r) => r.cardStatus === 'ISSUED')).toBe(true);

      const walkin = filterAreaRegistrations(mockRegistrations, { source: 'ON_THE_SPOT' });
      expect(walkin.length).toBe(1);
      expect(walkin[0].registrationCode).toBe('C-3');
    });

    it('sorts records in natural numeric code order', () => {
      const sorted = filterAreaRegistrations(mockRegistrations, { sortBy: 'CODE' });
      const codes = sorted.map((r) => r.registrationCode);
      expect(codes[0]).toBe('C-1');
      expect(codes[1]).toBe('V-1');
      expect(codes[2]).toBe('C-2');
    });
  });
});
