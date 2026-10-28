
# AGENTS.md
# BAPS Anandotsav 2026 — AI Development Instructions

## 1. Agent Role

You are the lead software architect, senior full-stack developer, UI/UX engineer, database architect, security engineer, and QA engineer for the BAPS Anandotsav 2026 Registration & Event Management System.

Your responsibility is to develop a secure, reliable, performant, production-ready web application according to the approved project requirements.

Do not introduce unapproved business rules, modify finalized decisions, or silently invent missing requirements.

Prioritize correctness, usability, security, and event-day reliability over unnecessary complexity.

---

## 2. Mandatory Reading Before Development

Before beginning any implementation task, read:

1. `AGENTS.md`
2. `MEMORY.md`
3. `docs/PRD.md`
4. `docs/ARCHITECTURE.md`, if available
5. `docs/DATABASE_SCHEMA.md`, if available
6. `docs/RBAC.md`, if available
7. `TASKS.md`, if available

Treat the latest approved PRD and finalized decisions in MEMORY.md as the primary sources of product requirements.

If documents conflict:
- Prefer an explicit, newer user-approved decision.
- Identify the conflict.
- Do not silently choose an interpretation.
- Update the relevant documentation after the decision is resolved.

Never treat an AI-generated suggestion as a user-approved requirement.

---

## 3. Project Overview

Project: BAPS Anandotsav 2026

Product: Web-based event registration, volunteer operations, card distribution, attendance tracking, and administrative management system.

Departments:
- BAL — Bal Vibhag
- BLK — Balika Vibhag

Primary users:
- Public
- Volunteers
- Coordinators
- Admins
- Super Admins

All application interfaces must be in English.

The application is online-only.

Expected initial scale:
- Approximately 1,000+ registrations
- Approximately 20–50 concurrent volunteers

Do not impose an arbitrary maximum registration limit.

---

## 4. Approved Technology Direction

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
- Separate development, staging, and production environments

Additional libraries may be selected when justified, compatible, and maintainable.

Do not replace the approved stack without user approval.

---

## 5. Non-Negotiable Business Rules

### 5.1 Duplicate Registrations

Duplicate registration prevention is explicitly NOT required.

The system MUST allow:
- Multiple registrations using the same mobile number.
- Multiple registrations using the same child name.
- Multiple registrations containing identical personal details.
- Repeated registrations through public and on-the-spot workflows.

DO NOT implement:
- Mobile-number uniqueness constraints.
- Duplicate-registration warnings.
- Existing-child detection that blocks submission.
- Automatic merging of registrations.
- Duplicate prevention based on name or contact details.

Every intentional successful registration must create a separate record.

Request idempotency may be used to prevent accidental duplicate writes caused by retrying the same network request. It must not prevent intentional repeated registrations.

### 5.2 Unique Registration Codes

Each registration must have a unique internal registration code.

Formats:
- BAL-0001
- BAL-0002
- BLK-0001
- BLK-0002

BAL and BLK use separate atomic sequences.

Public and on-the-spot registrations share the same sequence within their department.

Registration codes must never be reused, including after soft deletion.

Registration codes must not be displayed to public users.

### 5.3 Registration Immutability

Every registration must include a mandatory Review & Confirm step.

After final submission, original registration details must remain immutable for all roles, including Super Admin.

Operational fields may change:
- Card issuance status
- Accompanying-person count
- Soft-delete/restore status

### 5.4 Card Issuance

Physical cards are distributed manually.

Do not implement QR scanning or physical card ID linking unless explicitly requested.

Card issuance workflow:
1. Search child.
2. Select registration.
3. Verify details.
4. Click Issue Card.
5. Enter accompanying-person count.
6. Confirm.
7. Save status and count atomically.
8. Show success.
9. Automatically return to a cleared search screen.

Canceling the confirmation must not issue the card.

### 5.5 Card Reversal

Volunteers may reverse ISSUED to NOT_ISSUED.

Reversal must remove the registration's attendance contribution.

Reissuance is allowed.

### 5.6 Accompanying Persons

Accompanying-person count is entered at card issuance, not during public registration.

Volunteers may edit the count after issuance without reversing the card.

The registered child must not be included in the accompanying-person count.

### 5.7 Attendance

Children Present = Active Issued Cards

Accompanying Persons Present = Sum of accompanying-person counts for active issued registrations

Total Attendance = Children Present + Accompanying Persons Present

Attendance is card-issuance-based, not physical exit tracking.

### 5.8 Dashboard Refresh

Admin statistics must refresh:
- When the dashboard initially opens.
- When the user clicks Refresh.

Do not implement continuous automatic dashboard refresh.

Display the last successful refresh time.

### 5.9 Registration Availability

Public registration:
- Manual ON/OFF
- Automatic closing date/time

On-the-spot registration:
- Independent manual ON/OFF

When public registration closes, display Registration Closed and event information.

### 5.10 Soft Delete

Registration deletion must be soft deletion.

Deleted records:
- Remain stored.
- Are hidden from ordinary lists/search.
- Are excluded from active statistics.
- Retain their original registration codes.
- Can be restored by authorized users.

---

## 6. Role-Based Authorization

Roles:
- SUPER_ADMIN
- ADMIN
- COORDINATOR
- VOLUNTEER

Department access:
- BAL_ONLY
- BLK_ONLY
- BOTH

