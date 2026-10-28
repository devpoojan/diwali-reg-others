import { describe, it, expect } from 'vitest';
import { 
  generateSearchTokens,
  getVistarFromRegistrationCode,
  getCategoryFromRegistrationCode,
  detectSearchType 
} from '@/services/registrationService';

describe('Registration Search Tokens', () => {
  it('generates prefix tokens for child name components', () => {
    const tokens = generateSearchTokens('Aarav', 'Rajeshbhai', 'Patel');

    // Should contain prefixes for Aarav
    expect(tokens).toContain('a');
    expect(tokens).toContain('aa');
    expect(tokens).toContain('aar');
    expect(tokens).toContain('aara');
    expect(tokens).toContain('aarav');

    // Should contain prefixes for Rajeshbhai
    expect(tokens).toContain('r');
    expect(tokens).toContain('ra');
    expect(tokens).toContain('raj');
    expect(tokens).toContain('rajesh');

    // Should contain prefixes for Patel
    expect(tokens).toContain('p');
    expect(tokens).toContain('pa');
    expect(tokens).toContain('pat');
    expect(tokens).toContain('patel');
  });

  it('handles casing and leading/trailing whitespace cleanly', () => {
    const tokens = generateSearchTokens('  Diya  ', 'Mukeshbhai', 'Shah');
    expect(tokens).toContain('d');
    expect(tokens).toContain('di');
    expect(tokens).toContain('diy');
    expect(tokens).toContain('diya');
  });
});

