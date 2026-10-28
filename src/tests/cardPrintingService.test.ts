import { describe, it, expect } from 'vitest';
import { 
  isCardPrePrinted, 
  formatCodeNumber,
  type CardPrintingSettings 
} from '@/services/cardPrintingService';

describe('Card Printing Service Cutoff Logic', () => {
  const sampleSettings: CardPrintingSettings = {
    chandlodiyaBalCutoff: 50,
    chandlodiyaBlkCutoff: 1040,
    vadajBalCutoff: 50,
    vadajBlkCutoff: 1040,
  };

  describe('Chandlodiya Area (C-1..1000 for BAL, C-1001+ for BLK)', () => {
    it('marks cards <= cutoff as pre-printed', () => {
      // Chandlodiya BAL cutoff is 50
      expect(isCardPrePrinted('C-1', 'BAL', 'CHANDLODIYA', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('C-25', 'BAL', 'CHANDLODIYA', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('C-50', 'BAL', 'CHANDLODIYA', sampleSettings)).toBe(true);

      // Chandlodiya BLK cutoff is 1040
      expect(isCardPrePrinted('C-1001', 'BLK', 'CHANDLODIYA', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('C-1040', 'BLK', 'CHANDLODIYA', sampleSettings)).toBe(true);
    });

    it('marks cards > cutoff as non-printed (manual card required)', () => {
      // Chandlodiya BAL cutoff is 50
      expect(isCardPrePrinted('C-51', 'BAL', 'CHANDLODIYA', sampleSettings)).toBe(false);
      expect(isCardPrePrinted('C-90', 'BAL', 'CHANDLODIYA', sampleSettings)).toBe(false);

      // Chandlodiya BLK cutoff is 1040
      expect(isCardPrePrinted('C-1041', 'BLK', 'CHANDLODIYA', sampleSettings)).toBe(false);
      expect(isCardPrePrinted('C-1100', 'BLK', 'CHANDLODIYA', sampleSettings)).toBe(false);
    });
  });

  describe('Vadaj Area (V-1..1000 for BAL, V-1001+ for BLK)', () => {
    it('marks cards <= cutoff as pre-printed', () => {
      // Vadaj BAL cutoff is 50
      expect(isCardPrePrinted('V-1', 'BAL', 'VADAJ', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('V-25', 'BAL', 'VADAJ', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('V-50', 'BAL', 'VADAJ', sampleSettings)).toBe(true);

      // Vadaj BLK cutoff is 1040
      expect(isCardPrePrinted('V-1001', 'BLK', 'VADAJ', sampleSettings)).toBe(true);
      expect(isCardPrePrinted('V-1040', 'BLK', 'VADAJ', sampleSettings)).toBe(true);
    });

    it('marks cards > cutoff as non-printed (manual card required)', () => {
      // Vadaj BAL cutoff is 50
      expect(isCardPrePrinted('V-51', 'BAL', 'VADAJ', sampleSettings)).toBe(false);
      expect(isCardPrePrinted('V-80', 'BAL', 'VADAJ', sampleSettings)).toBe(false);

      // Vadaj BLK cutoff is 1040
      expect(isCardPrePrinted('V-1041', 'BLK', 'VADAJ', sampleSettings)).toBe(false);
      expect(isCardPrePrinted('V-1100', 'BLK', 'VADAJ', sampleSettings)).toBe(false);
    });
  });

  describe('Edge cases and unconfigured settings', () => {
    it('returns false when settings are null or undefined', () => {
      expect(isCardPrePrinted('C-15', 'BAL', 'CHANDLODIYA', null)).toBe(false);
      expect(isCardPrePrinted('V-25', 'BAL', 'VADAJ', undefined)).toBe(false);
    });

    it('returns false when cutoff is 0 (no cards printed yet)', () => {
      const zeroSettings: CardPrintingSettings = {
        chandlodiyaBalCutoff: 0,
        chandlodiyaBlkCutoff: 0,
        vadajBalCutoff: 0,
        vadajBlkCutoff: 0,
      };
      expect(isCardPrePrinted('C-1', 'BAL', 'CHANDLODIYA', zeroSettings)).toBe(false);
      expect(isCardPrePrinted('V-1', 'BAL', 'VADAJ', zeroSettings)).toBe(false);
    });

    it('infers vistar and category correctly from registration code if hints are missing', () => {
      // C-25 starts with C- so Chandlodiya, num <= 1000 so Bal
      expect(isCardPrePrinted('C-25', undefined, undefined, sampleSettings)).toBe(true);
      // V-25 starts with V- so Vadaj, num <= 1000 so Bal
      expect(isCardPrePrinted('V-25', undefined, undefined, sampleSettings)).toBe(true);
      // C-1025 starts with C- so Chandlodiya, num > 1000 so Blk
      expect(isCardPrePrinted('C-1025', undefined, undefined, sampleSettings)).toBe(true);
      // V-1025 starts with V- so Vadaj, num > 1000 so Blk
      expect(isCardPrePrinted('V-1025', undefined, undefined, sampleSettings)).toBe(true);
    });
  });

  describe('formatCodeNumber helper', () => {
    it('formats numbers into registration codes with vistar', () => {
      expect(formatCodeNumber('BAL', 50, 'CHANDLODIYA')).toBe('C-50');
      expect(formatCodeNumber('BLK', 1040, 'CHANDLODIYA')).toBe('C-1040');
      expect(formatCodeNumber('BAL', 50, 'VADAJ')).toBe('V-50');
      expect(formatCodeNumber('BLK', 1040, 'VADAJ')).toBe('V-1040');
      expect(formatCodeNumber('BAL', 50)).toBe('V-50');
      expect(formatCodeNumber('BAL', 0)).toBe('None (0)');
    });
  });
});
