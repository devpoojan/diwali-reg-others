# BAPS Anandotsav 2026 — Comprehensive Load Testing Guide

**Document Version:** 1.0  
**Project:** BAPS Anandotsav 2026 Registration & Event Management System  
**Firebase Project:** \`diwali-test-3ab6c\`  
**Target Scenario:** 500 Registrations with Concurrent Volunteer Searches & Card Issuances (1-Hour Sustained or Burst Stress Test)

---

## 1. Executive Summary & Purpose

During BAPS Anandotsav 2026, the application will experience two simultaneous traffic streams:
1. **Public Web Registrations:** Hundreds of parents registering their children online before and during the event.
2. **Ground Volunteer Operations:** 20–50 concurrent volunteers on mobile devices searching children by name/mobile/code, issuing physical games cards, entering accompanying companion counts, and doing on-the-spot walk-ins.

This guide and the companion automated test runner (\`scripts/load_test_suite.js\`) provide an enterprise-grade load testing methodology to validate:
- **Zero Race Conditions:** Verifying that atomic counters generate 100% unique registration codes without duplicate collisions or sequence gaps under concurrent transactions.
- **Search-as-you-type Responsiveness:** Validating that multi-token name searches, mobile searches, and code lookups resolve in under **150–250ms**.
- **Real-Time Attendance Consistency:** Verifying that simultaneous card issuances atomically increment attendance statistics without dropping companion counts.
- **Telemetry & Reporting:** Producing detailed performance metrics including total hits, GET (reads) vs POST (writes), latency distributions (p50, p90, p95, p99), and throughput (RPS).

---

## 2. Load Testing Architecture

```
                                  [ LOAD TEST ENGINE ]
                               (scripts/load_test_suite.js)
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
        [ STREAM 1: PUBLIC ]                           [ STREAM 2: VOLUNTEERS ]
        500 Registrations                              Concurrent Hits & Operations
     (POST / Firestore Trans)                                      |
                   |                             +-----------------+-----------------+
                   |                             |                                   |
                   v                             v                                   v
        - Atomic Counter Read             - Search-as-you-type                 - Card Issuance
        - Sequence Allocation               (GET / Query Reads)              (POST / Update Writes)
        - /chandlodiya & /vadaj           - Name prefix search                - Status: ISSUED
        - /registrations dual sync        - Mobile number search              - Accompanying count: 0–3
        - /statistics increments          - Code prefix search                - Attendance updates
                   |                             |                                   |
                   +-----------------------------+-----------------------------------+
                                                 |
                                                 v
                                  [ LIVE CLOUD FIRESTORE ]
                                  (diwali-test-3ab6c.app)
                                                 |
                                                 v
                                  [ TELEMETRY & REPORT GENERATOR ]
                                  - /reports/load_test_report_*.md
                                  - /reports/load_test_report_*.json
```

---

## 3. Automated Test Suite Features (\`scripts/load_test_suite.js\`)

The test suite in [\`scripts/load_test_suite.js\`](file:///Users/poojanchauhan/Projects/diwali/scripts/load_test_suite.js) includes:

1. **Authentic Gujarati & Indian Name Generation:**
   - 35+ Bal (boys) names: *Aarav, Vihaan, Shlok, Het, Dhairya, Tirth, Param, Dev, Krutarth...*
   - 25+ Balika (girls) names: *Diya, Ananya, Krisha, Prisha, Aarya, Mahi, Jiya, Dhriti, Riya...*
   - Real father names & Gujarati surnames: *Patel, Shah, Joshi, Dave, Bhatt, Chauhan, Vaghela...*
   - Formatted English letters (A–Z) conforming to Section 8 form validation rules.
2. **Realistic Center & Department Distribution:**
   - Random balanced distribution across **Chandlodiya** (Series starting \`1001+\`) and **Vadaj** (Series starting \`0001+\`).
   - Balanced distribution between **BAL** and **BLK** departments.
3. **Telemetry Tracking & Percentiles:**
   - Operation categorization: \`POST_REGISTRATION\`, \`GET_VOLUNTEER_SEARCH\`, \`POST_CARD_ISSUE\`.
   - Latencies recorded at sub-millisecond precision with \`performance.now()\`.
   - Percentile calculation: **Min, Average, p50 (Median), p90, p95, p99, and Max**.
4. **Sequence Integrity Audit:**
   - Automatically cross-checks all allocated registration codes for 100% mathematical uniqueness (Zero Duplicates Guarantee).
5. **Report Artifacts:**
   - Automatically writes a formatted Markdown summary and a raw JSON dataset to \`reports/\`.

---

## 4. How to Run the Load Test

### Prerequisite
Ensure dependencies are installed and you are in the project root directory:
```bash
cd /Users/poojanchauhan/Projects/diwali
```

---

### Option A: 1-Hour Sustained Pacing Mode (User Target)
This mode distributes 500 registrations evenly across **60 minutes** (1 registration every ~7.2 seconds), simulating realistic sustained program traffic with concurrent volunteer search hits and card issuances.

```bash
node scripts/load_test_suite.js --mode=1hour --count=500
```

> **Tip:** You can cancel at any time with `Ctrl+C`. The script will gracefully summarize the progress and metrics collected up to that point.

---

### Option B: High-Throughput Burst Stress Test (Fast Verification)
This mode executes 500 registrations in concurrent batches (default 10 parallel workers). It completes in **2–4 minutes** and stress-tests Firestore transaction contention and locking.

```bash
# 500 registrations with 10 concurrent workers
node scripts/load_test_suite.js --mode=burst --count=500 --concurrency=10

