
# MEMORY.md
# BAPS Anandotsav 2026 — Project Memory

Last Reviewed: 2026-10-17
Project Status: Requirements finalized in part; development not yet confirmed as started.

IMPORTANT:
This document stores durable project context and approved decisions.
It is not a substitute for the complete PRD.
Do not mark features implemented unless verified in the codebase.

---

## 1. Project Identity

Project Name:
BAPS Anandotsav 2026

Project Type:
Public Registration and Event Management Web Application

Purpose:
Manage child registrations, on-the-spot registrations, physical games-card distribution, attendance estimates, staff operations, and event administration.

Registration Categories:
- BAL — Bal Vibhag
- BLK — Balika Vibhag

Interface Language:
- Public Registration Portal: Gujarati only (no option to change language to English; language toggle permanently removed).
- Staff / Volunteer / Admin Portals: English.
- Form Data Entry Rule:
  - First Name, Father's Name, and Surname must strictly be filled in English letters (A–Z) across both public and quick registration forms. Enforced via real-time validation, input badges, and service-level regex validation.
  - Address Fields (House Number & Society Name) and Custom Other Area must strictly be filled in English (`A–Z, 0–9 Only`).
  - Form field sequence: Name fields -> Mobile number -> House Number & Society Name (First) -> Area / Locality Selection (Second).

Operating Model:
Online-only.

Database Location:
- Cloud Firestore region: `asia-south1` (Mumbai, India)
- Database resource: `projects/diwali-test-3ab6c/databases/anandotsav`
- Latency target: Sub-100ms in-country access (p50: 67ms, p95: 104ms).

Production Hosting:
- Live URL: `https://anandotsav.web.app` (Primary)
- Secondary Mirror: `https://diwali-test-3ab6c.web.app`

Application Architecture:
- Standard responsive web application (NO PWA).
- Service workers, Web App Manifests, and PWA install prompts are strictly prohibited per user directive.

---

## 2. Technology Direction

Recommended stack:

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion

Backend:
- Firebase Authentication
- Cloud Firestore
- Cloud Functions 2nd Gen
- Firebase Storage
- Firebase Hosting

Infrastructure:
- Google Cloud Monitoring

The final implementation must remain consistent with approved architecture decisions.

---

## 3. User Roles

### Super Admin

- Individual login.
- Full system authority.
- Can create, disable, and manage Admin accounts.
- Can manage Coordinators and volunteer shared accounts.

### Admin

- Individual login.
- Manages event operations.
- Manages Coordinators.
- Manages volunteer shared accounts.
- Cannot manage other Admin accounts.

### Coordinator

- Individual login.
- Department access assigned by Admin.
- Possible access: BAL_ONLY, BLK_ONLY, BOTH.
- Admin-like operational authority within assigned department.
- Can soft-delete and restore registrations within assigned department.
- Cannot manage other Coordinator accounts.

### Volunteer

- Shared team login.
- One BAL account.
- One BLK account.
- Multiple simultaneous sessions supported.
- Can search, perform quick registration, issue/reverse cards, and update companion counts.
- Cannot delete registrations.
- Cannot manage accounts.

Individual volunteer attribution is not required.

---

## 4. Public Registration

Confirmed:
- No public login.
- BAL/BLK selection.
- Mobile-friendly registration.
- Streamlined 3-Step Direct Registration: Center Selection -> Department Selection -> Form Details with direct Submit button (Review step removed per user directive on 2026-10-22).
- Success message after saving.
- Registration ID displayed to balak/parents on success screen (user approved 2026-10-21).
- No SMS confirmation.
- No WhatsApp confirmation.
- Submitted details immutable.

Confirmed child-name fields:
- First Name
- Father's Name
- Surname

Mobile number is collected.

Other registration fields remain TBD.

---

## 5. Duplicate Registration Policy

FINAL DECISION:
Duplicate registrations are allowed.

This supersedes all earlier requirements that restricted one registration per mobile number.

Allow:
- Same mobile number across multiple registrations.
- Same child name across multiple registrations.
- Repeated registration for the same child.
- Identical personal information in separate intentional submissions.

Do not implement:
- Duplicate detection.
- Duplicate warnings.
- Mobile-number uniqueness.
- Existing-child blocking.
- Duplicate-record merging.

Each successful registration receives its own unique registration code.

Request idempotency is allowed for technical retry safety.

---

## 6. Registration Codes

FINAL DECISION (October 2026):
All `BAL-` and `BLK-` codes removed completely. Only center-prefixed `V-` and `C-` codes without zero-padding are used, partitioned by gender / vibhag:

VADAJ:
- BAL (Bal Vibhag): `V-1` to `V-1000` (sequential starting from 1)
- BALIKA (Balika Vibhag): `V-1001` onwards (sequential starting from 1001)

