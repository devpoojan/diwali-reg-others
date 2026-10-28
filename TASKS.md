# TASKS.md — BAPS Anandotsav 2026 Project Master Tasks

**Document Status:** Active Tracking  
**Last Updated:** October 17, 2026  

---

## Phase 1: Environment, Tooling & Core Architecture
- [x] Initialize Git repository
- [x] Configure Node.js environment (v24.22 LTS)
- [x] Create core specifications:
  - [x] `docs/ARCHITECTURE.md`
  - [x] `docs/DATABASE_SCHEMA.md`
  - [x] `docs/RBAC.md`
  - [x] `docs/DECISIONS.md`
  - [x] `docs/CHANGELOG.md`
- [x] Initialize React + TypeScript + Vite project in workspace root
- [x] Configure Tailwind CSS & Claymorphism design utilities for public portal
- [x] Configure shadcn/ui component foundation & Motion
- [x] Verify clean TypeScript compilation and production build (`tsc -b && vite build`)
- [x] Setup Firebase Client SDK and Firebase configuration
- [x] Setup Vitest / Testing framework

## Phase 2: Authentication & RBAC Engine
- [x] Setup Firebase Auth configuration & context provider
- [x] Create shared volunteer login flow (BAL and BLK accounts with concurrent session support)
- [x] Create individual staff login flow (Super Admin, Admin, Coordinator)
- [x] Implement server-side custom claims management
- [x] Implement client-side role and category guards (`RequireAuth`, `RequireRole`, `RequireCategory`)
- [x] Implement account status checking (`ACTIVE` vs `DISABLED`)

## Phase 3: Public Website & Registration Engine
- [x] Build Public Claymorphic layout (Header, Hero, Event Info, Guidelines, Footer)
- [x] Build dynamic Event Info loader from `eventSettings`
- [x] Build Category Selection screen (`BAL` vs `BLK`) with persistent state
- [x] Build Registration Form with confirmed fields:
  - First Name
  - Father's Name
  - Surname
  - Mobile Number
- [x] Streamline to direct 3-step registration flow (Step 4 review removed; direct submit button on Step 3 per user directive)
- [x] Implement registration submission:
  - Transactional atomic allocation of internal registration code (`BAL-0001`, `BLK-0001`)
  - Request idempotency support
  - **Zero** duplicate registration checks
  - Exclude registration code from public response
