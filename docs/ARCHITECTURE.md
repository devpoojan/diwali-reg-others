# System Architecture Document

## BAPS Anandotsav 2026
### Public Registration, Volunteer Operations & Event Management System

**Document Version:** 1.0  
**Date:** October 17, 2026  
**Status:** Approved Architectural Baseline  

---

## 1. System Overview

BAPS Anandotsav 2026 is an online-only, cloud-hosted web application designed to support two distinct departments:
- **BAL** (Bal Vibhag)
- **BLK** (Balika Vibhag)

The system serves public visitors, volunteers, coordinators, administrators, and super administrators with tailored interfaces, strict server-enforced role-based access control, atomic number generation, and high-reliability event-day operational workflows.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|  +--------------------+  +----------------------+  +----------------------------+ |
|  |   Public Portal    |  |   Volunteer Panel    |  |  Coordinator & Admin Panel | |
|  |  (Claymorphism UI) |  |  (Mobile-First Fast) |  |  (Clean Data-Focused UI)   | |
|  +--------------------+  +----------------------+  +----------------------------+ |
|                                       |                                           |
|                               Vite + React SPA                                    |
+-----------------------------------------------------------------------------------+
                                        | HTTPS / REST / WSS
+-----------------------------------------------------------------------------------+
|                                 SERVICES LAYER                                    |
|                                                                                   |
|  +--------------------+  +------------------------------------------------------+ |
|  |   Firebase Auth    |  |              Cloud Functions (2nd Gen)               | |
|  | - Individual Staff |  | - Atomic Registration & Code Generator               | |
|  | - Shared Team BAL  |  | - Atomic Card Issuance & Accompanying Count          | |
|  | - Shared Team BLK  |  | - Card Reversal & Count Updates                      | |
|  | - Custom Claims    |  | - Soft Delete & Restore Workflows                    | |
|  |                    |  | - Excel (.xlsx) Exporter                             | |
|  +--------------------+  +------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                        |
+-----------------------------------------------------------------------------------+
|                                   DATA LAYER                                      |
|                                                                                   |
|  +-------------------------------------+  +-------------------------------------+ |
|  |           Cloud Firestore           |  |          Firebase Storage           | |
|  | - registrations                     |  | - Event Branding (Logo, Banner)     | |
|  | - users                             |  | - Event Photos                      | |
|  | - registrationCounters (BAL / BLK)  |  +-------------------------------------+ |
|  | - eventSettings                     |  |       Google Cloud Monitoring       | |
|  | - statistics                        |  | - Audit logging                     | |
|  | - registrationRequests (Idempotency)|  | - Latency & error alerts            | |
|  +-------------------------------------+  +-------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** React 19 / 18 with TypeScript (strict mode enabled).
- **Bundler & Tooling:** Vite for rapid builds and optimized bundles.
- **Styling:** Tailwind CSS with utility classes and CSS variables.
- **Component Primitives:** shadcn/ui (Radix UI accessible primitives).
- **Animations:** Motion (Framer Motion) for subtle transitions on public claymorphic components.
- **Routing:** React Router v6.
- **Forms & Validation:** React Hook Form + Zod for strict type-safe validation.
- **Excel Generation:** SheetJS (`xlsx`) for client/server export generation.

### 2.2 Backend & Cloud Infrastructure
- **Hosting:** Firebase Hosting (CDN cached static assets).
- **Authentication:** Firebase Authentication supporting email/password with custom JWT claims.
- **Database:** Google Cloud Firestore (NoSQL, multi-region/regional transaction-safe document store).
- **Serverless API:** Cloud Functions for Firebase 2nd Gen (Node.js 20+ runtime).
- **File Storage:** Firebase Storage with security rules enforcing authenticated upload limits.
- **Telemetry & Monitoring:** Google Cloud Monitoring & Cloud Logging.

---

## 3. UI/UX Paradigm Separation

The architecture strictly enforces three distinct UI design tiers:

| Tier | Target Audience | Design System | Characteristics |
| :--- | :--- | :--- | :--- |
| **Public Portal** | Parents, Guardians | **Claymorphism** | Festive, colorful, 3D rounded card aesthetics, soft double shadows, warm joyful palette, mobile-responsive. |
| **Volunteer Panel** | Event-Day Ground Volunteers | **Mobile-First Utility** | **NO Claymorphism**. High contrast, clean, ultra-fast, single-handed mobile ergonomics, minimal animation, instant tactile feedback. |
| **Admin & Coordinator** | Staff & Supervisors | **Data-Centric Professional** | **NO Claymorphism**. High information density, responsive desktop/tablet tables, clear filtering, manual refresh indicators. |

---

## 4. Subsystem Architectures

### 4.1 Registration Engine & Atomic Number Allocation

#### Non-Negotiables:
1. **Duplicate Registrations Allowed:** No unique index on mobile numbers or child names.
2. **Atomic Registration Codes:** Separate sequences for BAL and BLK:
   - `BAL-0001`, `BAL-0002`...
   - `BLK-0001`, `BLK-0002`...
   - Expandable beyond 4 digits (e.g., `BAL-10000`).
   - Shared between online and on-the-spot workflows.
   - Never reused, preserved across soft-deletions.
   - Code is hidden from public responses and success screens.
