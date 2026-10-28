# Changelog

All notable changes to the BAPS Anandotsav 2026 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - 2026-10-28

### Added
- **Turnkey Setup Wizard & Multi-Area Dynamic Configurator (`SetupWizardPage.tsx`, `SetupGuard.tsx`, `SETUP_GUIDE.md`)**:
  - **Automatic First-Run Detection**: Fresh installations automatically route to the interactive Setup Wizard (`/setup`) so any mandal cloning the repo can configure their festival immediately without editing code.
  - **Step 1: Firebase Project Setup**: In-app 3-step guide for creating a free Firebase project, auto-parser for pasted `firebaseConfig` snippets, and a live "Test Connection" button.
  - **Step 2: Event Identity & Logo Upload**: Logo file uploader (PNG, JPG, SVG, WebP) with real-time navigation bar preview, storage in Firebase Storage with automatic high-res Base64 fallback, event titles, and helpline phone/WhatsApp inputs.
  - **Step 3: Dynamic Centers & Venues**: Add, edit, or remove celebration venues (e.g. Chandlodiya, Vadaj, Bopal, Ranip) with custom Gujarati names, event dates, timings, addresses, and code prefixes (`C-`, `V-`, `B-`, `R-`).
  - **Step 4: Card Numbering & Box Cutoffs**: Define starting numbers and pre-printed box card cutoff thresholds for Bal (Boys) and Balika (Girls) per center.
  - **Step 5: Locality Directory**: Manage the list of suggested localities and societies for rapid parent registration and volunteer filtering.
  - **Step 6: Registration Controls & Deployment Guide**: Quick toggles for online and walk-in registrations, along with step-by-step terminal commands to deploy for free to Firebase Hosting.
  - **Admin Navigation**: Wired into `AdminLayout.tsx` top bar and navigation tab as "Setup Wizard (સેટઅપ)".
  - **Comprehensive Guide (`SETUP_GUIDE.md`)**: Full English and Gujarati documentation for GitHub repository sharing and zero-friction deployment.

## [Unreleased] - 2026-10-27

### Added
- **Universal Excel Export Modal with Multi-Area & Department Sheet Splits (`ExcelExportModal.tsx`, `excelExportService.ts`)**:
  - **Dynamic Multi-Area Selection**: Allows selecting any combination of areas/localities (e.g., Nirnaynagar + Ognaj) or `All Areas Combined`.
  - **1 Tab Per Area**: When multiple areas are selected, provides an option to export each locality into its own dedicated Excel worksheet tab.
  - **Separate Bal & Balika Tabs**: Option to split registrations into dedicated tabs for Bal (Boys) and Balika (Girls).
  - **Clean & Streamlined Interface**: Removed unnecessary `Card Status`, `Channel`, and `Card Type` controls per user instruction, presenting a clean 3-step configuration: (1) Center/Vistar, (2) Department/Vibhag, and (3) Area/Locality.
  - **Mobile-First UX Redesign**: Upgraded to a native bottom-sheet drawer with top drag handle, touch-friendly stacked buttons with Gujarati subtitles, quick micro-search for filtering localities, and thumb-first stacked action footer (`Download Excel` on top, `Master Book` + `Cancel` below).
  - **Universal Admin Integration**: Clicking "Download Excel" from Admin Dashboard, Registrations Management, or Area Report opens the universal modal pre-configured for that view.

### Fixed
- **Volunteer Search Digit Interception (`VolunteerSearchPage.tsx`)**:
  - Removed global digit key listener that was intercepting numbers (e.g., typing `22` in search typed `2` and routed the second `2` to companion count).
  - Replaced with direct input event handling and unified dual-input focus refs (`mobileSearchInputRef` and `searchInputRef`).
- **Zero-Modal Direct Inline Card Issuance in Volunteer Search (`VolunteerSearchPage.tsx`)**:
  - **Inline Companion Quick Selector**: Embedded accompanying person chips (`0 (માત્ર બાળક)`, `+1`, `+2`, `+3`, `+4`) and custom stepper `[-] / [+]` directly on every child search result card.
  - **Direct 1-Tap Issue Action**: Replaced the separate modal/tab popup workflow with an instant `⚡ કાર્ડ આપો • ISSUE (+X)` button directly on each card.
  - **Box vs Blank Card Instructions**: Visual badge and Gujarati instructions (`🖨️ બોક્સ કાર્ડ: C-X શોધીને આપો` vs `✍️ કોરું કાર્ડ: કોરા કાર્ડમાં C-X અને નામ લખો`) displayed right on the card for lightning-fast volunteer action.
  - **Single & Multi-Child Smart Flow**: Single child matches automatically clear upon issuance for the next search; multiple matches/siblings remain on-screen so volunteers can issue all siblings consecutively without re-searching.
  - **Laptop Hotkeys**: Pressing `Enter` immediately issues the first unissued child with their selected companion count; digits `0`–`9` set the companion count directly.

- **Area-Wise Registration Report Page (`/admin/area-report`, `AreaReportPage.tsx`, `areaReportService.ts`, `areaReportService.test.ts`)**:
  - **Center Filter Switchers**: Interactive selectors for Vadaj, Chandlodiya, and All Centers with real-time registration counts.
  - **Area Distribution KPI Grid**: Real-time breakdown of all localities (`Chandlodiya`, `Nirnaynagar`, `Ognaj`, `Tragad`, `Vadaj`, custom localities, `Unspecified`), showing total counts, percentage share progress bar, Bal/Balika split, and card issuance status.
  - **Interactive Locality Filtering**: Clicking any area card highlights the locality and displays the complete list of registered children from that specific area.
  - **Search & Filters**: Comprehensive real-time filtering across child name, code, phone, address, department, card status, and registration source.
  - **Child Inspection Modal**: Full registration profile with 1-tap WhatsApp and Call actions, pre-printed box card vs blank card guidance.
  - **Navigation Integration**: Added to `AdminLayout.tsx` navigation bar with `MapPin` icon and quick link on `AdminDashboardPage.tsx`.

- **Area-Wise Report in Excel & Single Combined Name Export (`excelExportService.ts`, `excelExportService.test.ts`)**:
  - **Dedicated "Area Wise Report" Sheet**: Added as primary sheet in Excel workbook, containing comprehensive locality breakdowns and totals for Chandlodiya, Vadaj, and Combined centers.
  - **Single Combined Name**: Eliminated duplicated name display across both Web UI table and Excel columns (removed redundant `First Name`, `Father Name`, and `Surname` columns, showing strictly `Child Full Name`).
  - **Full Test Suite**: 59/59 Vitest tests passing with 0 errors.

- **5-Sheet Excel Export Engine with Top Sheet Metadata & KPI Block (`src/services/excelExportService.ts`, `AdminDashboardPage.tsx`, `RegistrationsManagePage.tsx`, `excelExportService.test.ts`)**:
  - **5 Dedicated Sheets in 1 Workbook**: Generates `All Combined`, `Chandlodiya Bal`, `Chandlodiya Balika`, `Vadaj Bal`, and `Vadaj Balika` in a single `.xlsx` download.
  - **Top Sheet Details Banner (Rows 1–3)**: Displays Sheet Title, Center/Venue, Festival Schedule, Department, Target Code Range, and Export Timestamp.
  - **Live Numeric KPI Summary Block (Rows 5–7)**: Pre-calculated real-time statistics including Total Registrations, Online, Walk-ins, Cards Issued (Present), Cards Pending, Accompanying Persons, Total Attendees (Ground), Box Cards (Printed), Blank Cards (Manual).
  - **Table Directory & Natural Sorting (Row 10+)**: 22 comprehensive columns sorted in natural alphanumeric order (`C-1`, `C-2`, ..., `C-10`, `C-1001`), with auto-computed column widths.
  - **Wired into Admin Portal**: Added export triggers with visual status badges to both `AdminDashboardPage` and `RegistrationsManagePage`.
  - **Comprehensive Unit Testing**: Added 9 test cases in `excelExportService.test.ts` (45/45 suite tests passing).

