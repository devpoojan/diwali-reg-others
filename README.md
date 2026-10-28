# 🌸 BAPS Anandotsav & Bal Utsav — Turnkey Registration & Event System

> ### 📢 કોઈપણ નવા સેન્ટર / મંડળ માટે સંપૂર્ણ ગુજરાતી સેટઅપ ગાઈડ (SETUP GUIDE)
> 
> **નવા સેન્ટર માટે આખી સિસ્ટમ માત્ર ૧૦ મિનિટમાં કોઈપણ કોડિંગ વગર ચાલુ કરવા માટે:**  
> 👉 **[અહીં ક્લિક કરો: SETUP_GUIDE.md (સંપૂર્ણ ગુજરાતી સેટઅપ અને ડિપ્લોયમેન્ટ ગાઈડ)](./SETUP_GUIDE.md)**  
> 
> ⚡ **Turnkey Ready:** તમે `/setup` પર જઈને Setup Wizard ખોલી શકો છો. તમે તમારા સેન્ટરનું નામ, તારીખ, સમય, મંદિરનો લોગો અને ગુગલ ફાયરબેઝ કોઈપણ કોડ લખ્યા વગર સીધું સેટ કરી શકો છો!

---

[![React](https://img.shields.io/badge/React-19%2B-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A high-performance, cloud-native web application built for **BAPS Swaminarayan Sanstha** to manage large-scale public registrations, volunteer ground operations, physical game card issuance, attendance tracking, and administrative analytics.

---

## 📑 Table of Contents

- [🚀 Turnkey Setup Guide (ગુજરાતી માર્ગદર્શિકા)](#-નવા-સેન્ટર--મંડળ-માટે-સંપૂર્ણ-ગુજરાતી-સેટઅપ-ગાઈડ-setup-guide)
- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Festive Public Portal](#1-festive-public-portal)
  - [2. High-Speed Volunteer Station](#2-high-speed-volunteer-station)
  - [3. Card Printing & Batch Management](#3-card-printing--batch-management)
  - [4. Unified Admin Command Center](#4-unified-admin-command-center)
  - [5. Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
- [Non-Negotiable Business Rules](#-non-negotiable-business-rules)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Development Server](#development-server)
  - [Testing](#testing)
  - [Production Build](#production-build)
- [Firebase Deployment](#-firebase-deployment)
- [Event Schedule](#-event-schedule)
- [License & Credits](#-license--credits)

---

## 🌟 Overview

**BAPS Anandotsav 2026** is designed to handle thousands of registrations and coordinate 50+ concurrent volunteers across two primary centers:
- **Chandlodiya Sanskardham** (Saturday, 31/10/2026)
- **Vadaj Sanskardham** (Sunday, 01/11/2026)

The system supports two distinct departments:
- **BAL** (Bal Vibhag — Boys)
- **BLK** (Balika Vibhag — Girls)

---

## ✨ Key Features

### 1. Festive Public Portal
- **Claymorphic UI Aesthetic**: Soft 3D card elevation, vibrant pastel gradients, celebratory confetti effects, and micro-animations.
- **Dedicated Center Landing Portals**:
  - `/chandlodiya` (alias `/c`): Complete center schedule, Google Maps link, and direct registration.
  - `/vadaj` (alias `/v`): Center schedule, map directions, and dedicated registration flow.
- **Minimal Root Gateway (`/`)**: Clean, distraction-free landing screen showing official Anandotsav logo and immediate center selection.
- **Sequential Registration Engine**:
  - `Area Selection` ➜ `Department Selection` ➜ `Child Details` ➜ `Mandatory Review & Confirm`.
  - **Structured Address Fields**: House/Flat number and Society/Apartment name inputs with center-specific area chips:
    - **Vadaj**: Vadaj, Nirnayanagar, Other.
    - **Chandlodiya**: Chandlodiya, Ognaj, Tragad, Other.
  - **Strict English Validation**: Real-time badge warnings and prevention of non-English script entry (`A–Z, 0–9` characters only).
- **Instant Child ID Celebration Screen (`/success`)**:
  - Displays internal registration code (`BAL-1001`, `BLK-0001`, etc.) for parents to screenshot.
  - **1-Click WhatsApp Invitation Generator**: Pre-formatted Gujarati invitation text customized per center with emojis, event timings, map link, and registration URL.

### 2. High-Speed Volunteer Station
- **Mobile-First Touch Ergonomics**: Specifically engineered for smartphones and tablets held by ground volunteers at event entrance gates.
- **Instant Search-as-You-Type**: Debounced search across child name, mobile number, and unique registration ID with partition routing for sub-50ms query response.
- **Atomic Physical Card Issuance**:
  - Single-tap card issue action.
  - Prompt for accompanying person count (parents/guardians).
  - Atomic Firestore commit with automatic reversal capability (`ISSUED` ➜ `NOT_ISSUED`).
- **Quick On-the-Spot Registration**: Form optimized for quick walk-in registrations on event day.

### 3. Card Printing & Batch Management
- **Pre-Event Physical Card Preparation (`/admin/printing`)**:
  - Track high-volume card distribution cutoff limits (`chandlodiyaBalCutoff`, `vadajBlkCutoff`, etc.).
  - Instant indicator of which cards are printed vs. unprinted.
  - Print-ready card sheets with QR/Barcode, child name, mobile, and registration code.

### 4. Unified Admin Command Center
- **Data-Driven Dashboard (`/admin`)**:
  - Manual on-demand refresh with timestamp tracking.
  - Real-time KPI summaries: Total Registrations, Active Cards Issued, Accompanying Persons, Total Ground Attendance.
  - Live Prasad & Refreshment projections calculated atomically from attendance tallies.
  - Center & Department breakdowns with comparative progress bars.
- **Registrations Manager**:
  - Filter by Center, Department, Status (`ISSUED`, `NOT_ISSUED`), and Soft-deleted records.
  - Multi-child bulk selection and bulk card issuance.
  - Sibling & Family Helpdesk lookup.
  - 1-Click Excel (.xlsx) export with complete details (Address, Society, Area, Mobile, etc.).
- **Global Event Settings & Live Broadcast**:
  - Toggle Public Online Registration and On-the-Spot Registration independently.
  - Push emergency or celebratory banner broadcasts across all public pages in real time.

### 5. Role-Based Access Control (RBAC)
Server-enforced authorization rules protecting child data:

| Role | Department Scope | Permissions |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | BOTH | Full system administration, manage Admins, global system configuration |
| **ADMIN** | BOTH | Manage Coordinators & Volunteer accounts, export Excel, manage event settings |
| **COORDINATOR** | BAL / BLK / BOTH | Operational management, soft-delete and restore registrations |
| **VOLUNTEER** | BAL / BLK | Fast search, quick registration, card issuance & reversal, edit companions |

---

## ⚖️ Non-Negotiable Business Rules

1. **Duplicate Registrations Allowed**:
   - The system intentionally allows multiple registrations with the same mobile number or identical child names (e.g., siblings or parents registering again).
   - No uniqueness constraints block intentional repeated submissions.
2. **Atomic Unique Registration Codes**:
   - Internal sequential codes generated transactionally:
     - **Vadaj**: `BAL-0001` upwards, `BLK-0001` upwards.
     - **Chandlodiya**: `BAL-1001` upwards, `BLK-1001` upwards.
   - Code sequences never overlap and are never reused.
3. **Registration Immutability**:
   - Once submitted through the mandatory Review & Confirm step, the child's identity details are strictly read-only.
4. **Attendance Calculation**:
   - $\text{Total Attendance} = \text{Active Cards Issued (Children)} + \sum(\text{Accompanying Persons})$.
5. **Soft Deletion Only**:
   - Deleted registrations are never purged from Firestore; they are soft-deleted, excluded from active analytics, and restorable by Coordinators and Admins.

---

## 🏛️ System Architecture

```
                                  CLIENT LAYER
    ┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
    │      Public Portal      │    Volunteer Station    │    Admin Command Center │
    │   (Claymorphism UI)     │   (Mobile-First Fast)   │   (Data-Dense Clean UI) │
    └─────────────────────────┴─────────────────────────┴─────────────────────────┘
                                           │
                                 Vite + React SPA (TS)
                                           │ HTTPS / WSS
    ┌──────────────────────────────────────┴──────────────────────────────────────┐
    │                               SERVICES LAYER                                │
    │  • Firebase Authentication (Custom Claims: role, departmentAccess)          │
    │  • Registration Service (Atomic transactions & collection partitioning)     │
    │  • Card Printing Service (Cutoff tracking & batching)                       │
    │  • Event Settings Service (Real-time onSnapshot synchronization)            │
    └──────────────────────────────────────┬──────────────────────────────────────┘
                                           │
    ┌──────────────────────────────────────┴──────────────────────────────────────┐
    │                                 DATA LAYER                                  │
    │  • Google Cloud Firestore:                                                  │
    │    ├── /chandlodiya/{id}       (Chandlodiya Partition)                      │
    │    ├── /vadaj/{id}             (Vadaj Partition)                            │
    │    ├── /users/{uid}            (Staff & RBAC Accounts)                      │
    │    ├── /eventSettings/current  (Global Configuration & Broadcast)           │
    │    └── /printSettings/current  (Card Printing Cutoffs)                      │
    │  • Firebase Hosting (CDN Global Edge Distribution)                          │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend Core:** React 19 / 18, TypeScript (Strict Mode)
- **Build Tool:** Vite 8.3
- **CSS & Styling:** Tailwind CSS 3.4, PostCSS, Autoprefixer
- **UI Components & Icons:** Lucide React, Canvas Confetti
- **Animation:** Motion (Framer Motion)
- **Database & Auth:** Firebase Web SDK 12, Google Cloud Firestore, Firebase Authentication
- **Excel Export:** SheetJS (`xlsx`)
- **Testing:** Vitest, Testing Library

---

## 📁 Repository Structure

```
diwali/
├── docs/                      # Architectural & Product Specifications
│   ├── ARCHITECTURE.md        # Comprehensive Architecture Specification
│   ├── DATABASE_SCHEMA.md     # Firestore Collections & Index Architecture
│   ├── PRD.md                 # Product Requirements Document
│   ├── RBAC.md                # Role-Based Access Control Spec
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   ├── LOAD_TESTING_GUIDE.md  # High-Concurrency Load Testing Manual
│   └── CHANGELOG.md           # Detailed Version & Feature History
├── public/                    # Static Assets (Logos, Icons, Posters)
├── scripts/                   # Database Seeding, Benchmarks & Load Tests
├── src/
│   ├── components/            # Reusable Modular UI Components
│   │   ├── auth/              # Protected Route & Permission Guards
│   │   ├── public/            # Public Navbar & Shared Layouts
│   │   └── staff/             # Admin & Volunteer Navigation Layouts
│   ├── context/               # Global Context Providers (Auth, Language)
│   ├── lib/                   # Firebase Initialization & Client Config
│   ├── pages/                 # Application Route Pages
│   │   ├── admin/             # Dashboard, Registrations, Printing, Staff
│   │   ├── auth/              # Staff & Volunteer Login Screen
│   │   ├── public/            # Home, Center Landing, Register, Success
│   │   └── volunteer/         # Volunteer Search & Quick Register
│   ├── services/              # Business Domain Logic & Firestore Queries
│   ├── tests/                 # Unit & Integration Tests (Vitest)
│   ├── types/                 # TypeScript Domain Interfaces & Enums
│   ├── App.tsx                # Client Routing Configuration
│   ├── main.tsx               # Application Entry Point
│   └── index.css              # Global Design System & Utility Styles
├── firebase.json              # Firebase Hosting & Firestore Config
├── firestore.indexes.json     # Firestore Composite Indexes
├── firestore.rules            # Firestore Security & Permission Rules
├── package.json               # Project Dependencies & Scripts
├── tailwind.config.js         # Tailwind Design Tokens
└── vite.config.ts             # Vite Bundler Setup & Path Aliases
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher recommended
- **npm**: `v10.x` or higher
- **Firebase CLI**: `npm install -g firebase-tools`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/devpoojan/diwali-utsav.git
   cd diwali-utsav
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` or `.env.local` file in the root directory with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development Server

Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Testing

Run the Vitest test suite:
```bash
npm test -- --run
```

### Production Build

Create an optimized production bundle:
```bash
npm run build
```
Built assets are output to the `dist/` directory.

---

## ☁️ Firebase Deployment

### Deploy Hosting Only
```bash
npm run build
npx firebase deploy --only hosting
```

### Deploy Firestore Security Rules & Indexes
```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📅 Event Schedule

| Center | Date | Day | Time | Venue |
| :--- | :--- | :--- | :--- | :--- |
| **ચાંદલોડિયા (Chandlodiya)** | 31/10/2026 | Saturday (શનિવાર) | 5:00 PM – 8:00 PM | BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, ચાંદલોડિયા |
| **વાડજ (Vadaj)** | 01/11/2026 | Sunday (રવિવાર) | 5:00 PM – 8:00 PM | BAPS શ્રી સ્વામિનારાયણ સંસ્કારધામ, વાડજ |

---

## 📜 License & Credits

- **Organization:** BAPS Swaminarayan Sanstha
- **Department:** BAPS Bal Pravrutti, Ahmedabad-15 & Ahmedabad-19
- **Project:** Anandotsav 2026
- **Lead Developer:** Poojan Chauhan ([@devpoojan](https://github.com/devpoojan))
