# Database Schema & Data Models

## BAPS Anandotsav 2026
### Cloud Firestore Schema Specification

**Document Version:** 1.0  
**Date:** October 17, 2026  
**Status:** Approved Schema Baseline  

---

## 1. Overview & Core Data Principles

1. **Duplicate Registrations Allowed:**
   - No unique constraint on `mobileNumber` or `fullName`.
   - Each registration receives an independent, atomically generated `registrationCode`.
2. **Immutable Submitted Details:**
   - Fields submitted during registration (`category`, `firstName`, `fatherName`, `surname`, `fullName`, `mobileNumber`, `source`, `createdAt`) are read-only once written.
   - Only operational fields (`cardStatus`, `accompanyingPersonsCount`, `isDeleted`, `deletedAt`, `cardIssuedAt`, `updatedAt`) are updated.
3. **Atomic Counters:**
   - Counters for BAL and BLK reside in distinct documents (`registrationCounters/BAL` and `registrationCounters/BLK`) and are incremented inside Firestore transactions.
4. **Soft Delete:**
   - Records are never physically deleted. They retain their original `registrationCode` and are flagged with `isDeleted: true`.

---

## 2. Collections Specification

### 2.1 Center-Partitioned Collections: `chandlodiya` & `vadaj`
Paths: 
- `/chandlodiya/{registrationId}` (for Chandlodiya center — 31/10/2026 Saturday)
- `/vadaj/{registrationId}` (for Vadaj center — 01/11/2026 Sunday)
- Mirror / Dual-sync: `/registrations/{registrationId}` (for global compatibility)

Inside each center collection, special counter and configuration documents exist:
- `_center_config`: Metadata about the center (name, event date, venue, base sequence)
- `counter_BAL`: Atomic counter for Bal Vibhag registrations (Chandlodiya starts 1000 -> BAL-1001+; Vadaj starts 0 -> BAL-0001+)
- `counter_BLK`: Atomic counter for Balika Vibhag registrations (Chandlodiya starts 1000 -> BLK-1001+; Vadaj starts 0 -> BLK-0001+)

```typescript
import { Timestamp } from "firebase/firestore";

export type DepartmentCategory = "BAL" | "BLK";
export type Vistar = "VADAJ" | "CHANDLODIYA";
export type RegistrationSource = "ONLINE" | "ON_THE_SPOT";
export type CardStatus = "NOT_ISSUED" | "ISSUED";

export interface RegistrationDocument {
  // Primary Identifier
  id: string; // Auto-generated Firestore document ID

  // System-assigned sequential identifier
  registrationCode: string; // e.g., "BAL-0001" (Vadaj), "BAL-1001" (Chandlodiya)

  // Category & Center
  category: DepartmentCategory; // "BAL" (Bal Vibhag) or "BLK" (Balika Vibhag)
  vistar: Vistar; // "VADAJ" or "CHANDLODIYA"

  // Confirmed Child Details (Immutable)
  firstName: string; // Child's first name
  fatherName: string; // Father's name
  surname: string; // Family surname
  fullName: string; // Calculated: `${firstName} ${fatherName} ${surname}`

  // Contact Information (Immutable)
  mobileNumber: string; // 10-digit standard mobile number

  // Origin (Immutable)
  source: RegistrationSource; // "ONLINE" (Public portal) or "ON_THE_SPOT" (Volunteer quick registration)

  // Operational Fields (Mutable via authorized transactions)
  cardStatus: CardStatus; // "NOT_ISSUED" (default) or "ISSUED"
  accompanyingPersonsCount: number; // Mandatory >= 0 at issuance; registered child excluded
  cardIssuedAt: Timestamp | null; // Timestamp of when the card was marked ISSUED

  // Soft Deletion State (Mutable via Admin/Coordinator)
  isDeleted: boolean; // Default: false. True indicates soft deletion
  deletedAt: Timestamp | null; // Timestamp when soft-deleted
  deletedBy: string | null; // Staff UID who performed soft deletion

  // Audit Timestamps
  createdAt: Timestamp; // Creation server timestamp
  updatedAt: Timestamp; // Last modified server timestamp

  // Search Optimization Tokens (Generated on server upon creation)
  fullNameNormalized: string; // Lowercase trimmed full name
  mobileNumberNormalized: string; // Digits only
  registrationCodeNormalized: string; // Lowercase code without hyphen for flexible lookup
  nameSearchTokens: string[]; // Lowercase prefix tokens (e.g., ["aar", "aara", "aarav", ...])
}
```