- **Volunteer Portal Laptop Clarity & Keyboard Workflow (`VolunteerSearchPage.tsx`, `QuickRegisterPage.tsx`)**:
  - **Dual-Pane Laptop Workspace**: Expanded to `max-w-7xl` widescreen layout featuring a 2-column search results grid alongside a sticky station sidebar showing live counter statistics and recent card issuances.
  - **Keyboard Hotkeys**: Added quick shortcuts (`/` or `Ctrl+K` to search, `0-9` for companion count, `Enter` to confirm, `Esc` to close).
  - **Centered Laptop Modals**: Converted bottom sheets on desktop viewports into centered dialogs with backdrop blur.
  - **Expanded Quick Register**: Converted Quick Registration modal to `md:max-w-4xl` with 3-column name layout and ergonomic wide inputs.


- **Exclusive V- and C- Registration Code Format & Zero-Prefix Volunteer Search (`registrationService.ts`, `cardPrintingService.ts`, `CardPrintingPage.tsx`, `VolunteerSearchPage.tsx`, `AdminDashboardPage.tsx`, `RegistrationsManagePage.tsx`)**:
  - **New Code Format**: Completely removed all `BAL-` and `BLK-` registration codes. Adopted pure center-prefixed non-padded format:
    - **Vadaj**: Bal (`V-1` to `V-1000`), Balika (`V-1001` onwards).
    - **Chandlodiya**: Bal (`C-1` to `C-1000`), Balika (`C-1001` onwards).
  - **Zero-Prefix Volunteer Search**: When a volunteer searches in their assigned station (Vadaj or Chandlodiya), typing pure digits (e.g. `42` or `1025`) immediately synthesizes and matches `V-42` or `C-42` at 0ms latency without requiring the volunteer to type `V-` or `C-`. Explicit prefix search (`V-42`, `C-42`) continues to work seamlessly.
  - **Card Printing & Cutoff Synchronization**: Updated cutoff counters, card badges, descriptions, and real-time simulator to support `V-` and `C-` series.
  - **Full Test Suite & Dual Deployment**: Added unit tests covering new sequences, helper functions, and code queries (36/36 tests passing); successfully built and deployed to `https://anandotsav.web.app` and `https://diwali-test-3ab6c.web.app`.

- **Success Screen Top Scroll Restoration & Center Preservation for Another Child (`SuccessPage.tsx`, `RegisterPage.tsx`, `ScrollToTop.tsx`, `App.tsx`)**:
  - **Instant Top Scroll on Completion**: Added global `<ScrollToTop />` route listener in `App.tsx` and explicit `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` on both `RegisterPage` submission and `SuccessPage` mount, ensuring the success confirmation ticket opens directly at the very top.
  - **Center-Preserving "બીજા બાળકનું રજીસ્ટ્રેશન કરો" Link**: Updated the "Register Another Child" action button on `SuccessPage` to preserve the registered child's exact center (`/register?vistar=${vistar}`).
  - **Locked Vistar Form Flow (No Center Selection)**: When a visitor registers another child or enters with a center parameter, the Area Selection step (Vadaj vs Chandlodiya) is completely skipped. The stepper automatically adapts to a 2-step flow (`૧/૨: વિભાગ પસંદગી` -> `૨/૨: વિગતો & રજીસ્ટ્રેશન`), locking the center throughout.
  - **Step-Change Top Scroll**: Added instant scroll to top on every registration step transition (`VIBHAG` <-> `FORM`).
  - **Deployed Live**: Rebuilt and deployed to `https://anandotsav.web.app` and `https://diwali-test-3ab6c.web.app`.

- **Mobile Responsiveness, Dead Space Elimination & Poster Removal (`HomePage.tsx`)**:
  - **Dead Space Elimination**: Reduced excess vertical margins and paddings (`pb-1`, `my-1.5`, `pt-1`) between the registration CTA button and Event Details, eliminating the huge empty white gap on mobile screens.
  - **Direct Scroll Guide**: Added a clean animated scroll button (`👇 ઉત્સવ વિગત, સમય અને સ્થળ નીચે જુઓ`) below the registration button that smoothly glides visitors into the event details section.
  - **Mobile Proportional Scaling**: Compacted hero wonderland arch padding, bulb spacing, and logo width (`max-w-[200px] xs:max-w-[260px] sm:max-w-[440px]`) so the Event Details card naturally peeks into view above the fold on all mobile devices.
  - **Poster Removal**: Completely removed `public/anandotsav-poster.jpg` and updated metadata in `index.html` to point to `/anandotsav-logo.png`.
  - **Deployed Live**: Rebuilt and deployed to `https://anandotsav.web.app` and `https://diwali-test-3ab6c.web.app`.

- **Streamlined 3-Step Registration Flow & Direct Submission (`RegisterPage.tsx`)**:
  - Removed Step 4 (`REVIEW` screen) per explicit user requirement, streamlining the public registration flow into 3 direct steps:
    1. **Step 1 (વિસ્તાર / Area Selection)**: Choose Vadaj or Chandlodiya center.
    2. **Step 2 (વિભાગ / Department Selection)**: Choose Bal or Balika Vibhag.
    3. **Step 3 (વિગતો & રજીસ્ટ્રેશન / Details & Direct Registration)**: Enter child details with real-time English validation and submit directly.
  - Placed direct registration submit button on Step 3 with active loading spinner (`Loader2`) and immutability notice.
  - Converted progress stepper from 4 segments to 3 segments (`૧ / ૩`, `૨ / ૩`, `૩ / ૩`).
  - Adapted first name label, validation alerts, and placeholders for Balika Vibhag (`બાલિકાનું નામ (First Name)`, `દા.ત. Aanya`).
  - Deployed live to `https://anandotsav.web.app`.

- **Production Multi-Site Hosting & Primary Domain Deployment (`https://anandotsav.web.app`)**:
  - Configured Firebase Hosting multi-site array in `firebase.json` targeting both `anandotsav` (`https://anandotsav.web.app`) and `diwali-test-3ab6c` (`https://diwali-test-3ab6c.web.app`).
  - Updated application fallback origins in `HomePage.tsx`, `RegisterPage.tsx`, and `SuccessPage.tsx` to use `https://anandotsav.web.app`.
  - Added `"deploy"` script to `package.json` (`npm run build && firebase deploy --only hosting`).
  - Built production bundle with TypeScript verification and successfully deployed live to `https://anandotsav.web.app`.

- **Administrative Danger Zone & 7-Checkpoint Nuclear Deletion Protocol (`RegistrationSettingsPage.tsx`, `registrationService.ts`, `firestore.rules`)**:
  - **Fortress-Grade Multi-Factor Safeguard**: Implemented an ultra-hard 7-checkpoint interactive verification protocol to prevent accidental data loss:
    1. **Checkpoint 1 — Irreversible Impact Warning with 10-Second Safety Lock**: Red alert breakdown of complete wipe with mandatory 10-second countdown cooldown before unlock.
    2. **Checkpoint 2 — Human Cognitive Verification**: Randomized 3-term mental arithmetic challenge `(A × B) + C = ?` (e.g. `(7 × 8) + 15 = 71`) preventing bot or accidental bypass.
    3. **Checkpoint 3 — Manual Confirmation Oath (Paste Blocked)**: Requires typing the exact 51-character uppercase phrase `PERMANENTLY DELETE ALL ANANDOTSAV 2026 REGISTRATIONS` letter-by-letter (direct pasting prohibited).
    4. **Checkpoint 4 — Quintuple Explicit Acknowledgement**: Requires checking 5 distinct legal/operational checkboxes covering Vadaj, Chandlodiya, game cards & attendance, baseline counters, and personal administrator accountability.
    5. **Checkpoint 5 — Master Administrative Password (`qwertyuiop`)**: Requires entering the authorized master password with a strict 3-attempt lockout limit (resets to Checkpoint 1 on repeated failure).
    6. **Checkpoint 6 — Continuous 4-Second Physical Hold Switch**: Interactive charging button requiring continuous mouse/finger hold for 4000ms. Releasing early resets charge to 0%.
    7. **Checkpoint 7 — Final Armed Nuclear Trigger**: 5-second arming delay circuit with pulsating hazard states and a final browser confirmation prompt before initiating the deletion.
  - **Comprehensive Atomic Database Purge (`deleteAllRegistrations`)**:
    - Chunked batch deletion (`writeBatch` in chunks of 400 docs) across `chandlodiya`, `vadaj`, and legacy `registrations` collections, preserving system documents (`_center_config`, `counter_BAL`, `counter_BLK`).
    - Atomically resets sequential partition counters: Chandlodiya (`counter_BAL`: 1000, `counter_BLK`: 1000) so new registrations start at `1001`; Vadaj (`counter_BAL`: 0, `counter_BLK`: 0) so new registrations start at `0001`.
    - Resets all 6 real-time attendance `statistics` documents back to 0.
    - Resets card printing cutoff settings in `eventSettings/cardPrinting` back to 0.
  - **Role-Based Access Control**:
    - Restricted exclusively to `Super Admin` and `Admin` users in the UI and frontend service handlers.
    - Updated `firestore.rules` allowing `isAdminOrSuperAdmin()` hard-deletion rights for administrative database maintenance across `chandlodiya`, `vadaj`, and `registrations`.

