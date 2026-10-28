# 🌸 BAPS Children Festival & Anandotsav — Event Management System

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

A high-performance, cloud-native web application built for **BAPS Swaminarayan Sanstha** to manage large-scale public registrations, volunteer ground operations, physical game card issuance, attendance tracking, and administrative analytics for Children and Youth Festivals.

---

## 📑 Table of Contents

- [🚀 Turnkey Setup Guide (ગુજરાતી માર્ગદર્શિકા)](#-કોઈપણ-નવા-સેન્ટર--મંડળ-માટે-સંપૂર્ણ-ગુજરાતી-સેટઅપ-ગાઈડ-setup-guide)
- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Festive Public Portal](#1-festive-public-portal)
  - [2. High-Speed Volunteer Station](#2-high-speed-volunteer-station)
  - [3. Card Printing & Pre-Printed Box Management](#3-card-printing--pre-printed-box-management)
  - [4. Unified Admin Command Center](#4-unified-admin-command-center)
  - [5. Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
- [Core Business Rules](#-core-business-rules)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Firebase Deployment](#-firebase-deployment)
- [License & Credits](#-license--credits)

---

## 🌟 Overview

This system is engineered to handle thousands of family registrations and coordinate 50+ concurrent ground volunteers across multiple festival centers and venues.

The system supports two departments:
- **BAL** (Bal Vibhag — Boys)
- **BLK** (Balika Vibhag — Girls)

All centers, festival dates, timings, venues, code prefixes, and logos are **100% dynamically configurable** through the built-in Setup Wizard (`/setup`) or Admin Command Center.

---

## ✨ Key Features

### 1. Festive Public Portal
- **Claymorphic UI Aesthetic**: Soft 3D cards, vibrant pastel gradients, celebratory confetti effects, and micro-animations designed for festive events.
- **Dynamic Center Selector**: Automatically displays all configured celebration centers with dates, timings, and venues.
- **Fast 3-Step Registration**:
  - `Center Selection` ➜ `Department Selection` ➜ `Child & Parent Details`.
- **Celebration Success Screen**:
  - Displays internal registration code (e.g. `C-1`, `V-1`, `B-1`) for parents to screenshot.
  - **1-Click WhatsApp Invitation Generator**: Pre-formatted WhatsApp invitation text customized per center with emojis, timings, and map directions.

### 2. High-Speed Volunteer Station
- **Mobile-First Touch Ergonomics**: Specifically engineered for smartphones and tablets held by ground volunteers at entrance gates.
- **Zero-Modal Direct Card Issuance**: 
  - Instant debounced search across child name, mobile number, or registration code.
  - Inline companion selector chips (`0 (Child Only)`, `+1`, `+2`, `+3`, `+4`).
  - 1-tap `⚡ Issue Card` button directly on the search card with sub-second response.
- **Quick On-the-Spot Registration**: Streamlined 30-second form for walk-in families on festival day.

### 3. Card Printing & Pre-Printed Box Management
- **Pre-Event Card Preparation (`/admin/printing`)**:
  - Track card distribution cutoff limits per center.
  - Clear guidance for ground volunteers:
    - 🖨️ **Box Cards**: Find pre-printed card in physical numbered box.
    - ✍️ **Blank Cards**: Write registration code and name on manual blank card.

### 4. Unified Admin Command Center
- **Real-Time KPI Dashboard (`/admin`)**:
  - On-demand refresh with timestamp tracking.
  - Real-time summaries: Total Registrations, Active Cards Issued (Children Present), Accompanying Persons Present, and Total Ground Attendance.
  - Live Prasad & refreshment projections calculated atomically from attendance tallies.
  - Center and department breakdowns with comparative progress bars.
- **Registrations Manager (`/admin/registrations`)**:
  - Filter by Center, Department, Card Status (`ISSUED`, `NOT_ISSUED`), and soft-deleted records.
  - Sibling and family helpdesk lookup.
  - **Universal Excel Export**: Single or multi-area exports with option to create dedicated worksheet tabs per area (`1 Tab Per Area`) or department splits.
- **Area-Wise Distribution Report (`/admin/area-report`)**:
  - Locality share breakdown, distribution charts, and direct contact actions.

### 5. Role-Based Access Control (RBAC)
Server-enforced authorization rules protecting child data:

| Role | Department Scope | Permissions |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | BOTH | Full system administration, manage Admins, global system configuration |
| **ADMIN** | BOTH | Manage Coordinators & Volunteer accounts, export Excel, manage event settings |
| **COORDINATOR** | BAL / BLK / BOTH | Operational management, soft-delete and restore registrations |
| **VOLUNTEER** | BAL / BLK | Fast search, quick registration, card issuance & reversal, edit companions |

---

## ⚖️ Core Business Rules

1. **Duplicate Registrations Allowed**:
   - The system allows multiple registrations with the same mobile number or identical child names (e.g. siblings or repeated registrations).
   - No uniqueness constraints block intentional repeated submissions.
2. **Unique Registration Codes**:
   - Sequential center-prefixed non-padded numbers (e.g. `C-1`, `V-1`, `B-1` upwards).
   - Sequences never overlap and are never reused.
3. **Registration Immutability**:
   - Once submitted, personal details are read-only to preserve registration integrity.
4. **Attendance Calculation**:
   - $\text{Total Attendance} = \text{Active Cards Issued (Children)} + \sum(\text{Accompanying Persons})$.
5. **Soft Deletion Only**:
   - Deleted registrations are never purged; they remain stored, excluded from active statistics, and restorable by Coordinators and Admins.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 19, TypeScript (Strict Mode)
- **Build Tool:** Vite 8.3
- **CSS & Styling:** Tailwind CSS 3.4, PostCSS, Autoprefixer
- **UI Components & Icons:** Lucide React, Canvas Confetti
- **Animation:** Motion (Framer Motion)
- **Database & Auth:** Google Cloud Firestore (Mumbai `asia-south1`), Firebase Authentication
- **Excel Export:** SheetJS (`xlsx`)
- **Testing:** Vitest (65 Unit & Service Tests passing)

---

## 📁 Repository Structure

```
diwali/
├── docs/                      # Architectural & Product Specifications
│   ├── ARCHITECTURE.md        # Architecture Specification
│   ├── DATABASE_SCHEMA.md     # Firestore Collections & Index Architecture
│   ├── PRD.md                 # Product Requirements Document
│   ├── RBAC.md                # Role-Based Access Control Spec
│   └── CHANGELOG.md           # Detailed Version & Feature History
├── public/                    # Static Assets (Logos, Icons)
├── scripts/                   # Database Seeding & Verification Scripts
├── src/
│   ├── components/            # Reusable Modular UI Components
│   │   ├── admin/             # Excel Export Modal & Admin Tools
│   │   ├── auth/              # Protected Route & Permission Guards
│   │   ├── public/            # Public Navbar & Shared Layouts
│   │   └── staff/             # Admin & Volunteer Navigation Layouts
│   ├── context/               # Global Context Providers (Auth, Language)
│   ├── lib/                   # Firebase Initialization & Client Config
│   ├── pages/                 # Application Route Pages
│   │   ├── admin/             # Dashboard, Registrations, Printing, Area Report
│   │   ├── auth/              # Staff & Volunteer Login Screen
│   │   ├── public/            # Home, Register, Success
│   │   ├── setup/             # Turnkey Event Setup Wizard (Gujarati)
│   │   └── volunteer/         # Volunteer Search & Quick Register
│   ├── services/              # Business Domain Logic & Firestore Queries
│   ├── tests/                 # Unit & Integration Tests (Vitest)
│   └── types/                 # TypeScript Domain Interfaces & Enums
├── SETUP_GUIDE.md             # Complete Step-by-Step Guide in Gujarati
├── LICENSE                    # MIT License
├── firebase.json              # Firebase Hosting & Firestore Config
├── package.json               # Project Dependencies & Scripts
└── vite.config.ts             # Vite Bundler Setup & Path Aliases
```

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/devpoojan/diwali-reg-others.git
cd diwali-reg-others
npm install
npm run dev
```

### 2. Configure Your Event
Open your browser at [http://localhost:5173/setup](http://localhost:5173/setup) to run the visual Setup Wizard:
- Connect your free Google Firebase project.
- Upload your mandal logo and event title.
- Configure your celebration centers, dates, and code prefixes.

### 3. Testing
```bash
npm test
```

### 4. Production Build
```bash
npm run build
```

---

## ☁️ Firebase Deployment

Deploy for free to Firebase Hosting:

```bash
# 1. Login to Firebase CLI
npx firebase login

# 2. Connect your Firebase project
npx firebase use --add

# 3. Build & Deploy
npm run deploy
```

---

## 📜 License & Credits

- **License:** [MIT License](./LICENSE)
- **Organization:** BAPS Swaminarayan Sanstha & Contributors
- **Lead Developer:** Poojan Chauhan ([@devpoojan](https://github.com/devpoojan))