# High-concurrency stress test (25 concurrent workers)
node scripts/load_test_suite.js --mode=burst --count=500 --concurrency=25
```

---

### Option C: Quick Pilot / Smoke Test (50 Registrations)
Recommended before running a full 500-request test to verify network connectivity and rule permissions:

```bash
node scripts/load_test_suite.js --mode=burst --count=50
```

---

### Option D: Dry-Run Mode (Simulation Without Database Writes)
Validates test suite execution, timing logic, and report generation without performing actual Firestore writes:

```bash
node scripts/load_test_suite.js --dry-run --count=500
```

---

## 5. Command-Line Options Reference

| Flag | Default | Description |
| :--- | :---: | :--- |
| `--count=<N>` | `500` | Number of child registrations to create. |
| `--mode=<burst\|1hour>` | `burst` | `burst` runs concurrent parallel batches; `1hour` paces evenly over 60 mins. |
| `--concurrency=<N>` | `10` | Parallel workers running concurrently in `burst` mode. |
| `--search-ratio=<0.0-1.0>` | `0.5` | Ratio of volunteer search queries triggered per registration (0.5 = 50%). |
| `--issue-ratio=<0.0-1.0>` | `0.3` | Ratio of physical card issuances triggered per registration (0.3 = 30%). |
| `--dry-run` | `false` | Simulates load without performing network writes to Firestore. |
| `--cleanup` | `false` | Purges all documents created by load testing (`isLoadTest == true`). |

---

## 6. Understanding the Generated Telemetry Report

Each load test run generates a timestamped report in the \`reports/\` directory:
- Markdown summary: \`reports/load_test_report_<TIMESTAMP>.md\`
- Telemetry JSON: \`reports/load_test_report_<TIMESTAMP>.json\`

### Sample Report Format:
```markdown
# BAPS Anandotsav 2026 — Load Test Report

**Execution Timestamp:** 2026-10-19T07:45:00.000Z  
**Target Registrations:** 500  
**Execution Mode:** `BURST`  
**Concurrency Workers:** 10  
**Total Duration:** 142.60 seconds  
**Throughput (RPS):** 6.31 requests/second  
**Status:** ✅ PASSED (100% Reliability)

---

## 1. Executive Operations Summary

| Operation Category | HTTP Method | Total Hits | Success Rate | p50 (Median) | p90 | p95 | p99 | Max Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Child Registration** | `POST (Write)` | 500 | 100.0% | 185 ms | 240 ms | 280 ms | 360 ms | 420 ms |
| **Volunteer Search** | `GET (Read Query)` | 248 | 100.0% | 62 ms | 95 ms | 120 ms | 165 ms | 210 ms |
| **Card Issuance** | `POST (Update)` | 152 | 100.0% | 140 ms | 195 ms | 225 ms | 290 ms | 330 ms |
| **OVERALL TOTAL** | **ALL HITS** | **900** | **100.0%** | **152 ms** | **220 ms** | **265 ms** | **340 ms** | **420 ms** |