### Added - 2026-10-21
- **House Number, Society Name, and Center-Specific Area Selection (`RegisterPage.tsx`, `registrationService.ts`, `types`)**:
  - **Field Ordering (House Number & Society First, Then Area)**: Structured the registration form to ask for House Number and Society Name first, followed by Center-Specific Area selection, matching the user's explicit specification.
  - **English-Only Address Input (`A–Z, 0–9 Only`)**: Implemented strict English validation (`hasNonEnglishAddress`) for House Number, Society Name, and Custom Area text inputs, with real-time badges, character warnings, and validation error messages.
  - **House Number (`ઘર નંબર / ફ્લેટ નંબર`)**: Dedicated house / flat number input field in English (e.g. `A-102` or `Flat 45`).
  - **Society Name (`સોસાયટી / એપાર્ટમેન્ટનું નામ`)**: Dedicated society / apartment name input field in English (e.g. `Shantiniketan Society`).
  - **Center-Specific Area Selection (`વિસ્તાર પસંદગી`)**:
    - **Vadaj Form (`/vadaj`)**: Options: `વાડજ (Vadaj)`, `નિર્ણયનગર (Nirnayanagar)`, and `અન્ય (Other)`.
    - **Chandlodiya Form (`/chandlodiya`)**: Options: `ચાંદલોડિયા (Chandlodiya)`, `ઓગણજ (Ognaj)`, `ત્રાગડ (Tragad)`, and `અન્ય (Other)`.
    - **Custom Area Text Input in English**: When `અન્ય (Other)` is chosen, a clean, animated input field appears prompting: `તમારો વિસ્તાર અંગ્રેજીમાં લખો (Write Area in English)`.
  - **Review Ticket & Success Screen**: Displaying chosen area and house no. + society name in the review and confirmation screen.
  - **Volunteer & Admin Integration**: Displaying child locality, house number, and society name in Volunteer search results and card bottom sheet, and including them as columns in Excel exports.

- **Dedicated Center Landing Pages (`/chandlodiya` & `/vadaj`)**:
  - Implemented dedicated homepages for each center accessible via `/chandlodiya` and `/vadaj` (with short aliases `/c` and `/v`).
  - **Chandlodiya Special Page (`/chandlodiya`)**: Shows dedicated Chandlodiya archway badge, highlight ribbon with date (૩૧/૧૦/૨૦૨૬ શનિવાર), time (૫:૦૦ થી ૮:૦૦), venue (BAPS સંસ્કારધામ, ચાંદલોડિયા), Google Maps directions, and targeted registration CTA (`📝 ચાંદલોડિયા રજીસ્ટ્રેશન ફોર્મ ભરો ➜`).
  - **Vadaj Special Page (`/vadaj`)**: Shows dedicated Vadaj archway badge, highlight ribbon with date (૦૧/૧૧/૨૦૨૬ રવિવાર), time (૫:૦૦ થી ૮:૦૦), venue (BAPS સંસ્કારધામ, વાડજ), Google Maps directions, and targeted registration CTA (`📝 વાડજ રજીસ્ટ્રેશન ફોર્મ ભરો ➜`).
  - **Center-Specific WhatsApp Share**: Registrations completed for Chandlodiya now share `${origin}/chandlodiya`, while Vadaj registrations share `${origin}/vadaj`.
  - **Smart Back Navigation in Registration**: When entering registration through a center link, clicking Back returns smoothly to that center's landing page.

### Removed
- **Removed 'વિસ્તાર બદલો' Button (`RegisterPage.tsx`)**:
  - Removed the `વિસ્તાર બદલો` (Change Area) button from the selected area header in the registration form so parents stay focused on their selected center without confusion.
- **Removed Cross-Center Switcher Callouts on Dedicated Pages (`HomePage.tsx`)**:
  - Completely removed the cross-center switcher boxes (`જો આપ ચાંદલોડિયા વિસ્તાર માટે જોવા માંગો છો?` / `જો આપ વાડજ વિસ્તાર માટે જોવા માંગો છો?`) so each center's landing page is 100% focused purely on its own date, venue, maps, and registration.
- **Removed Child Name & Registration ID from WhatsApp Share Message (`SuccessPage.tsx`)**:
  - Removed child name and registration ID from the forwarded WhatsApp message. Since the share action is meant to forward an invitation to other families and friends to register their own children, the message now acts as a clean, general invitation linking to the homepage without leaking the registering child's personal info or ID.
- **Removed Public Staff Login Button (`PublicNavbar.tsx`)**:
  - Removed the 'સ્ટાફ' (Staff) portal login button from the public navigation header to keep public pages 100% attendee-focused. The staff portal remains fully functional and accessible directly via `/login` for authorized volunteers, coordinators, and administrators.
- **Removed 'બાળ અને બાલિકા ઉત્સવ' Subtitle from Header (`PublicNavbar.tsx`)**:
  - Streamlined the public navigation branding to cleanly display the Anandotsav logo with 'આનંદોત્સવ ૨૦૨૬' without the secondary subtitle.
- **Removed Redundant Schedule Card Buttons on Homepage (`HomePage.tsx`)**:
  - Removed the two bottom buttons (`ચાંદલોડિયા ફોર્મ ભરો ➜` and `વાડજ ફોર્મ ભરો ➜`) from inside the Chandlodiya and Vadaj event schedule cards per user request, leaving the cards clean, legible, and focused on timings and venue directions, while keeping the main hero CTA (`📝 રજીસ્ટ્રેશન ફોર્મ ભરો`) as the primary registration entry point.

### Changed
- **Unified Action Button Copy to 'રજીસ્ટર કરો' (`HomePage.tsx`, `PublicNavbar.tsx`)**:
  - Replaced center-specific form wording (e.g. `ચાંદલોડિયા ફોર્મ ➜`, `વાડજ ફોર્મ ➜`, `ચાંદલોડિયા રજીસ્ટ્રેશન ફોર્મ ભરો`, `વાડજ રજીસ્ટ્રેશન ફોર્મ ભરો`) with clean, direct action copy: `રજીસ્ટર કરો` / `રજીસ્ટર કરો ➜` across the main hero CTA, floating mobile bar, schedule cards, and top navigation bar.
- **Updated WhatsApp Share Message to Official Anandotsav Format (`SuccessPage.tsx`, `HomePage.tsx`, `RegisterPage.tsx`)**:
  - Adopted the exact new WhatsApp invitation format featuring highlights (મજેદાર ગેમ્સ, આનંદદાયક રાઇડ્સ, સ્વાદિષ્ટ પ્રસાદ, જોરદાર ઇનામો), free event reminder (`💥 આ સમગ્ર આનંદોત્સવ સંપૂર્ણ નિઃશુલ્ક છે! 💥`), venue details, Google Maps link, center-specific registration link, invitation callout (`👦👧 મિત્રો અને સગા-સંબંધીઓના બાળકોને પણ જરૂર આમંત્રણ આપજો! \n 🥳 જો જો... ચૂકી ન જતા! 🎈`), and department attribution (`🙏 BAPS બાળ પ્રવૃત્તિ, અમદાવાદ-૧૯` for Chandlodiya and `અમદાવાદ-૧૫` for Vadaj).
- **Minimal Homepage Area Selection Screen (`/`)**:
  - Transformed the root landing page (`/`) into a minimal, focused Area Selection screen featuring only the Anandotsav 2026 logo, "તમારો વિસ્તાર પસંદ કરો" header, and two prominent, full-width festive buttons for **૧. ચાંદલોડિયા (Chandlodiya)** and **૨. વાડજ (Vadaj)** to seamlessly direct visitors to each center's dedicated portal.