CHANDLODIYA:
- BAL (Bal Vibhag): `C-1` to `C-1000` (sequential starting from 1)
- BALIKA (Balika Vibhag): `C-1001` onwards (sequential starting from 1001)

Volunteer Search Ergonomics:
- In Vadaj, volunteers do NOT have to type `V-`. Typing pure numbers (e.g. `42` or `1025`) immediately synthesizes and matches `V-42` or `V-1025` at 0ms.
- In Chandlodiya, volunteers do NOT have to type `C-`. Typing pure numbers immediately synthesizes and matches `C-42` or `C-1025` at 0ms.
- Explicit prefix typing (e.g. `V-42`, `C-1025`) also works seamlessly.

Vistars (Event Locations, Schedules & Selection Order):
- **1. Chandlodiya (CHANDLODIYA)** (First in selection): 31/10/2026 (Saturday), 05:00 PM to 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી), BAPS Swaminarayan Sanskardham, Chandlodiya. Sequence: BAL/BLK-1001+.
- **2. Vadaj (VADAJ)** (Second in selection): 01/11/2026 (Sunday), 05:00 PM to 08:00 PM (સાંજે ૫:૦૦ થી ૮:૦૦ વાગ્યા સુધી), BAPS Swaminarayan Sanskardham, Vadaj. Sequence: BAL/BLK-0001+.

UI Presentation Rules:
- **Order**: In public registration, volunteer quick registration, volunteer search, admin directory, and dashboard center tabs, Chandlodiya (Saturday 31/10) is presented FIRST, Vadaj (Sunday 01/11) is presented SECOND.
- **Date Highlighting**: Event dates must be prominently highlighted using calendar date blocks (`OCT 31` / `NOV 01`), high-contrast amber/pink/blue badges, and bold Gujarati typography to ensure users clearly see when their program takes place.
- **Timing**: 05:00 PM to 08:00 PM (`સાંજે ૫:૦૦ વાગ્યા થી ૮:૦૦ વાગ્યા સુધી`) for both locations.
- **Badges**: Day badges (`શનિવારનો ઉત્સવ` / `રવિવારનો ઉત્સવ`) are removed to keep the card headers clean.

Rules:
- Independent counters per (Vistar + Category): VADAJ_BAL, VADAJ_BLK, CHANDLODIYA_BAL, CHANDLODIYA_BLK.
- Atomic allocation within Firestore transactions.
- Shared between public and on-the-spot registrations.
- Never reused.
- Preserved after soft deletion.
- Hidden from public users.
- Visible to authorized staff.

---

## 7. Registration Availability

Public registration:
- Manual ON/OFF.
- Automatic closing date/time.

On-the-spot registration:
- Independent manual ON/OFF.

No maximum registration count.

When public registration closes:
- Display Registration Closed.
- Keep event information visible.
- Allow Admin to update event details.

---

## 8. Volunteer Search

Search by:
- Child name.
- Mobile number.
- Registration code.

Search behavior:
- Search-as-you-type.
- Debounced queries.
- Optimized/indexed retrieval.
- Department restrictions.
- Deleted records excluded.

Search result layout:
- Full name on first line.
- Mobile number underneath.

Multiple matching registrations remain separate records.

---

## 9. Card Distribution

Physical games cards are issued manually.

No QR scanning.
No physical card ID linking.

Required workflow:
1. Search child.
2. Select registration.
3. Verify details.
4. Select accompanying-person count via on-screen 0 to 9 numbers ("સાથે જે આવે એની સંખ્યા") or 10+ custom stepper.
5. Click Confirm / Issue Card (or instant 1-tap submission when ⚡ 1-Tap Fast Submit mode is toggled ON).
6. Save card status and count atomically.
7. Show success feedback.
8. Clear search and return automatically to a fresh counter state.

Canceling must not issue a card.

---

## 10. Card Status

Statuses:
- NOT_ISSUED
- ISSUED

Volunteers can:
- Issue cards.
- Reverse issuance.
- Reissue cards.
- Edit accompanying-person count after issuance.

Reversing a card removes its attendance contribution.

Editing accompanying count must not require unissuing the card.

---

## 11. Accompanying Persons

Count is entered at the event venue.

Count is not collected during public registration.

The registered child is excluded from the accompanying-person count.

Count must be a non-negative integer.

Maximum count remains TBD.

---

## 12. Attendance

Children Present:
Count of active registrations with issued cards.

Accompanying Persons Present:
Sum of companion counts for active issued registrations.

Total Attendance:
Children Present + Accompanying Persons Present.

Views:
- BAL
- BLK
- Combined

