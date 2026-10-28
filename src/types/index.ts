export type DepartmentCategory = 'BAL' | 'BLK';
export type Vistar = 'VADAJ' | 'CHANDLODIYA' | string;
export type RegistrationSource = 'ONLINE' | 'ON_THE_SPOT';
export type CardStatus = 'NOT_ISSUED' | 'ISSUED';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'COORDINATOR' | 'VOLUNTEER';
export type DepartmentAccess = 'BAL_ONLY' | 'BLK_ONLY' | 'BOTH';
export type AccountType = 'INDIVIDUAL' | 'SHARED';
export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface Registration {
  id: string;
  registrationCode: string;
  category: DepartmentCategory;
  vistar: Vistar;
  
  // Confirmed Personal Fields (Immutable)
  firstName: string;
  fatherName: string;
  surname: string;
  fullName: string;
  mobileNumber: string;
  source: RegistrationSource;

  // Address and Locality Fields
  houseNumber?: string;
  societyName?: string;
  area?: string;

  // Operational Fields
  cardStatus: CardStatus;
  accompanyingPersonsCount: number;
  cardIssuedAt?: string | null;

  // Soft Deletion
  isDeleted: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;

  // Timestamps (ISO Strings or server timestamp representation)
  createdAt: string;
  updatedAt: string;

  // Normalized search tokens
  fullNameNormalized?: string;
  mobileNumberNormalized?: string;
  registrationCodeNormalized?: string;
  nameSearchTokens?: string[];
}

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  categoryAccess: DepartmentAccess;
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CenterConfig {
  id: string; // e.g. "chandlodiya", "vadaj", "bopal"
  name: string; // e.g. "Chandlodiya"
  gujaratiName: string; // e.g. "ચાંદલોડિયા"
  codePrefix: string; // e.g. "C", "V", "B"
  date: string; // e.g. "2026-10-31"
  day: string; // e.g. "Saturday (શનિવાર)"
  time: string; // e.g. "05:00 PM – 08:00 PM"
  venue: string; // e.g. "BAPS Swaminarayan Sanskardham"
  address?: string;
  balStartCode?: number; // default: 1
  balikaStartCode?: number; // default: 1001
  balBoxCutoff?: number; // default: 400
  balikaBoxCutoff?: number; // default: 1400
}

export interface FirebaseProjectConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId?: string;
}

export interface EventSettings {
  eventName: string;
  eventDate: string | null;
  eventTime: string | null;
  venue: string;
  address: string;
  description: string;
  instructions: string;
  contactInformation: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  photoUrls: string[];
  publicRegistrationEnabled: boolean;
  onSpotRegistrationEnabled: boolean;
  automaticClosingAt: string | null;
  broadcastAnnouncement?: string | null;
  broadcastActive?: boolean;

  // Setup Wizard & Dynamic Configuration
  setupCompleted?: boolean;
  setupCompletedAt?: string;
  organizationName?: string;
  helplinePhone?: string;
  helplineWhatsApp?: string;
  centers?: CenterConfig[];
  customAreas?: string[];
  firebaseConfig?: FirebaseProjectConfig;
  
  // Legacy Vistar Details (Maintained for full backward compatibility)
  vadajDate?: string | null;
  vadajDay?: string | null;
  vadajTime?: string | null;
  vadajVenue?: string;
  chandlodiyaDate?: string | null;
  chandlodiyaDay?: string | null;
  chandlodiyaTime?: string | null;
  chandlodiyaVenue?: string;

  updatedAt: string;
}

export interface DepartmentStatistics {
  category: DepartmentCategory;
  totalRegistrations: number;
  onlineRegistrations: number;
  onSpotRegistrations: number;
  cardsIssued: number;
  cardsPending: number;
  accompanyingPersonsPresent: number;
  updatedAt: string;
}

export interface OverallStatistics {
  bal: DepartmentStatistics;
  blk: DepartmentStatistics;
  combined: {
    totalRegistrations: number;
    onlineRegistrations: number;
    onSpotRegistrations: number;
    cardsIssued: number; // Children Present
    cardsPending: number;
    accompanyingPersonsPresent: number;
    totalAttendance: number; // cardsIssued + accompanyingPersonsPresent
  };
  lastUpdated: string;
}
