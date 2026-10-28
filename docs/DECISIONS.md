# Architecture & Product Decisions (ADR)

## BAPS Anandotsav 2026

---

### ADR-001: Explicit Allowance of Duplicate Registrations
- **Status:** Final & Approved
- **Context:** Previous assumptions assumed one registration per mobile phone. However, in community events, families frequently register multiple children under a single parent's phone, or repeated registrations occur.
- **Decision:** The system will **never** restrict, warn, or block registrations based on matching mobile numbers, child names, or personal details. Every intentional submission creates a unique registration record with a distinct sequential internal code.
- **Consequences:** Technical request idempotency is used only to prevent network retry duplicates. Duplicate prevention UI and mobile reservation logic are strictly forbidden.

---

### ADR-002: Internal Registration Code Sequences & Visibility
- **Status:** Final & Approved
- **Context:** Ground coordination requires tracking children via department-specific numbering.
- **Decision:** Separate atomic sequences `BAL-XXXX` and `BLK-XXXX` starting at `0001` (expanding beyond 4 digits when needed). Shared between online and on-the-spot registrations. Registration codes are internal operational identifiers and must **never** be shown to public users on success screens.
- **Consequences:** The code is generated in a server-side transaction and omitted from public API responses.

---

### ADR-003: Registration Immutability
- **Status:** Final & Approved
- **Context:** Preventing unauthorized or accidental modification of submitted registration records.
- **Decision:** Once submitted, child details (`firstName`, `fatherName`, `surname`, `mobileNumber`, `source`) are permanently immutable across all user roles, including Super Admin.
- **Consequences:** Only operational attributes (`cardStatus`, `accompanyingPersonsCount`, `isDeleted`) can be modified.

---

### ADR-004: Manual Dashboard Refresh
- **Status:** Final & Approved
- **Context:** Reducing unnecessary database read traffic and preventing UI flicker during high-concurrency event-day activity.
- **Decision:** The Admin Dashboard will fetch statistics upon initial load and refresh only when the user clicks the explicit "Refresh" button. No continuous real-time subscriptions for dashboard aggregates.
- **Consequences:** The UI will display a "Last Updated" timestamp to provide transparent data recency.

---

### ADR-005: Visual Design Segregation
- **Status:** Final & Approved
- **Context:** Different user personas have different usability requirements.
- **Decision:**
  - **Public Portal:** Modern, colorful, festive Claymorphic design.
  - **Volunteer Interface:** Fast, clean, mobile-first, high contrast, utility design. **NO Claymorphism.**
  - **Admin Interface:** Clean, data-focused, responsive table management. **NO Claymorphism.**
- **Consequences:** Ensures volunteers have zero distraction and optimal touch targets on mobile devices in sunlight, while public visitors enjoy a joyful visual experience.

---

### ADR-006: Production Load Testing Architecture & Telemetry
- **Status:** Final & Approved
- **Context:** Need to validate system scalability for 500+ registrations, concurrent volunteer search lookups, and transactional card issuances.
- **Decision:** Built a standalone Node.js test runner (`scripts/load_test_suite.js`) featuring dual client architecture: unauthenticated `publicDb` for online child registrations and authenticated `staffDb` for volunteer queries and card issuances. Supports 1-hour sustained pacing mode and burst stress mode.
- **Consequences:** Generates timestamped telemetry reports in `reports/` with operation-specific latencies (p50, p90, p95, p99), GET vs POST counts, and sequential code integrity verification. Built-in cleanup tool (`--cleanup`) purges test documents using Super Admin privileges.