Attendance is based on card issuance, not physical entry/exit tracking.

Intentional duplicate registrations are not automatically deduplicated.

---

## 13. Admin Dashboard

Required metrics:
- BAL registrations
- BLK registrations
- Total registrations
- Online registrations
- On-the-spot registrations
- Cards issued
- Cards pending
- Children present
- Accompanying persons present
- Total attendance

Refresh:
- On initial load.
- On manual Refresh action.

No continuous automatic statistics refresh.

Display Last Updated timestamp.

---

## 14. Registration Management

Confirmed sorting:
- Latest First
- Oldest First
- Name A–Z

Confirmed:
- Search registrations.
- Filter registrations.
- Soft delete.
- Restore.
- Excel export (.xlsx).

PDF export not required.

Submitted registration information cannot be edited.

---

## 15. Soft Delete

Deleted records:
- Remain in database.
- Are hidden from normal search.
- Are excluded from active statistics.
- Preserve registration codes.
- Can be restored.

Authorized:
- Super Admin: all categories.
- Admin: all categories.
- Coordinator: assigned categories.
- Volunteer: no permission.

---

## 16. Event Management

Admin-editable:
- Event name
- Date
- Time
- Venue
- Address
- Description
- Instructions
- Contact information
- Logo
- Banner
- Photos

Updates must appear on the public website.

Event information remains available when registration is closed.

---

## 17. Interface Design

Public:
Modern, colorful, festive, 3D Playground Wonderland / Claymorphism inspired by the official Anandotsav 2026 poster (purple theater arch, illuminated glowing bulbs, bubbly Baloo Bhai 2 Gujarati lettering, vibrant Bal/Blk clay cards). Gujarati primary with English toggle.

Volunteer:
Clean, fast, mobile-first, functional, professional Light Mode (`bg-slate-100`, `bg-white`, `border-slate-200`, `text-slate-900`). English. High contrast for daylight and event-day readability.

Admin:
Clean, professional, data-focused, responsive Light Mode (`bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`). English. High contrast for day operations.

Do not use Claymorphism for Volunteer or Admin interfaces.

---

## 18. Scale and Reliability

Expected:
- Approximately 1,000+ registrations.
- Approximately 20–50 concurrent volunteers.

Recommended testing:
- 50 concurrent users.
- 100 concurrent users.
- 200 concurrent users.

Priorities:
- Fast search.
- Atomic registration codes.
- Safe concurrent card issuance.
- Accurate attendance.
- Reliable backend permissions.

No offline mode.

---

## 19. Important Restrictions

NEVER:
- Implement duplicate registration prevention.
- Expose other families' registrations (child's own registration ID is displayed to them on registration success per user instruction).
- Allow editing submitted registration details.
- Add QR scanning without approval.
- Require individual volunteer accounts.
- Add automatic real-time dashboard refresh.
- Add offline synchronization.
- Add SMS or WhatsApp confirmation without approval.
- Use Claymorphism in staff panels.
- Invent missing registration fields.
- Reuse deleted registration codes.

---

## 20. Pending Requirements

The following are not yet finalized:

- Complete public registration fields.
- Whose mobile number is collected.
- Exact quick registration fields.
- Event date and time.
- Event venue.
- Final branding assets: [CONFIRMED & APPLIED] Official 3D Anandotsav 2026 Logo (`/anandotsav-logo.png`) & Official Poster (`/anandotsav-poster.jpg`).
- Maximum accompanying-person count.
- Spare physical card quantities.
- Production domain.
- Data retention policy.
- Privacy/consent wording.
- Exact Coordinator volunteer-management actions.

Do not silently convert TBD items into confirmed requirements.

---

## 21. Development Progress

Current known state:

[x] Project repository initialized
[x] Firebase configured
[x] Authentication implemented
[x] RBAC implemented
[x] Public website implemented
[x] Public registration implemented
[x] Registration backend implemented
[x] Volunteer panel implemented
[x] Quick registration implemented
[x] Card issuance implemented
[x] Attendance implemented
[x] Coordinator panel implemented
[x] Admin dashboard implemented
[x] Event management implemented
[x] Excel export implemented
[x] Helpdesk Multi-Sibling Family Lookup & Batch Issuance implemented
[x] Kitchen & Catering (Prasad) Capacity Projections (+10% safety buffer) implemented
[x] Live Event Ground Broadcast Announcer (Real-time Firestore Push) implemented
[x] Security rules and department scope isolation implemented & deployed (Firestore rules on diwali-test-3ab6c)
[x] Security testing completed
[ ] Load testing completed
[ ] Production deployment completed

These boxes represent unverified status, not a claim that work has or has not been performed.