- **Balak Registration ID Display & Top WhatsApp Share on Success Page (`/success`)**:
  - **Prominent ID Display**: Following explicit user request, the child's internal registration code (e.g. `BAL-1001` or `BLK-1002`) is now proudly and prominently displayed to the child and parents on the celebration screen upon completing registration.
  - **Top WhatsApp Share Placement**: Placed the WhatsApp share card immediately at the top directly beneath the Registration ID card so parents can instantly share without having to scroll down.
  - **Clean Home Page Link in Share Message**: Replaced `/register` with the clean home page link (`${window.location.origin}/`) in the WhatsApp invite message per user request.
  - **1-Tap ID Copy & Screenshot Guidance**: Added 1-tap Copy ID button with instant feedback (`કોપી થઈ ગયું!`) and guidance encouraging parents to take a screenshot to easily show it at event counters.
  - **Persistent Session Recovery**: Stored recent registration details in `sessionStorage` so refreshing or reloading the `/success` page retains the child's ID without blanking out.
  - **Entry Counter Instruction Integration**: Updated Step 2 in the physical card collection guide to instruct parents to state either their Registration ID or mobile number at the venue counter.
- **Complete Light Mode Transformation for Admin & Volunteer Portals**:
  - **Volunteer Interface**: Converted `VolunteerSearchPage.tsx` and `QuickRegisterPage.tsx` from dark slate (`bg-slate-950`/`bg-slate-900`) to crisp, clean, high-contrast Light Mode (`bg-slate-100`, card backgrounds `bg-white border-slate-200`, text `text-slate-900`, and bottom sheets `bg-white`).
  - **Admin & Management Portal**: Converted all admin interfaces including `AdminDashboardPage.tsx`, `RegistrationsManagePage.tsx`, `CardPrintingPage.tsx`, `RegistrationSettingsPage.tsx`, `StaffAccountsPage.tsx`, and `HelpdeskLookupPage.tsx` to high-contrast Light Mode (`bg-slate-50`, `bg-white`, `border-slate-200`, and `text-slate-900`).
  - **Staff Layout & Shared Navigation**: Converted `StaffNavbar.tsx`, `AdminLayout.tsx`, `LoginPage.tsx`, and `ProtectedRoute.tsx` to pure light mode with crisp borders, distinct badges for departments, and high contrast for outdoor and bright daylight usage.
  - **Preserved Public Portal**: Maintained the rich, colorful, festive 3D Playground Wonderland / Claymorphism design for the public portal (`/`, `/register`, `/success`).
- **Ultra-Fast Walk-in Registration (All Fields Optional)**:
  - **Eliminated Multi-Step Barrier**: Replaced the 2-step Form -> Review flow with a single-screen fast registration card that allows 1-tap registration & card issuance directly in seconds.
  - **All Fields Optional**: First name, father's name, surname, and mobile number are now completely optional in walk-in registration (`ON_THE_SPOT`). If fields are left blank, it defaults gracefully to `"Walk-in Child"` without throwing blocking validation errors.
  - **Seamless Flash Feedback**: Added session flash messaging so volunteers returning from walk-in immediately see confirmation feedback and the newly issued card in their recent issuances list.
- **Volunteer Search Screen Streamlining**:
  - **Removed 1-Tap Button**: Removed the `⚡ 1-Tap` toggle button from the sticky top header per user request, leaving a clean station switcher on the left and a prominent `+ Walk-in` button on the right.
  - **Prioritized Non-Issued Cards First in Search**: Configured both local in-memory station roster matches and server search results to always display non-issued cards (`NOT_ISSUED`) at the top, and already issued cards (`ISSUED`) below.
  - **Eliminated 450px Bulky Inline Cards**: Replaced repetitive 10-button keypad number grids (`[0]` to `[9]`), giant steppers, and multi-line instruction banners inside every search result with compact, high-density cards (~75px).
  - **Introduced Dedicated Mobile Bottom-Sheet Modal**: Tapping `"કાર્ડ આપો ➔"` (Issue Card) now opens an ergonomic bottom sheet containing child details, clear Box Card (`🖨️`) vs Blank Card (`✍️`) guidance, companion count selection (0-9 touch grid + custom stepper), and a single high-contrast confirmation button.
  - **Streamlined Top Controls & Filter Pills**: Filter pills (`બધા`, `🖨️ પ્રિન્ટેડ`, `✍️ બ્લેન્ક`) now only appear when both printed and non-printed cards exist, saving 40px of vertical space on most queries.
  - **Compact Recently Issued Stream**: Converted recent issuance history into slim single-line rows with instant 1-tap companion editing and reversal.

### Added
- **Registrations Directory (`/admin/registrations`) Interactive Pagination & Page Size Selector**:
  - Implemented 50-records-per-page default pagination to eliminate DOM lag and long scrolling.
  - Added configurable page size selector with options: `25`, `50 (Default)`, `100`, `200`, and `Show All`.
  - Added interactive pagination navigation bar with First (`<<`), Previous (`<`), numeric page buttons with smart ellipsis windowing (`1, 2, ..., 17`), Next (`>`), and Last (`>>`).
  - Added current range indicator: `Showing X–Y of Z registrations (Page A of B)`.
  - Enhanced table row selection with page-level selection (`handleToggleSelectPage`) and "Select all matching registrations across all pages" banner.
  - Increased default database read limit to 1,000 records (with options `300`, `500`, `1000`, `2000`) ensuring all records load smoothly without truncation.

### Fixed
- **Resolved 403 Forbidden on Cross-Center Document Lookups (`BatchGetDocuments`)**:
  - **Root Cause**: When performing atomic card issuance/reversals on partitioned collections, checking whether a record exists across both centers caused Firestore to evaluate `hasCategoryAccess(resource.data.category)` on a non-existent document (`resource == null`), resulting in rule evaluation crashes and 403 Forbidden errors.
  - **Security Rules Fix**: Updated `firestore.rules` for `chandlodiya`, `vadaj`, and `registrations` to safely allow reading non-existent records (`resource == null || hasCategoryAccess(...)`) without error, returning `exists: false` while strictly preserving department isolation (`BAL_ONLY` vs `BLK_ONLY`).
  - **Service-Level Optimization**: Updated `resolveRegistrationDoc`, `issueCard`, `reverseCard`, `updateAccompanyingCount`, `softDeleteRegistration`, and `restoreRegistration` to accept `vistarHint`, targeting the specific center collection directly and avoiding redundant cross-center lookups.