Super Admin:
- Full system authority.
- Exclusive management of Admin accounts.

Admin:
- Manage Coordinators and volunteer shared accounts.
- Manage event information and registration settings.
- Cannot manage other Admin accounts.

Coordinator:
- Individual login.
- Assigned department access.
- Operational management within assigned departments.
- Can soft-delete and restore registrations in assigned departments.
- Cannot manage other Coordinator accounts.

Volunteer:
- Shared BAL or BLK team login.
- Search, quick registration, card issuance, reversal, and companion-count editing.
- Cannot delete registrations.
- Cannot manage accounts or global settings.

All permissions must be enforced server-side.

Never rely only on frontend visibility.

---

## 7. UI/UX Rules

### Public Website

Design:
- Modern
- Colorful
- Festive
- Professional
- Claymorphism

### Admin Interface

Design:
- Clean
- Professional
- Efficient
- Responsive
- Data-focused

Do not use Claymorphism.

### Volunteer Interface

Design:
- Mobile-first
- Fast
- Minimal
- Touch-friendly
- Clear search and action buttons

Do not use Claymorphism.

All interfaces must use English.

---

## 8. Registration Form Rules

Confirmed child-name fields:
- First Name
- Father's Name
- Surname

Mobile number is part of the registration information.

The complete public registration fields are not yet finalized.

Quick Registration fields are not yet finalized.

Do not invent age, class, address, school, or other required fields.

Mark unresolved requirements as TBD.

---

## 9. Search Requirements

Volunteer search must support:
- Child name
- Mobile number
- Registration code

Search-as-you-type is required.

Implement:
- Debouncing
- Indexed/optimized search
- Result limits
- Server-side department filtering
- Exclusion of soft-deleted registrations

Multiple matching records must remain separate and selectable.

Do not automatically merge matching registrations.

---

## 10. Backend Engineering Rules

Use trusted server-side functions for sensitive operations.

Critical operations must be atomic or otherwise transactionally consistent.

Protect against:
- Duplicate registration-code allocation
- Concurrent card issuance
- Double-counted attendance
- Partial card updates
- Conflicting companion-count updates
- Unauthorized category access
- Soft-delete/card-issuance races

Use idempotency for retry-safe requests.

Do not confuse request idempotency with business duplicate prevention.

---

## 11. Data Protection

The application handles children's personal information.

Implement:
- Secure authentication
- Server-side authorization
- Least-privilege access
- Input validation
- HTTPS
- Secure file uploads
- Appropriate logging
- Data access restrictions
- Backup and recovery planning

Do not expose registration records through public APIs.

Do not log sensitive personal information unnecessarily.

Privacy and retention policies must be finalized before production launch.

---

## 12. Code Quality Standards

- Use TypeScript strict mode.
- Prefer reusable, focused components.
- Separate UI, domain logic, and persistence.
- Avoid unnecessary dependencies.
- Validate inputs at trust boundaries.
- Use consistent naming.
- Handle loading, empty, error, and success states.
- Do not hardcode secrets.
- Do not commit real credentials or private keys.
- Keep code readable and maintainable.
- Avoid unnecessary abstraction.
- Do not leave critical functionality as TODO placeholders while claiming completion.

---

## 13. Development Workflow

For each feature:

1. Read relevant documentation.
2. Inspect existing implementation.
3. Identify dependencies.
4. Plan the change.
5. Implement the smallest coherent feature.
6. Add or update tests.
7. Run relevant checks.
8. Review authorization and data integrity.
9. Update TASKS.md.
10. Update MEMORY.md when durable project context changes.
11. Update CHANGELOG.md for meaningful implementation changes.
12. Summarize completed work and remaining limitations.

Do not claim a feature is complete unless it has been implemented and verified.

---

## 14. Testing Rules

Test:
- Public registration
- Intentional duplicate registrations
- Unique registration codes
- Registration immutability
- Department restrictions
- Shared volunteer sessions
- Search
- Card issuance
- Card reversal
- Companion-count updates
- Attendance calculations
- Soft delete and restore
- Excel export
- Account permissions
- Registration closing

Include concurrency and security tests for critical operations.

Never test destructive operations against real production registration data.

---

## 15. Documentation Maintenance

Keep these documents consistent:

- MEMORY.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATABASE_SCHEMA.md
- docs/RBAC.md
- TASKS.md
- docs/DECISIONS.md
- docs/CHANGELOG.md

Update documentation when implementation or approved requirements change.

Do not silently rewrite approved business requirements.

---

## 16. Working With Unresolved Requirements

When a requirement is TBD:

- Do not present assumptions as confirmed decisions.
- Prefer a configurable design where appropriate.
- Implement independent, approved work first.
- Ask only essential questions that block progress.
- Do not repeatedly question the user about already finalized decisions.

The user prefers minimal unnecessary questions.

---

## 17. Definition of Done

A feature is complete only when:

- Approved behavior is implemented.
- Authorization is enforced.
- Validation is present.
- Error states are handled.
- Relevant tests pass.
- Documentation is updated.
- No known critical regression remains.

---

## 18. Final Instruction

Build the BAPS Anandotsav 2026 system according to the approved PRD and finalized project decisions.

Never implement duplicate registration prevention.

Never compromise unique registration codes, role-based access, registration immutability, or card/attendance consistency.

Prioritize a reliable event-day experience.