Update only after inspecting and verifying actual implementation.

---

## 22. Documentation Rules

Maintain consistency between:

- AGENTS.md
- MEMORY.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATABASE_SCHEMA.md
- docs/RBAC.md
- TASKS.md
- docs/DECISIONS.md
- docs/CHANGELOG.md

After approved requirement changes:
1. Update MEMORY.md.
2. Update the relevant specification.
3. Update tasks if necessary.
4. Record meaningful decisions.

Do not overwrite earlier decisions without recording the replacement.

---

## 23. Next Recommended Steps

1. Create project repository.
2. Add approved PRD.
3. Finalize Architecture.
4. Define Firestore schema.
5. Define RBAC and security rules.
6. Create phased TASKS.md.
7. Configure development environment.
8. Begin implementation after resolving any blocking requirements.

---

## 24. Agent Reminder

Always prioritize approved requirements over assumptions.

Duplicate registrations are allowed.

Registration codes must remain unique.

Original submitted details are immutable.

Card and attendance operations must remain consistent.

Keep the application secure, fast, maintainable, and suitable for event-day operations.

---

## 25. Multi-Vistar (Area) Architecture & Dashboards

- **Supported Vistars**:
  - `VADAJ`: Sunday, 01/11/2026, 04:00 PM onwards @ BAPS Swaminarayan Sanskardham, Vadaj. Code series: `BAL-0001+`, `BLK-0001+`.
  - `CHANDLODIYA`: Saturday, 31/10/2026, 04:00 PM onwards @ BAPS Swaminarayan Sanskardham, Chandlodiya. Code series: `BAL-1001+`, `BLK-1001+`.
- **Volunteer Operational Experience**:
  - **Mandatory Area Selection Gate**: When a volunteer opens `/volunteer`, if no area is active in the session, they are first prompted to choose their counter area (`Chandlodiya` or `Vadaj`).
  - **Area-Locked Details**: Once selected, the volunteer panel exclusively displays and searches registrations within that specific area only (`vistar === selectedVistar`).
  - **Scoped Actions**: Walk-in quick registrations automatically pre-lock to the selected area, and recent card issuances are scoped to that station.
  - **Station Header & Area Switching**: Header displays the active station (`Chandlodiya (31/10)` or `Vadaj (01/11)`) with a dedicated `[ 🔄 Change Area ]` button to switch centers whenever needed.
- **Mobile Phone UI/UX Excellence**:
  - Global font strictly unified to `Baloo Bhai 2` across all weights and components.
  - Mobile inputs enforce `min-h-[48px] py-3 text-base` to prevent iOS Safari auto-zoom on focus.
  - Public registration features a streamlined 3-step responsive stepper (`૧/૩`, `૨/૩`, `૩/૩`) with direct registration on Step 3 and tactile card buttons.
  - Mobile floating quick-registration action bar on the home page (`sm:hidden fixed bottom-3`).
  - WhatsApp Friend Invitation sharing on registration success page: *"હું તો BAPS આનંદોત્સવ ૨૦૨૬ માં જાઉં છું! તમે પણ આવો છો ને?"* with complete event schedule, venue, and live registration link (`/register`), plus a 1-click text copy button.
- **Admin UI/UX Philosophy (Data-Focused, Useful Not Showful)**:
  - Strict compliance with user directive: *"make it useful not showful... because i want data perfect more than nice looking"*.
  - Removed decorative widgets, puffy cards, and distracting animations.
  - **Compact Executive Metric Ribbon**: High-density 4-metric summary (~90px height) providing Total Registrations (Online/Walk-in), Cards Issued (% Collected), Family Companions, and Total Ground Attendance.
  - **Master Centers & Categories Operations Matrix**: Complete tabular overview comparing Chandlodiya (31/10 Sat), Vadaj (01/11 Sun), and Combined Total across BAL, BLK, and Center Total for all 7 critical operational metrics in a single view.
  - **1-Click WhatsApp Broadcast Report**: Copies preformatted text summary with timestamp to clipboard for coordinator WhatsApp groups.

---

## 26. Deployment & Publishing Protocol (User Directive)

- **MANDATORY CONFIRMATION BEFORE DEPLOYMENT**: Always ask the user for explicit permission/confirmation before deploying to Firebase Hosting (`npm run deploy` or `firebase deploy`).
- Never autonomously push a deployment to live production hosting without the user explicitly saying to deploy.
- Local verification, tests (`npm test`), and production build (`npm run build`) can proceed locally to ensure code health, but live deployment requires user confirmation.

  - **Registrations Directory Enhancements**: Added registration timestamp column (`Registered`), "Reset all filters" shortcut, color-coded center badges, compact rows (`py-2`), and table live summary footer.