#### Firestore Indexes:
1. `category` ASC, `isDeleted` ASC, `createdAt` DESC (For departmental filtering & sorting)
2. `category` ASC, `isDeleted` ASC, `nameSearchTokens` ARRAY_CONTAINS (For search-as-you-type)
3. `category` ASC, `isDeleted` ASC, `mobileNumber` ASC (For phone lookup)
4. `registrationCode` ASC (Unique lookup)

---

### 2.2 Center Atomic Counters
Paths:
- `/chandlodiya/counter_BAL` & `/chandlodiya/counter_BLK`
- `/vadaj/counter_BAL` & `/vadaj/counter_BLK`
- Legacy mirror: `/registrationCounters/{vistar}_{category}`

```typescript
export interface RegistrationCounterDocument {
  category: "BAL" | "BLK";
  vistar: "VADAJ" | "CHANDLODIYA";
  lastAllocatedNumber: number; // e.g., Vadaj base 0 -> next 1; Chandlodiya base 1000 -> next 1001
  updatedAt: Timestamp;
}
```

---

### 2.3 Collection: `users`
Path: `/users/{uid}`

```typescript
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "COORDINATOR" | "VOLUNTEER";
export type DepartmentAccess = "BAL_ONLY" | "BLK_ONLY" | "BOTH";
export type AccountType = "INDIVIDUAL" | "SHARED";
export type AccountStatus = "ACTIVE" | "DISABLED";

export interface StaffUserDocument {
  uid: string; // Firebase Auth UID
  email: string; // Login email
  displayName: string; // Human-readable staff or team name
  role: UserRole;
  categoryAccess: DepartmentAccess; // Allowed departmental scope
  accountType: AccountType; // "INDIVIDUAL" for staff, "SHARED" for volunteer team
  status: AccountStatus; // "ACTIVE" or "DISABLED"

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
}
```

---

### 2.4 Collection: `eventSettings`
Path: `/eventSettings/current`

```typescript
export interface EventSettingsDocument {
  eventName: string; // "BAPS Anandotsav 2026"
  eventDate: Timestamp | null;
  eventTime: string | null;
  venue: string;
  address: string;
  description: string;
  instructions: string;
  contactInformation: string;

  // Media URLs in Firebase Storage
  logoUrl: string | null;
  bannerUrl: string | null;
  photoUrls: string[];

  // Availability Toggles
  publicRegistrationEnabled: boolean; // Manual public registration toggle
  onSpotRegistrationEnabled: boolean; // Manual on-the-spot registration toggle
  automaticClosingAt: Timestamp | null; // Scheduled auto-close timestamp for public registrations

  updatedAt: Timestamp;
  updatedBy: string; // UID of Admin who saved settings
}
```

---

### 2.5 Collection: `statistics`
Path: `/statistics/{categoryId}`  
Documents: `/statistics/BAL` and `/statistics/BLK`

```typescript
export interface DepartmentStatisticsDocument {
  category: "BAL" | "BLK";

  totalRegistrations: number; // Total active (isDeleted == false) registrations
  onlineRegistrations: number; // Active registrations created via public portal
  onSpotRegistrations: number; // Active registrations created on-the-spot

  cardsIssued: number; // Active registrations with cardStatus == "ISSUED" (Children Present)
  cardsPending: number; // Active registrations with cardStatus == "NOT_ISSUED"

  accompanyingPersonsPresent: number; // Sum of accompanying persons for active issued cards

  updatedAt: Timestamp;
}
```

#### Total Attendance Formula (Computed on read):
$$\text{Children Present} = \text{cardsIssued}$$
$$\text{Accompanying Persons Present} = \text{accompanyingPersonsPresent}$$
$$\text{Total Attendance} = \text{cardsIssued} + \text{accompanyingPersonsPresent}$$

---

### 2.6 Collection: `registrationRequests` (Idempotency)
Path: `/registrationRequests/{idempotencyKey}`

```typescript
export interface RegistrationRequestDocument {
  idempotencyKey: string;
  registrationId: string;
  registrationCode: string;
  category: "BAL" | "BLK";
  createdAt: Timestamp;
  expiresAt: Timestamp; // TTL index cleanup after 24 hours
}
```

---

## 3. Collections Explicitly Forbidden

To avoid any architectural regression, the following collections **must never be introduced**:
- `mobileReservations` (Violates duplicate registration allowance)
- `duplicateRegistrations` (Violates duplicate registration allowance)
- `duplicateDetection` (Violates duplicate registration allowance)
- `individualVolunteerLogs` (Violates shared volunteer account model)