---

## 2. Integrity & Concurrency Verification

| Audit Checkpoint | Expected Condition | Actual Result | Status |
| :--- | :--- | :--- | :---: |
| **Registration Code Uniqueness** | Zero duplicate allocated codes | 500 unique of 500 | ✅ PASSED |
| **Sequential Base Partitioning** | Chandlodiya starting 1001+, Vadaj starting 0001+ | Partitioned per center | ✅ PASSED |
| **Firestore Transaction Contention** | Idempotent atomic sequence increments | 0 unhandled retries | ✅ PASSED |
| **Search-as-you-type Performance** | Debounced prefix queries < 250ms p95 | 120 ms | ✅ PASSED |
```

### Key Performance Thresholds:
- **Registration \`POST\` Latency (p50):** Under **250ms** is exceptional; under **500ms** is production-healthy.
- **Search \`GET\` Latency (p95):** Under **200ms** provides instantaneous search-as-you-type experience for volunteers.
- **Success Rate:** Must be **100.0%** (zero uncaught exceptions).
- **Code Uniqueness:** Must be **100%** unique (e.g., 500 unique codes for 500 records).

---

## 7. Real-Time Monitoring in Google Cloud Console & Firebase

While the load test runs, you can monitor live graphs directly in the cloud console:

### A. Firebase Console
1. Open the [Firebase Console diwali-test-3ab6c](https://console.firebase.google.com/project/diwali-test-3ab6c/overview).
2. Go to **Build** $\rightarrow$ **Firestore Database** $\rightarrow$ **Usage** tab.
3. Observe:
   - **Document Reads:** Spikes during volunteer search hits.
   - **Document Writes:** Spikes during child registrations and card issuances.
   - **Active Connections:** Number of active clients connected.

### B. Google Cloud Console (Cloud Monitoring)
1. Open [Google Cloud Console Monitoring](https://console.cloud.google.com/monitoring).
2. Select project: `diwali-test-3ab6c`.
3. Navigate to **Dashboards** $\rightarrow$ **Cloud Firestore**.
4. Key metrics to inspect:
   - **`document/read_count`**: Read rate per second.
   - **`document/write_count`**: Write rate per second.
   - **`server/response_latencies`**: Server-side request processing latency.

---

## 8. Data Teardown & Database Reset

After finishing load testing, you should clean up test data so that the database returns to a pristine production state.

### Option 1: Fast Cleanup of Load Test Records Only
The test suite tags every generated record with `isLoadTest: true`. Run the built-in cleanup tool:
```bash
node scripts/load_test_suite.js --cleanup
```
This scans `/chandlodiya`, `/vadaj`, and `/registrations` in batches of 400 and deletes all test records without touching real data.

---

### Option 2: Full Database Reset to Production Zero Baseline
If you want to completely wipe all records and reset atomic counters to their official starting positions:
```bash
node scripts/reset_and_setup_database.js
```
This resets:
- **Chandlodiya Counter:** `1000` (First real registration code will be `BAL-1001` / `BLK-1001`)
- **Vadaj Counter:** `0` (First real registration code will be `BAL-0001` / `BLK-0001`)
- **Statistics Documents:** All 6 documents zeroed out (`BAL`, `BLK`, `CHANDLODIYA_BAL`, `CHANDLODIYA_BLK`, `VADAJ_BAL`, `VADAJ_BLK`)
- **Staff Accounts:** All 6 verified with password `Anandotsav@2026`.

---

## 9. Summary Command Quick-Sheet

```bash
# 1. Pilot Smoke Test (50 Registrations)
node scripts/load_test_suite.js --mode=burst --count=50

# 2. Burst Stress Test (500 Registrations with 15 concurrent workers)
node scripts/load_test_suite.js --mode=burst --count=500 --concurrency=15

# 3. 1-Hour Sustained Test (500 Registrations paced over 60 minutes)
node scripts/load_test_suite.js --mode=1hour --count=500

# 4. View Generated Reports
ls -la reports/
cat reports/load_test_report_*.md

# 5. Clean up load test records
node scripts/load_test_suite.js --cleanup
```