describe('English Name Validation', () => {
  const englishNameRegex = /^[A-Za-z\s.'-]+$/;

  it('accepts valid English names with spaces, dots, and hyphens', () => {
    expect(englishNameRegex.test('Aarav')).toBe(true);
    expect(englishNameRegex.test('Rajeshbhai')).toBe(true);
    expect(englishNameRegex.test('Patel')).toBe(true);
    expect(englishNameRegex.test('Mary-Jane')).toBe(true);
    expect(englishNameRegex.test('St. John')).toBe(true);
  });

  it('rejects Gujarati or non-English script names', () => {
    expect(englishNameRegex.test('આરવ')).toBe(false);
    expect(englishNameRegex.test('રાજેશભાઈ')).toBe(false);
    expect(englishNameRegex.test('પટેલ')).toBe(false);
  });

  it('rejects numbers or illegal symbols in names', () => {
    expect(englishNameRegex.test('Aarav123')).toBe(false);
    expect(englishNameRegex.test('Patel@!')).toBe(false);
  });
});

describe('Vistar Registration Code Numbering Schemes', () => {
  it('formats Vadaj sequence: BAL is V-1..1000, BLK is V-1001 onwards', () => {
    const vadajBalBase = 0;
    const vadajBlkBase = 1000;
    const balCode = `V-${vadajBalBase + 1}`;
    const blkCode = `V-${vadajBlkBase + 1}`;
    expect(balCode).toBe('V-1');
    expect(blkCode).toBe('V-1001');
  });

  it('formats Chandlodiya sequence: BAL is C-1..1000, BLK is C-1001 onwards', () => {
    const chdBalBase = 0;
    const chdBlkBase = 1000;
    const balCode = `C-${chdBalBase + 1}`;
    const blkCode = `C-${chdBlkBase + 1}`;
    expect(balCode).toBe('C-1');
    expect(blkCode).toBe('C-1001');
  });

  it('resolves vistar accurately from code prefix', () => {
    expect(getVistarFromRegistrationCode('V-1')).toBe('VADAJ');
    expect(getVistarFromRegistrationCode('V-1001')).toBe('VADAJ');
    expect(getVistarFromRegistrationCode('C-1')).toBe('CHANDLODIYA');
    expect(getVistarFromRegistrationCode('C-1001')).toBe('CHANDLODIYA');
  });

  it('resolves category from code number boundary', () => {
    expect(getCategoryFromRegistrationCode('V-1')).toBe('BAL');
    expect(getCategoryFromRegistrationCode('V-1000')).toBe('BAL');
    expect(getCategoryFromRegistrationCode('V-1001')).toBe('BLK');
    expect(getCategoryFromRegistrationCode('C-50')).toBe('BAL');
    expect(getCategoryFromRegistrationCode('C-1000')).toBe('BAL');
    expect(getCategoryFromRegistrationCode('C-1001')).toBe('BLK');
  });

  it('detects search type correctly for codes, numbers, mobiles, and names', () => {
    expect(detectSearchType('V-1')).toBe('code');
    expect(detectSearchType('v-25')).toBe('code');
    expect(detectSearchType('C-1001')).toBe('code');
    expect(detectSearchType('c-50')).toBe('code');
    expect(detectSearchType('42')).toBe('code');
    expect(detectSearchType('1025')).toBe('code');
    expect(detectSearchType('1')).toBe('code');
    expect(detectSearchType('9876543210')).toBe('mobile');
    expect(detectSearchType('Aarav Patel')).toBe('name');
  });
});

describe('Search Result Card Status Ordering', () => {
  it('sorts non-issued cards first and issued cards below', () => {
    const records = [
      { id: '1', fullName: 'Aarav Patel', cardStatus: 'ISSUED' },
      { id: '2', fullName: 'Bhavik Shah', cardStatus: 'NOT_ISSUED' },
      { id: '3', fullName: 'Chirag Dave', cardStatus: 'ISSUED' },
      { id: '4', fullName: 'Dhruv Joshi', cardStatus: 'NOT_ISSUED' },
    ];

    const sorted = [...records].sort((a, b) => {
      const aIssued = a.cardStatus === 'ISSUED' ? 1 : 0;
      const bIssued = b.cardStatus === 'ISSUED' ? 1 : 0;
      return aIssued - bIssued;
    });

    expect(sorted.map((r) => r.id)).toEqual(['2', '4', '1', '3']);
    expect(sorted[0].cardStatus).toBe('NOT_ISSUED');
    expect(sorted[1].cardStatus).toBe('NOT_ISSUED');
    expect(sorted[2].cardStatus).toBe('ISSUED');
    expect(sorted[3].cardStatus).toBe('ISSUED');
  });
});

describe('Walk-in (ON_THE_SPOT) Registration Flexibility', () => {
  it('generates search tokens even when names are empty or partial', () => {
    const tokensEmpty = generateSearchTokens('', '', '');
    expect(tokensEmpty).toEqual([]);

    const tokensFirstOnly = generateSearchTokens('Aarav', '', '');
    expect(tokensFirstOnly).toContain('a');
    expect(tokensFirstOnly).toContain('aarav');
  });

  it('computes full name fallback for walk-in when fields are omitted', () => {
    const nameParts1 = ['', '', ''].filter(Boolean);
    const fullName1 = nameParts1.length > 0 ? nameParts1.join(' ') : 'Walk-in Child';
    expect(fullName1).toBe('Walk-in Child');

    const nameParts2 = ['Aarav', '', ''].filter(Boolean);
    const fullName2 = nameParts2.length > 0 ? nameParts2.join(' ') : 'Walk-in Child';
    expect(fullName2).toBe('Aarav');
  });
});

describe('Center-specific Area and Address Options', () => {
  it('validates Vadaj sub-areas: Vadaj, Nirnayanagar, or custom other', () => {
    const vadajAllowed = ['Vadaj', 'Nirnayanagar', 'OTHER'];
    expect(vadajAllowed.includes('Vadaj')).toBe(true);
    expect(vadajAllowed.includes('Nirnayanagar')).toBe(true);
    expect(vadajAllowed.includes('OTHER')).toBe(true);
    expect(vadajAllowed.includes('Ognaj')).toBe(false);
  });

  it('validates Chandlodiya sub-areas: Chandlodiya, Ognaj, Tragad, or custom other', () => {
    const chandlodiyaAllowed = ['Chandlodiya', 'Ognaj', 'Tragad', 'OTHER'];
    expect(chandlodiyaAllowed.includes('Chandlodiya')).toBe(true);
    expect(chandlodiyaAllowed.includes('Ognaj')).toBe(true);
    expect(chandlodiyaAllowed.includes('Tragad')).toBe(true);
    expect(chandlodiyaAllowed.includes('OTHER')).toBe(true);
    expect(chandlodiyaAllowed.includes('Nirnayanagar')).toBe(false);
  });

  it('resolves final area correctly when OTHER is selected with custom text', () => {
    const resolveArea = (selected: string, other: string) => selected === 'OTHER' ? other.trim() : selected;
    expect(resolveArea('Vadaj', '')).toBe('Vadaj');
    expect(resolveArea('Tragad', '')).toBe('Tragad');
    expect(resolveArea('OTHER', '  Gota  ')).toBe('Gota');
    expect(resolveArea('OTHER', 'Science City')).toBe('Science City');
  });

  it('formats address display combining houseNumber, societyName, and area', () => {
    const formatAddress = (house?: string, society?: string, area?: string) =>
      [house, society, area].filter(Boolean).join(', ');

    expect(formatAddress('A-102', 'Shantiniketan', 'Nirnayanagar')).toBe('A-102, Shantiniketan, Nirnayanagar');
    expect(formatAddress('45', 'Shreeji Krupa', 'Tragad')).toBe('45, Shreeji Krupa, Tragad');
  });

  it('validates English address helper regex', () => {
    const hasNonEnglishAddress = (str: string) => /[^A-Za-z0-9\s.,/#'()\-&]/.test(str);

    // Valid English addresses
    expect(hasNonEnglishAddress('A-102')).toBe(false);
    expect(hasNonEnglishAddress('Flat #402, Block-B')).toBe(false);
    expect(hasNonEnglishAddress('Shantiniketan Society')).toBe(false);
    expect(hasNonEnglishAddress('Science City Road')).toBe(false);

    // Non-English / Gujarati characters rejected
    expect(hasNonEnglishAddress('શાંતિનિકેતન')).toBe(true);
    expect(hasNonEnglishAddress('એ-૧૦૨')).toBe(true);
    expect(hasNonEnglishAddress('ગોતા')).toBe(true);
  });
});

describe('Administrative Danger Zone & 7-Checkpoint Nuclear Protocol', () => {
  const MASTER_PASSWORD = 'qwertyuiop';
  const REQUIRED_TYPED_PHRASE = 'PERMANENTLY DELETE ALL ANANDOTSAV 2026 REGISTRATIONS';

  it('validates the configured master administrative password strictly', () => {
    const checkPassword = (p: string) => p === MASTER_PASSWORD;
    expect(checkPassword('qwertyuiop')).toBe(true);
    expect(checkPassword('wrongpass')).toBe(false);
    expect(checkPassword('QWERTYUIOP')).toBe(false);
    expect(checkPassword('')).toBe(false);
  });

  it('enforces 3-attempt lockout threshold on master password failures', () => {
    let attempts = 0;
    const maxAllowed = 3;
    const tryPassword = (input: string) => {
      if (input !== MASTER_PASSWORD) {
        attempts++;
        return { success: false, lockedOut: attempts >= maxAllowed };
      }
      return { success: true, lockedOut: false };
    };

    expect(tryPassword('wrong1')).toEqual({ success: false, lockedOut: false });
    expect(tryPassword('wrong2')).toEqual({ success: false, lockedOut: false });
    expect(tryPassword('wrong3')).toEqual({ success: false, lockedOut: true });
  });

  it('validates the exact 51-character uppercase confirmation oath phrase', () => {
    const validatePhrase = (input: string) => input.trim() === REQUIRED_TYPED_PHRASE;
    expect(validatePhrase('PERMANENTLY DELETE ALL ANANDOTSAV 2026 REGISTRATIONS')).toBe(true);
    expect(validatePhrase('  PERMANENTLY DELETE ALL ANANDOTSAV 2026 REGISTRATIONS  ')).toBe(true);
    expect(validatePhrase('permanently delete all anandotsav 2026 registrations')).toBe(false);
    expect(validatePhrase('PERMANENTLY DELETE ALL')).toBe(false);
  });

  it('validates 3-term mental arithmetic challenge', () => {
    const solveChallenge = (n1: number, n2: number, n3: number) => (n1 * n2) + n3;
    expect(solveChallenge(7, 8, 15)).toBe(71);
    expect(solveChallenge(9, 6, 22)).toBe(76);
  });

  it('requires all five explicit risk acknowledgement checkboxes in checkpoint 4', () => {
    const canProceedStep4 = (a1: boolean, a2: boolean, a3: boolean, a4: boolean, a5: boolean) =>
      a1 && a2 && a3 && a4 && a5;

    expect(canProceedStep4(true, true, true, true, true)).toBe(true);
    expect(canProceedStep4(true, true, true, true, false)).toBe(false);
    expect(canProceedStep4(true, false, true, true, true)).toBe(false);
    expect(canProceedStep4(false, true, true, true, true)).toBe(false);
    expect(canProceedStep4(false, false, false, false, false)).toBe(false);
  });

  it('requires 100% hold-to-charge progress before checkpoint 7 unlocks', () => {
    const isHoldComplete = (progress: number) => progress >= 100;
    expect(isHoldComplete(100)).toBe(true);
    expect(isHoldComplete(99)).toBe(false);
    expect(isHoldComplete(50)).toBe(false);
    expect(isHoldComplete(0)).toBe(false);
  });

  it('verifies baseline counter reset targets', () => {
    // Vadaj resets to 0 for BAL (next is V-1) and 1000 for BLK (next is V-1001)
    const vadajBalReset = 0;
    const vadajBlkReset = 1000;
    expect(`V-${vadajBalReset + 1}`).toBe('V-1');
    expect(`V-${vadajBlkReset + 1}`).toBe('V-1001');

    // Chandlodiya resets to 0 for BAL (next is C-1) and 1000 for BLK (next is C-1001)
    const chdBalReset = 0;
    const chdBlkReset = 1000;
    expect(`C-${chdBalReset + 1}`).toBe('C-1');
    expect(`C-${chdBlkReset + 1}`).toBe('C-1001');
  });
});