3. **Immutability:** Original submitted data cannot be modified by any role.

#### Sequence Diagram:
```
Parent / Volunteer              Backend Cloud Function                 Firestore Transaction
        |                                 |                                      |
        |--- Submit Registration Payload->|                                      |
        |    (with idempotency key)       |--- Check idempotency doc ----------->|
        |                                 |    (if cached, return stored res)    |
        |                                 |                                      |
        |                                 |--- Run Transaction: ---------------->|
        |                                 |    1. Read registrationCounters/CAT  |
        |                                 |    2. nextNumber = lastNumber + 1    |
        |                                 |    3. Format code: CAT-XXXX          |
        |                                 |    4. Write registrations/{id}       |
        |                                 |    5. Update counter                 |
        |                                 |    6. Increment stats aggregate      |
        |                                 |    7. Write idempotency record       |
        |                                 |<-- Commit Transaction ----------------|
        |                                 |
        |<-- Success (Code omitted if pub)|
```

### 4.2 Volunteer Search Architecture

Event-day search requires low-latency matching while typing:
- **Search Keys:**
  1. Child full name / partial name
  2. Mobile number
  3. Registration code (e.g., `BAL-0042`)
- **Firestore Strategy:**
  - Standard Firestore does not support substring full-text search.
  - To maintain sub-second responses without complex external infrastructure, records store:
    - `fullNameNormalized`: Lowercase trimmed string.
    - `nameSearchTokens`: Array of search prefix tokens (generated from First Name, Father's Name, Surname).
    - `mobileNumber`: Normalized numeric string.
    - `registrationCode`: Exact uppercase format.
  - Client implements 300ms debouncing.
  - Queries strictly filter by `category == user.categoryAccess` (unless `BOTH`) and `isDeleted == false`.
  - Multiple matching registrations are returned as distinct selectable cards—**never auto-merged**.

### 4.3 Physical Card Issuance & Attendance Architecture

Physical games cards are handed out manually. No QR scanning or physical card ID linking is required.

#### Workflow & Consistency:
1. Volunteer selects child from search results.
2. Volunteer clicks **Issue Card**.
3. A modal forces entry of **Accompanying Persons Count** ($\ge 0$, registered child excluded).
4. On Confirm, Cloud Function executes an atomic transaction:
   - Verifies `cardStatus == 'NOT_ISSUED'` and `isDeleted == false`.
   - Sets `cardStatus = 'ISSUED'`.
   - Stores `accompanyingPersonsCount`.
   - Records `cardIssuedAt` timestamp.
   - Adjusts department aggregates atomically.
5. On success, client shows confirmation toast, **clears search query and selection**, and returns immediately to the fresh search screen for the next child.
6. Reversal (`ISSUED` $\rightarrow$ `NOT_ISSUED`) and direct companion-count updates execute via corresponding atomic transactions.

#### Attendance Formulas:
$$\text{Children Present} = \sum \text{Active records where } cardStatus = \text{'ISSUED'}$$
$$\text{Accompanying Persons Present} = \sum \text{accompanyingPersonsCount on active issued records}$$
$$\text{Total Attendance} = \text{Children Present} + \text{Accompanying Persons Present}$$

### 4.4 Dashboard & Aggregation Strategy

- **Manual Refresh Only:** To optimize costs and prevent unnecessary read contention during peak load, the Admin Dashboard does **NOT** use real-time listeners.
- **Refresh Behavior:**
  - Loaded once on initial page render.
  - Refreshed only on explicit user click of the "Refresh" button.
  - Displays explicit "Last Updated: [Time]" badge.
- **Aggregates Storage:** Department aggregates are maintained in Firestore (`statistics/BAL`, `statistics/BLK`) updated transactionally on issuance, reversal, deletion, and registration.

---

## 5. Security & Isolation Architecture

1. **Server-Side Enforcement:** Frontend route protection is purely for UX; all authorization rules are enforced via Firebase Security Rules and Cloud Functions middleware.
2. **Department Isolation:** Volunteers and Coordinators assigned to BAL can never access BLK data via direct API invocation or document path traversal.
3. **Soft Deletion Protocol:** Records marked `isDeleted: true` remain permanently in Firestore, retain their original registration code, are omitted from ordinary volunteer searches and active attendance metrics, and can be viewed/restored only by authorized roles.
4. **Data Protection:** No registration lists, PII, or internal registration codes are exposed through unauthenticated public APIs.

---

## 6. Deployment Environments

- **Development:** Local Firebase Emulator Suite (Auth, Firestore, Functions, Storage) + Vite local dev server.
- **Staging:** Isolated Firebase Project for end-to-end rehearsal and concurrency testing.
- **Production:** High-availability Firebase Project with Google Cloud Monitoring, daily backups, and SSL termination.