- [x] Build Registration Success screen (displays balak's registration ID, 1-tap copy, screenshot advice, and instructions to collect games card)
- [x] Build "Registration Closed" state maintaining visible event info

## Phase 4: Volunteer Operations Panel (Event-Day Mobile UI)
- [x] Build mobile-first, high-performance Volunteer shell (NO Claymorphism)
- [x] Implement Search-as-You-Type with debouncing (Child Name, Mobile Number, Registration Code)
- [x] Implement server-side category-scoped search queries
- [x] Implement real-time live Station Roster (`stationRoster`) in-memory search (sub-millisecond 0ms local match)
- [x] Enable Firestore IndexedDB persistent local cache (`persistentLocalCache`)
- [x] Implement partition-aware routing for registration codes (Chandlodiya 1001+ / Vadaj 0001+)
- [x] Display search results with multi-match capability (never auto-merging duplicates)
- [x] Build Child Detail verification view
- [x] Build Card Issuance Modal with mandatory Accompanying Persons Count ($\ge 0$, child excluded)
- [x] Implement atomic Card Issuance transaction:
  - Validate state `NOT_ISSUED`
  - Save status `ISSUED` and companion count atomically
  - Atomic increment to attendance aggregates
  - Auto-clear search query and return to clean search screen
- [x] Implement Card Reversal (`ISSUED` $\rightarrow$ `NOT_ISSUED`) removing attendance contribution
- [x] Implement Accompanying Persons Count edit without unissuing card
- [x] Implement On-the-Spot Quick Registration flow:
  - Category-scoped form with confirmed fields
  - Review & Confirm step
  - Shared sequential code allocation
  - Mark `source: "ON_THE_SPOT"`
  - Direct transition to card issuance upon submission

## Phase 5: Coordinator & Admin Dashboards
- [x] Build Coordinator Dashboard scoped to assigned category (`BAL_ONLY`, `BLK_ONLY`, or `BOTH`)
- [x] Implement Coordinator registration search, card actions, soft-delete, and restore
- [x] Build Admin Dashboard (NO Claymorphism, professional, data-dense)
- [x] Implement Manual Dashboard Refresh (initial load + explicit "Refresh" button click)
- [x] Display "Last Updated: [Time]" badge
- [x] Display core metrics:
  - BAL / BLK / Total registrations
  - Online vs On-the-Spot registrations
  - Cards Issued (Children Present) vs Cards Pending
  - Accompanying Persons Present
  - Total Attendance ($\text{Children} + \text{Accompanying}$)
- [x] Build Registration Management table with sorting (Latest, Oldest, Name A–Z)
- [x] Implement filtering: Category (BAL/BLK), Source (Online/On-the-spot), Status (Issued/Pending), Deleted
- [x] Implement Soft Delete & Restore with confirmation dialogs
- [x] Enforce immutability of submitted registration details (no edit UI)
- [x] Implement Excel Export (`.xlsx`)

## Phase 6: Event Management, Settings & Operations Command Center
- [x] Build Unified Admin Command Center layout with persistent tabs (`AdminLayout.tsx`):
  - Overview, Registrations Directory, Card Printing (`/admin/printing`), Registration Toggles, Staff Accounts
  - Header ground station switcher button
- [x] Card Printing Management (`CardPrintingPage.tsx` at `/admin/printing`):
  - Cutoff number input per department and center (Chandlodiya BAL/BLK, Vadaj BAL/BLK)
  - Distinguish pre-printed cards vs non-printed manual cards for ground volunteers
- [x] Event Details (`/admin/event`): Deleted per user request
- [x] Build Registration Availability Settings view (`RegistrationSettingsPage.tsx`):
  - Public registration manual toggle
  - Public registration automatic closing datetime picker
  - On-the-spot registration independent manual toggle
- [x] Build Account Management view (`StaffAccountsPage.tsx`):
  - Manage Coordinator accounts and assigned department scope (`BAL_ONLY`, `BLK_ONLY`, `BOTH`)
  - Manage credentials and status for BAL and BLK shared volunteer accounts
- [x] Build Excel Export (`.xlsx`):
  - Available directly on both Operations Dashboard and Registrations Directory
  - Formatted human-readable columns and department categorization
- [x] Ground Operations & Volunteer Station Enhancements (`VolunteerSearchPage.tsx`):
  - Station ground counters
  - 1-tap Recent Issuances list with instant companion adjustment and reversal
  - Prominent walk-in on-the-spot registration quick card
  - Real-time live ground broadcast alert listener

## Phase 6.1: High-Utility Event-Day Operations Tooling (User Priority)
- [x] Helpdesk Family & Multi-Sibling Lookup Desk (`/admin/helpdesk`):
  - Single mobile search pulls all children/siblings across BAL and BLK simultaneously
  - Direct WhatsApp (`wa.me`) and phone call (`tel:`) buttons for parent communication
  - 1-click "Issue All Cards for Family" batch transaction
  - Individual companion steppers per child
- [x] Registrations Directory Bulk Selection & Anomaly Audit Tools (`/admin/registrations`):
  - Checkbox multi-select and Select All
  - Floating Bulk Action toolbar: `Export Selected (X)` & `Bulk Soft-Delete (X)`
  - Typo / Anomaly quick audit filter pills:
    - High Companions ($\ge 5$) to catch volunteer typos
    - Walk-ins Only (`ON_THE_SPOT`)
    - Uncollected Cards (`NOT_ISSUED`)
    - Active Issued Cards (`ISSUED`)
  - Child Quick Inspection Drawer (`Eye` icon) with live card issuance, reversal, and parent contact
- [x] Kitchen & Catering (Prasad) Live Capacity Projections (`AdminDashboardPage.tsx`):
  - Live on-ground attendees calculation ($\text{Children} + \text{Companions}$)
  - Prasad Packets Needed calculator ($+10\%$ safety buffer)
  - Family companion ratio indicator
  - Standby buffer packet recommendations
- [x] Live Event Ground Broadcast Station (`AdminDashboardPage.tsx`):
  - Admin announcement console with quick preset chips
  - Instant on/off toggle and message push
  - Real-time display on Public Homepage (`HomePage.tsx`)
  - Real-time display on Volunteer Stations (`VolunteerSearchPage.tsx`)

## Phase 7: Verification, Hardening & Deployment
- [x] Vitest Smoke and Domain service test suite passing (18/18 tests pass)
- [x] Clean TypeScript strict compilation and production bundle build
- [x] Concurrency & security rules audit:
  - [x] Cloud Firestore Security Rules authored and deployed (`diwali-test-3ab6c`)
  - [x] BAL vs BLK department isolation enforced server-side
  - [x] Registration personal details post-submission immutability enforced
  - [x] Soft-delete restricted to Coordinators and Admins; hard delete blocked globally
- [x] Mobile usability & performance testing for volunteer interface
- [x] Deploy scripts & Firebase configuration (Rules, Indexes, Hosting, Auth):
  - [x] Dedicated Firestore Database `anandotsav` created and live in `asia-south1` (Mumbai, India)
  - [x] Firestore security rules and composite indexes deployed to `anandotsav`
  - [x] Full data synchronization of all collections to Mumbai (`asia-south1`)
  - [x] Client environment configured to target `anandotsav` database
  - [x] Live web application deployed to Firebase Hosting (`https://anandotsav.web.app` primary, `https://diwali-test-3ab6c.web.app` secondary)
  - [x] Verified NO PWA (no manifest, no service workers, no app install banners) per user instruction
- [x] Complete Light Mode Theme Conversion:
  - [x] Volunteer Portal (`VolunteerSearchPage.tsx`, `QuickRegisterPage.tsx`) converted to high-contrast Light Mode
  - [x] Admin Command Center & Dashboards (`AdminDashboardPage.tsx`, `RegistrationsManagePage.tsx`, `CardPrintingPage.tsx`, `RegistrationSettingsPage.tsx`, `StaffAccountsPage.tsx`, `HelpdeskLookupPage.tsx`) converted to clean Light Mode
  - [x] Shared Navigation & Shells (`StaffNavbar.tsx`, `AdminLayout.tsx`, `LoginPage.tsx`, `ProtectedRoute.tsx`) converted to Light Mode
  - [x] Public festive Claymorphic portal preserved
  - [x] All 21 Vitest tests passing; clean zero-error production build verified
- [x] Laptop & Desktop Counter Operations Optimization:
  - [x] Area Selection Gate upgraded to responsive 2-column cards (`md:max-w-3xl lg:max-w-4xl`)
  - [x] Search & Card Issuance upgraded to `max-w-7xl` command header with keyboard search shortcut (`/` or `Ctrl/Cmd+K`)
  - [x] Dual-pane widescreen desktop layout: 2-column search results grid (`lg:col-span-8`) + persistent Station Guide & Live Recent Issuances feed (`lg:col-span-4`)
  - [x] Card Issuance & Companion Count modals centered on desktop (`sm:rounded-3xl sm:max-w-xl`) with physical keyboard digit selection (`[0]-[9]`)
  - [x] Quick Register page expanded (`md:max-w-3xl`) with 3-column name fields and 10-column companion count buttons
- [x] Multi-Sheet Excel Export Engine (`excelExportService.ts`):
  - [x] Exports 5 sheets in 1 Excel workbook: `All Combined`, `Chandlodiya Bal`, `Chandlodiya Balika`, `Vadaj Bal`, `Vadaj Balika`
  - [x] Top Sheet Details (Rows 1–3): Title, Venue, Festival Schedule, Department, Target Code Range, and Export Generation Timestamp
  - [x] Top Sheet Numeric Summary (Rows 5–7): Total Registrations, Online, Walk-ins, Cards Issued (Present), Cards Pending, Accompanying Persons, Total Attendees (Ground), Box Cards (Printed), Blank Cards (Manual)
  - [x] Every sheet includes the full heading row with all 22 data columns (Row 10)
  - [x] Natural registration code sorting within each sheet (`C-1, C-2, C-10...`)
  - [x] Auto-sized column widths (`!cols`) for clean readability
  - [x] Tested with 9 comprehensive unit tests (45/45 vitest tests passing)
- [x] Area-Wise Registration Report Page (`/admin/area-report`):
  - [x] Built dedicated `areaReportService.ts` with locality normalization, bilingual dictionary, and metric calculations
  - [x] Center switch toggles: Vadaj, Chandlodiya, and All Centers (Combined)
  - [x] Real-time Area Distribution KPI Grid with major locality prioritizations (`Chandlodiya`, `Nirnaynagar`, `Ognaj`, `Tragad`, `Vadaj`, `Others`, `Unspecified`)
  - [x] Interactive area selection: clicking an area card highlights locality share and filters the child directory
  - [x] Search & filtering toolbar across child name, code, mobile, address, department, card status, and registration source
  - [x] Child Profile inspection modal with contact actions (Call & WhatsApp) and card printing indicators (Box vs Blank)
  - [x] Direct Excel export (`.xlsx`) and print-ready roster layout
  - [x] Integrated into Admin Layout navigation and Dashboard quick links
  - [x] Verified with 12 unit tests (57/57 tests passing) and zero-error production build
- [x] Zero-Modal Direct Inline Card Issuance in Volunteer Search (`VolunteerSearchPage.tsx`):
  - [x] Inline companion selector chips (`0 (માત્ર બાળક)`, `+1`, `+2`, `+3`, `+4`, stepper `[-] / [+]`) right on search result card
  - [x] Operational Box Card vs Blank Card guidance rendered directly on the search result card
  - [x] 1-tap direct Issue button (`⚡ કાર્ડ આપો • ISSUE (+X)`) without opening any popup modal or tab
  - [x] Desktop keyboard shortcuts: `Enter` directly issues first matching child with selected companions; `0`–`9` keys select companion count
  - [x] Multi-child / sibling search preservation: issuing one sibling leaves others on-screen for rapid consecutive issuance
  - [x] Turnkey Setup Wizard & Dynamic Multi-Area Architecture (`SetupWizardPage.tsx`, `SETUP_GUIDE.md`):
  - [x] Automatic first-time setup detection (`SetupGuard.tsx`) routing fresh installs directly to `/setup`
  - [x] Step 1: Firebase Project Setup with pasted code auto-parser and live connection tester
  - [x] Step 2: Event Identity & Logo file upload with live preview and Firebase Storage/base64 fallback
  - [x] Step 3: Dynamic Centers configuration (add/edit/delete venues, dates, Gujarati names, and prefixes)
  - [x] Step 4: Card numbering and pre-printed box card cutoff ranges for Bal and Balika per center
  - [x] Step 5: Locality directory management for parent registration and volunteer filtering
  - [x] Step 6: Registration availability controls and copyable deployment commands
  - [x] Admin navigation integration in `AdminLayout.tsx`
  - [x] Complete standalone turnkey documentation in `SETUP_GUIDE.md`
- [x] Universal Excel Export Modal & Multi-Area Filters (`ExcelExportModal.tsx`, `excelExportService.ts`):
  - [x] Universal popup modal triggered when clicking "Download Excel" from Admin Dashboard, Registrations Management, or Area Report
  - [x] Multi-Area selection with real-time child counts per area (e.g., Nirnaynagar + Ognaj or All Areas)
  - [x] "1 Tab Per Area" export toggle to generate dedicated Excel sheets for each selected locality
  - [x] "Separate Tabs for Bal & Balika" toggle to split into department sheets
  - [x] Cleaned modal controls: Removed unnecessary `Card Status`, `Channel`, and `Card Type` filters
  - [x] Live selection preview showing matching children, Bal/Balika breakdown, and projected sheet count
  - [x] Fixed volunteer search digit interception where typing `22` in search routed the second `2` to companion count