### Removed
- **Admin Event Details Page (`/admin/event`)**:
  - Completely deleted `EventDetailsPage.tsx` and removed the `/admin/event` route and navigation link from [AdminLayout.tsx](file:///Users/poojanchauhan/Projects/diwali/src/components/staff/AdminLayout.tsx) and [App.tsx](file:///Users/poojanchauhan/Projects/diwali/src/App.tsx) per user request.

- **Production Hosting & Mumbai (asia-south1) Deployment**:
  - Full production web application built and deployed live to Firebase Hosting: `https://diwali-test-3ab6c.web.app`.
  - Frontend configured to target the high-performance `anandotsav` database in `asia-south1` (Mumbai).
  - Explicitly preserved standard responsive web architecture with **NO PWA** (no manifest, no service workers, no install prompts) as requested.
- **Cloud Firestore Regional Deployment to Mumbai (`asia-south1`)**:
  - Successfully created and configured dedicated secondary Firestore database `anandotsav` in **`asia-south1` (Mumbai, India)**.
  - Deployed `firestore.rules` and all 6 composite indexes in `firestore.indexes.json` to `anandotsav`.
  - Migrated and synchronized all active data collections (`users`, `eventSettings`, `statistics`, `chandlodiya`, `vadaj`, `registrations`).
  - Updated [src/lib/firebase.ts](file:///Users/poojanchauhan/Projects/diwali/src/lib/firebase.ts), `.env`, and `.env.local` to point directly to `anandotsav`.
  - **Empirical Measured Latency Reduction:**
    - Raw query latency dropped from ~362.72 ms (USA `nam5`) down to **67.13 ms (p50)** in Mumbai.
    - All targets achieved: **p50 = 67.13 ms** (< 100 ms), **p90 = 95.83 ms** (< 180 ms), **p95 = 104.40 ms** (< 250 ms), **p99 = 108.69 ms** (< 500 ms), **Max = 109.78 ms** (< 800 ms).
    - Throughput scaled to **512.82 requests/sec** under 50 concurrent workers with 0% errors.
  - Preserved standard responsive web architecture without PWA per user directive.
  - **Live Station Roster Sync (`stationRoster`) in `VolunteerSearchPage.tsx`**:
    - Ground volunteers now have a real-time `onSnapshot` subscription to their assigned station's records.
    - Matching queries (names, mobile numbers, registration codes) execute **instantaneously in memory at 0 ms** with zero network round-trip overhead.
    - Card status (`ISSUED` / `NOT_ISSUED`) updates in real-time across all volunteer counters.
    - Offline and poor-connectivity resilience: Volunteers at busy Mandir gates can search without being stalled by network drops.
  - **IndexedDB Persistent Local Cache (`persistentLocalCache`) in `src/lib/firebase.ts`**:
    - Enabled `persistentLocalCache` with `persistentMultipleTabManager` in Firebase Web SDK.
    - Query snapshots and documents are cached locally in the browser's IndexedDB, converting repeat lookups into instant local cache reads.
  - **Partition-Aware Query Routing & Limit Tuning in `src/services/registrationService.ts`**:
    - Code searches now examine the prefix pattern: `1001+` routes directly to `chandlodiya`, `0001+` routes directly to `vadaj`, eliminating 50% of cross-center reads.
    - Reduced name search payload limit to 15 records and mobile search to 10 records.
    - Dynamic debouncing: 0ms for 10-digit mobile or registration codes, 100ms for child names.
  - **Benchmark Validation (`scripts/benchmark_search_isolated.js`)**:
    - Throughput increased from 23.58 to **27.80 searches/sec** (+18%).
    - p90 latency dropped from 603 ms to **446 ms** (-26%).
    - p95 latency dropped from 605 ms to **547 ms** (-10%).
    - p99 and maximum latency dropped from 697 ms to **591 ms** (-15%).

- **Volunteer Mobile Layout & Top Line Streamlining (`VolunteerSearchPage.tsx` & `StaffNavbar.tsx`)**:
  - Redesigned the volunteer mobile header to eliminate cluttered, stacked rows.
  - Unified Station badge, area status, 1-Tap toggle, and walk-in action into a single sleek row: `[ 🏛️ ચાંદલોડિયા • 👦 BAL ▾ ]`, `[ ⚡ 1-Tap ]`, and `[ + Walk-in ]`.
  - Added an interactive Station Switcher modal for fast area/department switching without bulky banners.
  - Slimmed `StaffNavbar` to `h-11` (44px) on mobile and removed redundant duplicate navigation links that caused wrapping on small screens.
  - Added interactive quick filter pill tabs (`બધા`, `🖨️ પ્રિન્ટેડ`, `✍️ નોન-પ્રિન્ટેડ`) in search results for instant filtering.
- **Organizer Credit Line**:
  - Updated footer and WhatsApp share message attribution to explicitly state:
    `Organized By : BAPS Bal Pravrutti, Ahmedabad-15 & 19`
  - Standardized the consistent footer across [HomePage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/HomePage.tsx), [RegisterPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/RegisterPage.tsx), and [SuccessPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/SuccessPage.tsx).
- **Removed "BAPS" Prefix from Titles and Brand Headers While Retaining in Addresses**:
  - Removed "BAPS" from event titles, navbar brand headers, logo alt text, and page metadata (now cleanly `આનંદોત્સવ ૨૦૨૬` / `Anandotsav 2026`).
  - Retained "BAPS" in all physical venue addresses and temple locations (`BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા` & `BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ`) as requested.

### Added
- **Department Scope Isolation & Server-Side Firestore Security Rules (`firestore.rules`)**:
  - Authored, compiled, and deployed production-grade Cloud Firestore Security Rules to `diwali-test-3ab6c`.
  - **Strict Department Data Isolation**:
    - Volunteers and Coordinators with `BAL_ONLY` can ONLY read and query BAL registrations; access to BLK records is rejected server-side with `permission-denied`.
    - Volunteers and Coordinators with `BLK_ONLY` can ONLY read and query BLK registrations; access to BAL records is rejected server-side with `permission-denied`.
    - Admins and Super Admins (`BOTH`) have access to both departments.
    - Unauthenticated public users cannot search, list, or inspect registrations.
  - **Registration Details Immutability**: All personal registration fields (`firstName`, `fatherName`, `surname`, `fullName`, `mobileNumber`, `registrationCode`, `category`, `vistar`, `createdAt`) are protected from post-submission modification by all roles.
  - **Soft-Delete Role Enforcement**: Volunteers are blocked from soft-deleting or restoring records; only Coordinators and Admins can perform soft deletion/restoration within their department.
  - **Hard Delete Prevention**: Hard document deletion is globally disabled (`allow delete: if false;`).
  - **Client-Side Enforcements (`QuickRegisterPage.tsx`, `VolunteerSearchPage.tsx`, `HelpdeskLookupPage.tsx`)**:
    - `QuickRegisterPage.tsx`: Hard-locks the category based on `categoryAccess`, ignores and overrides URL query tampering (`?category=...`), and displays an "🔒 Assigned Access" banner.
    - `HelpdeskLookupPage.tsx`: Scopes queries automatically to the logged-in user's `categoryAccess`.
    - `VolunteerSearchPage.tsx`: Station switcher modal displays assigned locked department; action handlers (`issueCard`, `reverseCard`, `updateAccompanyingCount`) guard against cross-department attempts.
    - `StaffNavbar.tsx`: Department indicator badge (`👦 BAL` / `👧 BLK`) is now clearly visible on mobile screens.
- **Production Authentication & Login System (`LoginPage.tsx` & `AuthContext.tsx`)**:
  - Fully integrated **Firebase Authentication** with real user credentials, eliminating local mock/simulation shortcuts.
  - **Username Alias Resolution**: Allows staff and ground volunteers to sign in using short usernames (`bal`, `blk`, `admin`, `superadmin`, `coord.bal`, `coord.blk`) or full email addresses.
  - **Password Visibility Toggle**: Integrated Show/Hide password eye toggle for easy touch-screen entry on mobile devices.
  - **Firestore Role Synchronization**: Connected user profiles in `users/{uid}` in real-time, enforcing server-side roles (`SUPER_ADMIN`, `ADMIN`, `COORDINATOR`, `VOLUNTEER`) and department scopes (`BAL_ONLY`, `BLK_ONLY`, `BOTH`).
  - **Production Account Fast-Fill**: Preset buttons now perform real Firebase Authentication with live UIDs and security token verification.
- **Production Database Preparation (`scripts/reset_and_setup_database.js`)**:
  - Cleaned all temporary test registration documents and reset atomic sequences to proper starting bases:
    - Chandlodiya: `BAL: 1000`, `BLK: 1000` (First registration code: `BAL-1001` / `BLK-1001`)
    - Vadaj: `BAL: 0`, `BLK: 0` (First registration code: `BAL-0001` / `BLK-0001`)
  - Initialized `eventSettings/current` (Public Registration: ON, On-the-spot: ON, Event Name: `આનંદોત્સવ ૨૦૨૬`).
  - Initialized `eventSettings/cardPrinting` cutoff tracking.
  - Initialized all 6 departmental & regional attendance statistics to 0.
  - Verified and seeded all 6 official staff accounts in Firebase Auth and Firestore with standardized secure credentials.
- **Card Printing Cutoff Management & Volunteer Identification Feature**:
  - **Admin Navigation Tab (`/admin/printing`)**:
    - Added "Card Printing (કાર્ડ પ્રિન્ટ)" tab with `Printer` icon in AdminLayout navigation.
    - Added dedicated management console for 2 Vistars x 2 Vibhags = 4 department sequences:
      1. Chandlodiya — Bal Vibhag (`chandlodiyaBalCutoff`)
      2. Chandlodiya — Balika Vibhag (`chandlodiyaBlkCutoff`)
      3. Vadaj — Bal Vibhag (`vadajBalCutoff`)
      4. Vadaj — Balika Vibhag (`vadajBlkCutoff`)
    - Shows live counters of last issued numbers from the database.
    - Includes an interactive live code test simulator to verify any registration code against current cutoffs.
  - **Real-Time Volunteer Station Identification (`VolunteerSearchPage.tsx`)**:
    - Real-time subscription to `eventSettings/cardPrinting`.
    - Automatically marks each child in search results as:
      - 🖨️ **`પ્રિન્ટેડ કાર્ડ (Printed)`** if registration code sequence <= cutoff (advises volunteers to pick card from box).
      - ✍️ **`નોન-પ્રિન્ટેડ • મેન્યુઅલ કાર્ડ (Manual Card)`** if registration code sequence > cutoff (shows prominent alert with child's name and registration code to write on blank card).
    - Also displayed in recent issuances list and admin registrations directory / Excel export.
  - **Service & Unit Tests**:
    - Implemented `cardPrintingService.ts` with `getCardPrintingSettings()`, `updateCardPrintingSettings()`, `subscribeToCardPrintingSettings()`, and `isCardPrePrinted()`.
    - Added full test coverage in `cardPrintingService.test.ts` (8 new tests, 18 tests passing in total).

- **Registration Closed Message & Event Information Feature (PRD Rule 5.9)**:
  - **Live Availability Detection**: Subscribed `RegisterPage.tsx`, `HomePage.tsx`, and `QuickRegisterPage.tsx` to real-time `eventSettings/current` Firestore documents.
  - Automatically flags registration as closed when:
    1. Admin switches `publicRegistrationEnabled: false` (manual instant toggle), OR
    2. Scheduled `automaticClosingAt` date/time is reached (`now >= closingTime`).
  - **Dedicated Registration Closed Screen (`/register`)**:
    - Replaces registration form steps with an authentic claymorphic notice screen styled in Baloo Bhai 2 font.
    - Prominent pulsing lock badge and status pill (`🔒 ઓનલાઈન રજીસ્ટ્રેશન બંધ છે`).
    - Clear explanation in Gujarati & English explaining that the online registration process has concluded.
    - **Full Festival Event Details**:
      - 🏛️ **Chandlodiya Center**: 31/10/2026 (Saturday) • 5:00 PM to 8:00 PM @ BAPS Sanskardham, Chandlodiya.
      - 🏛️ **Vadaj Center**: 01/11/2026 (Sunday) • 5:00 PM to 8:00 PM @ BAPS Sanskardham, Vadaj.
    - **Welcoming Event Day Walk-in Experience (`/register`)**:
      - Completely redesigned closed view with celebratory, joyful UI/UX replacing harsh roadblock banners.
      - Official BAPS Anandotsav 3D logo, festive welcome pill (`🎉 સ્થળ પર સીધો પ્રવેશ • Walk-in Entry Welcome`), and warm welcoming headline (`આનંદોત્સવ સ્થળ પર આપનું હાર્દિક સ્વાગત છે!`).
      - Highlighted Notice Box (Home & Register): `✨ અગત્યની સૂચના: "તમે સીધા જ સ્થળે આવીને આપનું રજીસ્ટ્રેશન કરાવી શકશો!"`.
      - 4 visual feature cards: 🎟️ નિઃશુલ્ક પ્રવેશ કાર્ડ, 🎯 રોમાંચક રમતો, 🏆 આકર્ષક ઇનામો, 🎪 ધમાકેદાર મનોરંજન.
      - 3-step visual guide on collecting entry card directly at venue counter.
      - Dual center cards (Chandlodiya on 31/10 Sat & Vadaj on 01/11 Sun) with official timings and direct Google Maps buttons (`https://maps.app.goo.gl/7LLXNeLZWiTBakbx6` for Vadaj).
      - One-click WhatsApp share button allowing users to easily invite young friends (bal-balika).
      - Removed repetitive/prohibited apology lines across both Home and Register pages.
  - **Volunteer Quick Registration Gate (`/volunteer/quick-register`)**:
    - Respects independent `onSpotRegistrationEnabled` setting with administrator warning banner and disabled submit action when disabled.
- **Database Partitioning by Center (`chandlodiya` & `vadaj` Collections)**:
  - Partitioned Cloud Firestore root collections into `/chandlodiya` and `/vadaj`.
  - Wiped all previous test and unpartitioned records from legacy `registrations`, `registrationCounters`, and `statistics`.
  - Initialized `/chandlodiya` with:
    - `_center_config`: Chandlodiya venue, date (31/10/2026 Saturday 5:00–8:00 PM), Gujarati labels.
    - `counter_BAL`: Starting sequence base 1000 (`BAL-1001`, `BAL-1002`, ...).
    - `counter_BLK`: Starting sequence base 1000 (`BLK-1001`, `BLK-1002`, ...).
  - Initialized `/vadaj` with:
    - `_center_config`: Vadaj venue, date (01/11/2026 Sunday 5:00–8:00 PM), Gujarati labels.
    - `counter_BAL`: Starting sequence base 0 (`BAL-0001`, `BAL-0002`, ...).
    - `counter_BLK`: Starting sequence base 0 (`BLK-0001`, `BLK-0002`, ...).
  - Configured `registrationService.ts` to write registrations directly into `/chandlodiya` and `/vadaj` collections, and maintain synchronized backward-compatible records.
  - Updated all search, card issuance, card reversal, companion count edits, soft delete, and restore transactions to resolve across `chandlodiya` and `vadaj` collections atomically.
  - Updated `AdminDashboardPage.tsx`, `RegistrationsManagePage.tsx`, and `HelpdeskLookupPage.tsx` to read directly from both center collections in parallel.
  - Updated `firestore.rules` allowing read/write/delete permissions on `chandlodiya/{docId}` and `vadaj/{docId}` and deployed to production project `diwali-test-3ab6c`.
- **Refined WhatsApp Share on Success Page**:
  - Removed decorative tagline `"હું તો આવું છું, તમે પણ આવો છો ને!" — તમારા મિત્રો અને પરિવાર સાથે શેર કરો`.
  - Removed poster image send options and thumbnail.
  - Implemented clean dual buttons: `[ 📲 વોટ્સએપ પર મિત્રો સાથે શેર કરો ]` (pre-filled invitation message with child name, center date/time/venue, and registration link) and `[ 📋 મેસેજ કોપી કરો ]`.
- **Volunteer Mandatory Area Selection Gate & Scoped Operations**:
  - When a volunteer opens `/volunteer`, the panel first checks whether an active operational area is chosen for the session.
  - If no area is active, a dedicated **Area Selection Screen** is presented:
    - 🏛️ **Chandlodiya (ચાંદલોડિયા)**: 31/10/2026 (Saturday) • 5:00 PM to 8:00 PM @ BAPS Sanskardham, Chandlodiya.
    - 🏛️ **Vadaj (વાડજ)**: 01/11/2026 (Sunday) • 5:00 PM to 8:00 PM @ BAPS Sanskardham, Vadaj.
  - Once selected, the panel strictly and exclusively displays that area's details only:
    - Search queries strictly scoped to the active area.
    - Recent issuances filtered to only display cards issued at that center.
    - Walk-in Quick Register pre-locks to the active area.
    - Prominent active station banner with a dedicated `[ 🔄 Change Area ]` button to easily switch centers.
- **Mobile Phone UI/UX Polish**:
  - **Universal Font**: Unified all texts, headings, inputs, and buttons to `Baloo Bhai 2` (Google Fonts) across 400–800 weights.
  - **Input Auto-Zoom Prevention**: Set all inputs to `min-h-[48px] py-3 text-base` with numeric input modes on mobile phones.
  - **Floating Quick-Register Bar**: Added sticky floating action bar on mobile homepage (`sm:hidden fixed bottom-3`) for 1-tap registration from any scroll depth.
  - **Review Admission Pass**: Styled Step 4 in public registration as an authentic admission pass with thumb-friendly 48px action buttons.
  - **WhatsApp Share**: Added a direct 1-tap WhatsApp Share button (`📱 વોટ્સએપ પર પરિવાર સાથે વિગતો શેર કરો`) on the registration success page.

- **Multi-Vistar (Area) Architecture Support (Vadaj & Chandlodiya)**:
  - Supports 2 distinct program regions: **Vadaj (વાડજ)** and **Chandlodiya (ચાંદલોડિયા)**.
  - Vistar-partitioned sequential registration code numbering:
    - **Vadaj**: `BAL-0001` (starts at 0001), `BLK-0001` (starts at 0001).
    - **Chandlodiya**: `BAL-1001` (starts at 1001), `BLK-1001` (starts at 1001).
  - Vistar event schedules:
    - Vadaj: 01/11/2026 (Sunday), 05:00 PM to 08:00 PM (સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી), BAPS Swaminarayan Sanskardham, Vadaj.
    - Chandlodiya: 31/10/2026 (Saturday), 05:00 PM to 08:00 PM (સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી), BAPS Swaminarayan Sanskardham, Chandlodiya.
  - **Chandlodiya-First & Prominent Date Highlighting**:
    - **Chandlodiya First**: Reordered Vistar selection so **Chandlodiya is presented FIRST** (Saturday 31/10) followed by **Vadaj SECOND** (Sunday 01/11) across public registration (`RegisterPage`), volunteer quick registration (`QuickRegisterPage`), volunteer search filters (`VolunteerSearchPage`), admin directory filters (`RegistrationsManagePage`), and admin dashboard center tabs (`AdminDashboardPage`).
    - **Cleaned Badges & Event Timing**: Removed `શનિવારનો ઉત્સવ` & `રવિવારનો ઉત્સવ` badges to keep card titles uncluttered; updated time to `સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી` (`05:00 PM to 08:00 PM`) for both locations.
    - **Prominent Date Highlighting**:
      - Vistar selection cards now feature eye-catching calendar date blocks (`OCT 31` / `NOV 01`), high-contrast amber/pink/blue gradient badges, sparkle accents, bold Gujarati dates (`૩૧ ઓક્ટોબર ૨૦૨૬ • શનિવાર` / `૧ નવેમ્બર ૨૦૨૬ • રવિવાર`), and highlighted timing (`સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી`).
      - Screen 2 (Vibhag department selection), Screen 3 (Form header), and Screen 4 (Review & Confirm card) prominently highlight the event date and timing.
      - Homepage schedule cards display high-contrast date highlight boxes.
  - Success page displays Vistar-specific event date, time, and Mandir venue instructions.
  - Homepage showcases distinct schedule cards for both Chandlodiya and Vadaj with direct registration links.
  - Volunteer Station supports Vistar selector chips (`[All Areas | Vadaj | Chandlodiya]`) with live filtering and Vistar badges on search cards.
  - Volunteer Quick Registration supports Area selection and allocates sequential codes accordingly.
  - Admin Registrations Directory supports Area filtering (`ALL` / `VADAJ` / `CHANDLODIYA`) and includes `Area / Vistar` in Excel `.xlsx` exports.
  - Admin Event Details page updated with individual date, day, time, and venue configuration for both Vadaj and Chandlodiya.
- **Dedicated Multi-Vistar Analytics & Operational Dashboard (`/admin`)**:
  - Streamlined, clean, and distraction-free interface (removed Family Helpdesk desk bar, Kitchen & Prasad projections, and Live Broadcast widgets).
  - Top-level 3-way Scope Switcher: `[ 🌐 Combined Overview | 🏛️ Vadaj Center | 🏛️ Chandlodiya Center ]`.
  - **Combined Mode**: Includes side-by-side comparative summary cards comparing Vadaj vs Chandlodiya (Registrations, Cards Issued, Attendance, Bal/Blk breakdown) with 1-click drill-down shortcuts.
  - **Vadaj & Chandlodiya Modes**: Dedicated hero banner displaying venue, date, time, sequential series (`0001+` vs `1001+`), and isolated headcount calculations.
  - Dynamic Department Filtering (`ALL`, `BAL`, `BLK`) functions seamlessly inside whichever Vistar scope is currently selected.
  - Filtered Live Registrations Activity Stream with colored Vistar badges.
  - Vistar-scoped Excel exports: downloads center-specific files (`Anandotsav_2026_Vadaj_Registrations.xlsx`, `Anandotsav_2026_Chandlodiya_Registrations.xlsx`, or `Anandotsav_2026_Combined_Registrations.xlsx`).
- **Universal Strict Database Read Limits**:
  - `registrationService.ts`: Added `limit(10)` to Registration Code search, `limit(20)` to Mobile search, and `limit(25)` to Name token search.
  - `HelpdeskLookupPage.tsx`: Added `limit(25)` to primary mobile lookup and `limit(50)` to fallback search to prevent accidental unbounded scans.
  - `RegistrationsManagePage.tsx`: Added configurable Read Limit selector (`[Limit: 100 | 300 | 500 | 1,000 reads]`) allowing staff to cap query reads.
  - `AdminDashboardPage.tsx`: Applied strict `limit(1000)` read limit on registration fetch with live header indicator badge.
- Official Anandotsav 2026 3D Logo (`/anandotsav-logo.png`) and Official Poster (`/anandotsav-poster.jpg`) integration.
- 3D Playground Wonderland Theme for public portal matching the official festival poster:
  - Illuminated theater archway (`clay-wonderland-arch`) with animated glowing light bulbs (`bulb-glow`).
  - Playful claymorphic floating elements, candy-gloss badges (`clay-pill-tag`), and bouncy cards.
- Native Gujarati Language Localization & Context Engine (`src/context/LanguageContext.tsx`):
  - Google Fonts `Baloo Bhai 2` applied universally across the entire application (root `*`, `html`, `body`, headings `h1–h6`, `input`, `button`, `select`, `textarea`, and Tailwind `font-sans`/`font-display`/`font-gujarati`; weights 400–800).
  - Gujarati-only public portal (removed language toggle; portal is exclusively in Gujarati).
  - Child Registration form with Gujarati field labels, placeholders, and venue counter guidelines.
  - Step 2 Review & Confirm screen in Gujarati with immutability warnings.
  - Celebratory registration success page in Gujarati with confetti and official games card pickup instructions.
- Event Details Management view (`EventDetailsPage.tsx`) Brand Asset Preview card.
- Favicon and Social Share metadata updated with official Anandotsav logo in `index.html`.
- Streamlined public registration journey:
  - Homepage presents a single grand primary CTA button: **"📝 રજીસ્ટ્રેશન ફોર્મ ભરો ➜"** (games are equal for all children).
  - Clicking registration opens Screen 1 displaying **two large 3D buttons**: 👦 **બાળ (Bal - Boys)** and 👧 **બાલિકા (Balika - Girls)**.
  - Selecting either button immediately opens the respective Bal or Balika registration form (Step 2) followed by review & confirmation.
- Mobile UI/UX ergonomics and touch comfort optimization across all public pages:
  - Added `-webkit-tap-highlight-color: transparent` and `touch-action: manipulation` for instant tactile response.
  - Set input `font-size: 16px` on mobile screens to completely prevent iOS Safari auto-zooming on focus.
  - Enhanced two side-by-side department buttons (`grid-cols-2`) with responsive padding, scalable emojis, and active touch scaling (`active:scale-95`).
  - Optimized Public Navbar spacing (`h-14 sm:h-16`) and tap targets (`px-3 sm:px-6`) with zero horizontal overflow on small phones (360px–390px).
  - Streamlined Review & Confirm step with thumb-friendly action buttons (`flex-col-reverse sm:flex-row`).
- Removed the "મુખ્ય આકર્ષણો" (Game Stations / Special Card & Prizes / Cultural Joy) section from [HomePage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/HomePage.tsx) as requested.
- Corrected all Gujarati spelling from "બાળિકા" to **"બાલિકા"** across [HomePage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/HomePage.tsx), [RegisterPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/RegisterPage.tsx), [SuccessPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/public/SuccessPage.tsx), and [PublicNavbar.tsx](file:///Users/poojanchauhan/Projects/diwali/src/components/public/PublicNavbar.tsx).
- Enforced strict English letter input (`A–Z`) for child first name, father's name, and surname across both Public Registration and Volunteer Quick Registration:
  - Real-time inline character detection flagging Gujarati/non-English script with warnings.
  - Prominent "Form Must Be Filled in English Only" notice banner with examples (e.g. Aarav, Rajeshbhai, Patel).
  - Input field badges (`English Letters A–Z`), `autoCapitalize="words"`, and `lang="en"` for smooth mobile keyboard entry.
  - Unit tests verifying English name regex validation in [registrationService.test.ts](file:///Users/poojanchauhan/Projects/diwali/src/tests/registrationService.test.ts).
- Comprehensive UI/UX Clarity & Modernization across all Public interfaces:
  - Responsive 3-Step Progress Stepper with auto-condensing labels (`૧. વિભાગ` ➔ `૨. વિગતો` ➔ `૩. કન્ફર્મ`) ensuring zero horizontal overflow on small mobile screens (320px–390px).
  - Enhanced form field validation indicators: live real-time green checkmarks (`CheckCircle2`) on valid English input, immediate red alerts (`AlertCircle`) on non-English characters.
  - Mobile virtual keyboard optimization: `inputMode="numeric"`, `pattern="[0-9]*"`, and `maxLength={10}` on mobile number input with Indian flag `🇮🇳 +91` badge and live digit counter.
  - Interactive Ticket-Style Physical Games Card Live Preview (`ticket-card`): visual pass dynamically showing the child's uppercase name, category badge, and mobile number.
  - Elevated Step 3 (Review & Confirm) into a festive VIP Entry Pass with clear typography, high-contrast labels, and a pulsating confirmation button.
  - Enhanced Success Page with clear numbered 3-step venue card pickup instructions.
  - Added bottom direct registration CTA button on Homepage to eliminate scroll fatigue.
- Volunteer Mobile Operational Screen Efficiency Overhaul ([VolunteerSearchPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/volunteer/VolunteerSearchPage.tsx) & [QuickRegisterPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/volunteer/QuickRegisterPage.tsx)):
  - Sticky Station Header with active department badge (`👦 BAL Station` / `👧 BLK Station`), 1-tap department toggle, and quick Walk-in action button pinned under the thumb.
  - Sticky high-performance mobile search bar with 48px touch targets, large clear button `(X)`, and search-as-you-type debouncing.
  - Results card optimization: high-contrast child name, department pill, registration code, and direct 1-tap **`🎟️ ISSUE CARD (1-TAP)`** action button without intermediate clicks.
  - Native Mobile Bottom Sheet Drawer for card issuance: replaces intrusive center modals with a bottom drawer featuring large thumb-friendly quick picks (`0`, `1`, `2`, `3`, `4`, `5+`), stepper adjustment, and a full-width 54px **`Confirm & Issue Card`** button right above the home bar.
  - Station Recent Stream tray: displays the last 5 cards issued at this station when search is empty, enabling 1-tap companion edits and reversals in seconds without re-searching.
  - Streamlined On-the-Spot Walk-in flow ([QuickRegisterPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/volunteer/QuickRegisterPage.tsx)): auto-prefills search term (phone or name) from search results, integrates companion selection directly on form, and creates registration + issues card in 2 fast taps.
- Volunteer Mobile Screen UI Clarity & Direct 0 to 9 Companion Count ("સાથે જે આવે એની સંખ્યા"):
  - Clarified and aligned digit entry: digits are strictly for the count of accompanying persons with the child ("સાથે જે આવે એની સંખ્યા માટે").
  - Removed intrusive on-screen search keypad to keep the mobile search header spacious, clean, and distraction-free.
  - Implemented direct on-screen **0 to 9 numbers grid** (`[ 0 ] [ 1 ] [ 2 ] [ 3 ] [ 4 ]` / `[ 5 ] [ 6 ] [ 7 ] [ 8 ] [ 9 ]`) directly on the child result card for immediate 1-tap companion count selection.
  - Added custom stepper for `10+` companions (`10+ અથવા વધારે`) for large families.
  - Integrated **⚡ 1-Tap Fast Submit** toggle in station header: when ON, tapping any 0–9 number immediately issues the card atomically and resets search in 0.2s; when OFF, tapping a number updates the selected count and enables the vibrant green **`✅ કાર્ડ આપો / ISSUE CARD (+N)`** button.
  - Removed redundant card issuance popup modal for zero-friction on-screen issuance with automatic return to cleared search.
  - Updated Walk-in Registration ([QuickRegisterPage.tsx](file:///Users/poojanchauhan/Projects/diwali/src/pages/volunteer/QuickRegisterPage.tsx)) with the same full 0 to 9 companion buttons grid.
  - Local Network Hosting & Cloudflare Tunnel Support:
    - Configured `server: { host: true, port: 5173, allowedHosts: true }` in [vite.config.ts](file:///Users/poojanchauhan/Projects/diwali/vite.config.ts) and `"dev": "vite --host"` in [package.json](file:///Users/poojanchauhan/Projects/diwali/package.json).
    - Enabled binding to `0.0.0.0` so mobile devices on the local Wi-Fi can access `http://10.239.49.154:5173/`.
    - Integrated temporary Cloudflare tunnel port-forwarding with full HTTPS support, allowing instant public internet access from any mobile phone or cellular data network.

## [Unreleased] - 2026-10-17

### Added
- Git repository initialization.
- Node.js v22.14.0 LTS environment configuration in user space.
- Architecture specification (`docs/ARCHITECTURE.md`).
- Firestore schema specification (`docs/DATABASE_SCHEMA.md`).
- Role-based access control specification (`docs/RBAC.md`).
- Master task tracker (`TASKS.md`).
- Architecture Decision Records (`docs/DECISIONS.md`).
- Unified Admin Command Center layout (`AdminLayout.tsx`) with navigation tabs (`Overview`, `Registrations`, `Registration Toggles`, `Event Details`, `Staff Accounts`).
- Real-time Registration Availability Toggles page (`RegistrationSettingsPage.tsx`).
- Live Event Details Management page (`EventDetailsPage.tsx`).
- Staff & Volunteer Shared Account Management page (`StaffAccountsPage.tsx`).
- Ground Operations Volunteer Station enhancements (`VolunteerSearchPage.tsx`):
  - Station ground status and active department indicator.
  - 1-tap Recent Issuances card list with instant companion adjustment and reversal.
  - Prominent on-the-spot walk-in registration CTA.
  - Live ground broadcast alert ticker with real-time Firestore listener.
- Intelligent role-based authentication redirection in `LoginPage.tsx`.
- Family & Sibling Helpdesk Desk (`HelpdeskLookupPage.tsx`):
  - Multi-sibling grouping across BAL & BLK by parent phone number.
  - Batch "Issue All Cards for Family" action with individual companion counts.
  - Direct WhatsApp (`wa.me`) and phone call (`tel:`) parent communication shortcuts.
- Registrations Directory Bulk Operations & Anomaly Audit Tools (`RegistrationsManagePage.tsx`):
  - Checkbox selection with floating Bulk Toolbar.
  - Export selected records to Excel (`.xlsx`).
  - Bulk soft-delete for selected records.
  - Anomaly filter pills: High Companions ($\ge 5$), Walk-ins Only, Uncollected Cards, Active Issued Cards.
  - Child Quick Inspector Drawer with direct card issuance, reversal, companion editing, and WhatsApp link.
### Added / Optimized
- Admin UI/UX Data-Perfect & High-Utility Overhaul:
  - Converted Admin UI into a high-density, data-focused management console (useful, not showful):
  - Compact Executive Metric Ribbon (~90px vertical height) replacing oversized puffy cards.
  - Master Centers & Categories Operations Matrix table: side-by-side comparison of Chandlodiya (31/10 Sat), Vadaj (01/11 Sun), and Combined Total across BAL, BLK, and Total for:
    1. Total Registrations
    2. Online Portal Registrations
    3. On-The-Spot Walk-In Registrations
    4. Cards Issued (Children Present)
    5. Cards Pending Collection
    6. Family Companions (Guardians Present)
    7. ★ Total Ground Attendance Headcount
  - 1-Click "Copy WhatsApp Report" button: copies a formatted text message to clipboard for instant reporting in coordinator WhatsApp groups.
  - Registrations Directory Data Enhancements:
    - Added "Registered" formatted date/time column.
    - Added "Reset all filters" shortcut when filters are active.
    - Compact row padding (`py-2`) allowing high visible record density without scrolling.
    - Color-coded center badges: Chandlodiya (purple) and Vadaj (blue).
    - Table Live Summary Footer displaying filtered count, cards issued, pending, companions, and active headcount.
  - Volunteer Panel Mandatory Area Gate: enforces selecting Chandlodiya or Vadaj upon entry before showing area-scoped records, cards, and quick registration.
  - Friendly WhatsApp Invitation Sharing (`SuccessPage.tsx`):
    - Redesigned WhatsApp share message into a personal, enthusiastic friend-to-friend invitation: *"હું તો BAPS આનંદોત્સવ ૨૦૨૬ માં જાઉં છું! તમે પણ આવો છો ને?"*
    - Automatically includes complete event details (Area, Date, Time, Venue) and live direct registration link (`/register`).
    - Streamlined share interface with dual actions: `[ 📲 વોટ્સએપ પર મિત્રો સાથે શેર કરો ]` and `[ 📋 મેસેજ કોપી કરો ]`.
    - Open Graph metadata (`og:image: /anandotsav-poster.jpg`) maintained in `index.html` for rich preview cards when links are shared in WhatsApp.


