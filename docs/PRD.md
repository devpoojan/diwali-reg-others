# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## BAPS Anandotsav 2026

### Public Registration, Volunteer Operations & Event Management System

Document Version: 2.0 Document Date: October 17, 2026 Document Status: Requirements Baseline — Pending Fields Identified Product Type: Responsive Web Application Primary Language: English Proposed Technology: React, TypeScript, Firebase & Google Cloud Deployment Model: Online-Only, Cloud-Hosted

## 1. Executive Summary

### 1.1 Product Overview

BAPS Anandotsav 2026 requires a centralized, secure, responsive web-based management system for managing children's event registrations, on-site registration, physical games-card distribution, attendance estimation, volunteer operations, and administrative activities.

The system will support two distinct registration categories:

- BAL: Bal Vibhag
- BLK: Balika Vibhag

Parents and guardians will register children through a public-facing website. On the event day, volunteers will search for registered children, verify their details, distribute physical games cards, and record the number of accompanying people.

Administrators and coordinators will manage event operations through dedicated management interfaces.

The system must prioritize speed, usability, reliability, and accurate operational reporting, particularly during peak event-day activity.

### 1.2 Core Product Principles

1. Fast event-day operations: Volunteers should be able to find children and issue cards with minimal steps.
2. Simple public registration: Parents should encounter a clear, mobile-friendly registration process.
3. Separate BAL and BLK operations: Staff access and registration numbering must respect departmental boundaries.
4. Unique registration identifiers: Every successful registration must receive a unique internal registration number.
5. Duplicate registrations are allowed: The system must not prevent or warn about repeated names, mobile numbers, or children.
6. Immutable submitted information: Registration details cannot be edited after final submission.
7. Operational flexibility: Card status and accompanying-person counts can be updated.
8. Role-based access: Every staff role receives only its authorized capabilities.
9. Centralized administration: Event content, accounts, registration availability, and reports are managed through the system.
10. Online-only operation: All operational transactions require an internet connection.

### 1.3 Expected Operating Scale

| Metric                       | Planning Requirement                      |
| ---------------------------- | ----------------------------------------- |
| Initial registration volume  | Approximately 1,000+ children             |
| Concurrent volunteers        | Approximately 20–50                       |
| Peak-load validation target  | 100 concurrent users                      |
| Stress-test target           | 200 concurrent users                      |
| Registration categories      | BAL and BLK                               |
| Public registration          | No account required                       |
| Volunteer access             | Two shared team accounts                  |
| Admin and coordinator access | Individual accounts                       |
| Internet requirement         | Mandatory                                 |
| Primary devices              | Mobile phones, tablets, laptops, desktops |

These figures are planning targets rather than hard registration limits.

# 2. Product Scope

## 2.1 In-Scope Capabilities

The product will provide:

1. Public event-information website.
2. Public BAL and BLK registration.
3. Registration review and confirmation.
4. Unique internal registration number generation.
5. Registration availability controls.
6. Automatic public registration closing.
7. Volunteer authentication.
8. Volunteer child search.
9. Volunteer quick registration.
10. Physical card issuance tracking.
11. Card issuance reversal.
12. Accompanying-person count management.
13. Card-based attendance estimation.
14. Coordinator management.
15. Admin and Super Admin dashboards.
16. Registration browsing and filtering.
17. Registration soft deletion and restoration.
18. Excel exports.
19. Event content and media management.
20. Staff account management.
21. Department-based authorization.
22. Security controls and monitoring.
23. Responsive web interfaces.
24. Testing and deployment infrastructure.

## 2.2 Out-of-Scope Capabilities

The following are not required for the initial release:

- Native Android application.
- Native iOS application.
- Offline functionality.
- Offline data synchronization.
- SMS registration confirmation.
- WhatsApp registration confirmation.
- Public registration accounts.
- Public registration-number recovery.
- Editing submitted registration details.
- QR scanning to issue cards.
- Physical QR card ID linking.
- Automatic physical card printing.
- Individual volunteer activity attribution.
- Automated real-time dashboard refresh.
- Physical exit tracking.
- PDF registration export.
- Duplicate registration detection or prevention.

The physical cards may contain QR codes, but scanning or linking those QR codes to individual registrations is not part of the confirmed workflow.

# 3. User Roles and Permission Model

## 3.1 User Categories

The system will have five user categories:

| Role        | Account Model     | Primary Responsibility                              |
| ----------- | ----------------- | --------------------------------------------------- |
| Public      | No login          | Child registration and event information            |
| Volunteer   | Shared team login | Child search, quick registration, card distribution |
| Coordinator | Individual login  | Assigned department operations                      |
| Admin       | Individual login  | Event and system operations                         |
| Super Admin | Individual login  | Complete administration                             |

## 3.2 Role Hierarchy

```
SUPER ADMIN
    |
    +-- ADMIN
           |
           +-- COORDINATOR
                  |
                  +-- VOLUNTEER

PUBLIC REGISTRATION
    |
    +-- No staff account required
```

This hierarchy represents administrative authority. Every actual permission must be enforced explicitly by the backend.

## 3.3 Super Admin Requirements

The Super Admin is the highest-authority user.

### Functional permissions

The Super Admin can:

- Access every management module.
- View BAL and BLK registrations.
- View all dashboard statistics.
- Create Admin accounts.
- Enable and disable Admin accounts.
- Manage Admin access.
- Create and manage Coordinator accounts.
- Configure Coordinator department access.
- Manage BAL and BLK volunteer shared accounts.
- Change shared account credentials.
- Configure registration availability.
- Edit event details.
- Upload event media.
- Search and view registrations.
- Soft-delete registrations.
- Restore deleted registrations.
- Issue or reverse cards when using an authorized operational interface.
- Update accompanying-person counts.
- Export authorized data to Excel.
- Manage global system configuration.

### Restrictions

Even the Super Admin cannot edit the original details of a registration after final submission.

## 3.4 Admin Requirements

Admins manage the event's operational activities.

### Functional permissions

Admins can:

- Access the Admin Dashboard.
- View both BAL and BLK registrations.
- Search and filter registrations.
- View registration and attendance statistics.
- Manage Coordinator accounts.
- Assign Coordinator department access.
- Manage shared volunteer accounts.
- Change volunteer team credentials.
- Enable or disable public registration.
- Configure public registration closing.
- Enable or disable on-the-spot registration.
- Edit event details and media.
- Soft-delete and restore registrations.
- Export registration data to Excel.

### Restrictions

Admins cannot:

- Create other Admin accounts.
- Disable other Admin accounts.
- Modify other Admin accounts' permissions.
- Change Super Admin access.
- Edit submitted registration details.

## 3.5 Coordinator Requirements

Each Coordinator will receive a separate individual account.

A Coordinator's access will be assigned by an Admin or Super Admin.

### Department access types

```
type DepartmentAccess =
  | "BAL_ONLY"
  | "BLK_ONLY"
  | "BOTH";
```

### Permissions

Within their assigned department, Coordinators can:

- Search registrations.
- View registration details.
- Perform quick registrations.
- Issue physical cards.
- Reverse card issuance.
- Update accompanying-person counts.
- View relevant operational statistics.
- Manage applicable volunteer operations.
- Soft-delete registrations.
- Restore deleted registrations.

### Restrictions

Coordinators cannot:

- Create or manage other Coordinator accounts.
- Manage Admin accounts.
- Change global system settings.
- Access registrations outside their assigned department.
- Edit submitted registration information.

A Coordinator assigned `BAL_ONLY` must not be able to access BLK records by changing URLs, API parameters, or browser-side data.

## 3.6 Volunteer Requirements

The event will use shared team accounts rather than individual volunteer accounts.

### Confirmed accounts

| Shared Account | Department |
| -------------- | ---------- |
| BAL Volunteer  | BAL        |
| BLK Volunteer  | BLK        |

Multiple volunteers must be able to use the same account simultaneously.

### Volunteer permissions

Volunteers can:

- Log in using the appropriate shared account.
- Search children in their assigned category.
- View registration details.
- View internal registration numbers.
- Perform quick registration when enabled.
- Issue cards.
- Reverse card issuance.
- Edit accompanying-person counts.

### Volunteer restrictions

Volunteers cannot:

- Access another department's records.
- Soft-delete registrations.
- Restore registrations.
- Manage accounts.
- Change registration availability.
- Edit event settings.
- Edit submitted registration details.

### Shared-account implications

The system does not need to identify which individual volunteer performed an operation.

However, the backend should still record transaction timestamps and technical error information for troubleshooting.

The system must support concurrent sessions without forcing other volunteers to log out.

# 4. Role-Based Access Control

## 4.1 Permission Matrix

| Feature                      | Public | Volunteer         | Coordinator            | Admin                 | Super Admin    |
| ---------------------------- | ------ | ----------------- | ---------------------- | --------------------- | -------------- |
| Public registration          | Yes    | Yes, as public    | Yes, as public         | Yes, as public        | Yes, as public |
| Staff login                  | No     | Yes               | Yes                    | Yes                   | Yes            |
| Search registrations         | No     | Assigned category | Assigned category      | All                   | All            |
| Quick registration           | No     | Assigned category | Assigned category      | Authorized operations | All            |
| Issue cards                  | No     | Assigned category | Assigned category      | Authorized operations | All            |
| Reverse card issuance        | No     | Assigned category | Assigned category      | Authorized operations | All            |
| Edit accompanying count      | No     | Assigned category | Assigned category      | Authorized operations | All            |
| Delete/restore registrations | No     | No                | Assigned category      | All                   | All            |
| View management statistics   | No     | No                | Assigned category      | All                   | All            |
| Excel export                 | No     | No                | Not confirmed          | Yes                   | Yes            |
| Manage Coordinator accounts  | No     | No                | No                     | Yes                   | Yes            |
| Manage volunteer accounts    | No     | No                | Operational scope only | Yes                   | Yes            |
| Manage Admin accounts        | No     | No                | No                     | No                    | Yes            |
| Edit event content           | No     | No                | No                     | Yes                   | Yes            |
| Manage global settings       | No     | No                | No                     | Authorized settings   | All            |

"Authorized operations" indicates that the role may have the underlying authority, but the exact interface placement is an implementation decision.

## 4.2 Authorization Enforcement

Authorization must be enforced at the backend.

The frontend may hide inaccessible features, but hiding UI elements is not sufficient security.

Every protected request must validate:

1. Authentication.
2. Account status.
3. User role.
4. Department access.
5. Permission for the requested operation.
6. Registration state where relevant.

# 5. Application Structure

## 5.1 Main Interfaces

The system consists of three primary interfaces.

### A. Public Website

For parents and guardians.

Features:

- Event information.
- Event branding.
- Category selection.
- Registration form.
- Review and confirmation.
- Success screen.
- Registration-closed screen.

### B. Volunteer and Coordinator Interface

For event-day operations.

Features:

- Staff login.
- Child search.
- Registration details.
- Card issuance.
- Accompanying-person count entry.
- Card reversal.
- Quick registration.
- Coordinator management features according to role.

### C. Admin Interface

For management.

Features:

- Dashboard.
- Registration management.
- Attendance statistics.
- Deleted registrations.
- Excel export.
- Event management.
- Registration settings.
- Coordinator management.
- Volunteer account management.
- Admin account management for Super Admin.

## 5.2 Language Requirements

All user-facing interfaces must use English.

This includes:

- Navigation.
- Forms.
- Buttons.
- Validation.
- Alerts.
- Dialogs.
- Confirmation messages.
- Dashboard labels.
- Export headers.

No Gujarati-language interface or language switcher is required.

# 6. Public Website Requirements

## 6.1 Purpose

The public website will allow parents or guardians to register children without creating an account.

It will also serve as the event-information website before and after registration closes.

## 6.2 Visual Design

The public website must use a:

Modern + Colorful + Professional + Claymorphism design direction.

### Design characteristics

- Festive visual identity.
- Event-specific colors.
- Soft dimensional cards.
- Rounded components.
- Subtle shadows.
- Attractive category selection.
- Responsive spacing.
- Smooth transitions.
- Clear visual hierarchy.
- Accessible text contrast.

Claymorphism must be limited to the public-facing website.

## 6.3 Home Page

The home page should display:

- Event logo.
- Event name.
- Event banner.
- Event date.
- Event time.
- Event venue.
- Event description.
- Important instructions.
- Registration action when open.
- Contact information.

All editable content must come from the management system rather than being hardcoded.

## 6.4 Registration Category Selection

The user must select one category before completing registration.

Options:

Bal Vibhag

Internal code: `BAL`

Balika Vibhag

Internal code: `BLK`

The selected category must be preserved throughout the registration flow.

## 6.5 Public Registration Flow

```
OPEN WEBSITE
      |
      v
VIEW EVENT INFORMATION
      |
      v
SELECT BAL OR BLK
      |
      v
OPEN REGISTRATION FORM
      |
      v
ENTER CHILD DETAILS
      |
      v
REVIEW & CONFIRM
      |
      +---- EDIT DETAILS ----+
      |                      |
      v                      |
FINAL CONFIRM <-------------+
      |
      v
BACKEND VALIDATION
      |
      v
GENERATE UNIQUE CODE
      |
      v
SAVE REGISTRATION
      |
      v
SUCCESS SCREEN
```

## 6.6 Public Registration Requirements

- No login required.
- No account creation.
- No OTP requirement.
- No SMS confirmation.
- No WhatsApp confirmation.
- Mandatory review step.
- Clear validation messages.
- Responsive layout.
- Duplicate registrations allowed.
- Internal registration number hidden from public.
- Submitted registration information immutable.

# 7. Registration Form Requirements

## 7.1 Confirmed Fields

The child's name must be collected using three separate fields.

| Field         | Type       | Description                                |
| ------------- | ---------- | ------------------------------------------ |
| First Name    | Text       | Child's first name                         |
| Father's Name | Text       | Father's name                              |
| Surname       | Text       | Child's surname                            |
| Mobile Number | Phone/Text | Registration contact number; ownership TBD |

## 7.2 Full Name Generation

The system will generate a display name using:

```
First Name + Father's Name + Surname
```

Example:

```
First Name: Aarav
Father's Name: Rajeshbhai
Surname: Patel

Full Name:
Aarav Rajeshbhai Patel
```

The original three fields must remain separately stored.

## 7.3 Remaining Fields

The complete registration form has not yet been finalized.

Additional fields must not be treated as confirmed requirements.

Potential fields such as age, school, address, or class should not be added automatically without approval.

Status: TBD

## 7.4 Validation Requirements

The system must:

- Validate required fields.
- Trim unnecessary leading/trailing whitespace.
- Reject invalid field formats.
- Show errors near affected inputs.
- Preserve entered information when validation fails.
- Validate all submitted data on the backend.

Mobile-number formatting should be appropriate for the final accepted contact-number policy.

## 7.5 Duplicate Registration Policy

Duplicate registration prevention is explicitly disabled.

The following are permitted:

- Multiple children using the same mobile number.
- Multiple registrations with the same child's name.
- Repeated registrations for the same child.
- Repeated registrations across different submission sessions.
- Repeated registrations through public and on-the-spot workflows.

The system must not:

- Block a registration because the mobile number already exists.
- Display duplicate-registration warnings.
- Search for existing children before allowing submission.
- Reserve mobile numbers for uniqueness.
- Enforce a one-registration-per-mobile rule.

Every successful submission must create a separate registration record and receive its own unique registration number.

### Important distinction

Duplicate registration business records are allowed.

Duplicate registration numbers are not allowed.

Also, accidental duplicate requests caused by network retries should be handled using request idempotency. This is a technical reliability measure, not a business-rule restriction on repeated registrations.

# 8. Review and Confirmation

## 8.1 Mandatory Review Screen

Before saving a registration, the user must review all entered information.

The screen must display:

- Selected department.
- All submitted form fields.
- Clearly labeled values.
- Edit/back option.
- Final confirmation button.

## 8.2 Review Actions

Edit Details

Returns to the form while preserving entered values.

Confirm & Submit

Submits the registration to the backend.

## 8.3 Immutability Rule

Once the registration is successfully submitted, the original registration information cannot be modified.

This applies to:

- Public users.
- Volunteers.
- Coordinators.
- Admins.
- Super Admins.

Operational fields such as card status and accompanying-person count remain editable under their own rules.

## 8.4 Submission Protection

The interface must prevent accidental repeated submission of the same in-flight request.

Recommended behavior:

- Disable the submit button while processing.
- Display a loading indicator.
- Use a submission idempotency key.
- Recover gracefully from network timeouts.
- Avoid creating additional records merely because the same request was retried.

A user may intentionally start a new registration with identical information afterward.

# 9. Registration Number System

## 9.1 Number Formats

BAL registrations:

```
BAL-0001
BAL-0002
BAL-0003
```

BLK registrations:

```
BLK-0001
BLK-0002
BLK-0003
```

## 9.2 Numbering Rules

1. BAL and BLK use separate sequences.
2. Each successful registration receives one code.
3. Public and on-the-spot registrations share the same sequence within their category.
4. Codes must never be reused.
5. Soft-deleted registrations retain their original codes.
6. Restored registrations retain their original codes.
7. Codes must be unique under concurrent submissions.
8. The numeric portion must expand beyond four digits when necessary.

Examples:

```
BAL-9999
BAL-10000

BLK-9999
BLK-10000
```

## 9.3 Atomic Number Allocation

Registration codes must be generated by trusted backend logic.

The frontend must never calculate or assign the next registration number.

The backend should use a transactional counter or another concurrency-safe allocation strategy.

## 9.4 Public Visibility

The registration code must not appear on:

- Public registration success screen.
- Public registration confirmation.
- Public notifications.

The code is available to authorized staff through internal management interfaces.

# 10. Registration Success Screen

## 10.1 Success Conditions

The success screen must appear only after the backend confirms that the registration has been saved.

## 10.2 Required Information

Display:

- Registration success heading.
- Short confirmation message.
- Instructions for collecting the games card at the venue.

### Recommended Copy

> Registration Successful!
>
> Your registration for Anandotsav 2026 has been completed successfully.
>
> Please collect your games card at the event venue by telling the volunteer your child's name.

## 10.3 Excluded Information

Do not display:

- Internal registration code.
- QR card number.
- Internal database ID.
- Staff-only information.

# 11. Registration Availability Management

## 11.1 Public Registration Control

Admins must be able to enable or disable public registration manually.

States:

```
publicRegistrationEnabled: boolean
```

## 11.2 Automatic Closing

Admins must be able to configure an automatic public registration closing date and time.

When the closing time is reached:

- New public registrations must be rejected.
- The public registration form must no longer accept submissions.
- The registration-closed state must appear.

The backend must enforce the closing time, not just the browser.

## 11.3 On-the-Spot Registration Control

On-the-spot registration must have a separate enable/disable setting.

```
onSpotRegistrationEnabled: boolean
```

## 11.4 Independent Operation

Examples:

| Public Registration | On-the-Spot Registration | Result                                       |
| ------------------- | ------------------------ | -------------------------------------------- |
| Open                | Open                     | Both available                               |
| Closed              | Open                     | Only staff quick registration available      |
| Open                | Closed                   | Only public registration available           |
| Closed              | Closed                   | No new registrations through either workflow |

## 11.5 Registration Capacity

There is no confirmed maximum registration limit for BAL or BLK.

The system must not enforce an arbitrary category capacity.

# 12. Registration Closed Experience

## 12.1 Required Behavior

When public registration is closed:

- Hide the active registration form.
- Display a clear "Registration Closed" message.
- Continue showing event information.
- Display event branding.
- Display relevant instructions.
- Display contact information.

## 12.2 Suggested Message

> Registration Closed
>
> Registration for Anandotsav 2026 is currently closed.
>
> Please review the event information below for details about the event.

## 12.3 Editable Content

Event information must remain editable from the management interface even after registration closes.

The website must display the updated content without requiring code changes.

# 13. Volunteer Panel Requirements

## 13.1 Primary Purpose

The Volunteer Panel is designed for fast, repetitive event-day operations.

The most important activity is:

Search Child → Verify Details → Issue Card → Return to Search

## 13.2 Design Principles

The interface must be:

- Mobile-first.
- Fast.
- Minimal.
- Clean.
- Professional.
- Easy to use while standing or moving.
- Suitable for one-handed interactions where practical.
- Free from unnecessary animation.
- Optimized for low interaction count.

## 13.3 Volunteer Landing Screen

After login, the primary screen should prioritize:

1. Search input.
2. Search results.
3. Quick Registration access, when enabled.
4. Basic account/logout controls.

The system should not require volunteers to navigate through multiple dashboard pages before searching.

## 13.4 Department Restriction

A BAL volunteer can search and register only BAL children.

A BLK volunteer can search and register only BLK children.

Department restrictions must be enforced by the backend.

# 14. Child Search

## 14.1 Search Methods

The system must support:

- Child's name.
- Mobile number.
- Internal registration code.

Examples:

```
Aarav

9876543210

BAL-0001
```

## 14.2 Search-as-You-Type

Search must execute automatically while the user types.

No separate search button is required.

## 14.3 Search Performance

Implementation should include:

- Debouncing.
- Indexed queries.
- Limited result sets.
- Efficient matching.
- Request cancellation or stale-response protection.
- Loading indicators.
- Empty-result states.

Firestore's native query limitations must be considered. A normalized search index or appropriate dedicated search strategy may be needed for partial-name matching.

## 14.4 Search Results

Each result must display:

Primary line: Child's full name.

Secondary line: Mobile number.

Example:

```
Aarav Rajeshbhai Patel
9876543210
```

## 14.5 Multiple Matching Records

Because duplicate registrations are allowed, multiple matching results may appear.

The system must:

- Display all relevant matches within the result limit.
- Allow volunteers to select the correct record.
- Never automatically merge matching records.
- Never assume identical names or mobile numbers identify the same registration.

## 14.6 Registration Detail Screen

After selecting a record, show:

- Full name.
- Mobile number.
- Registration code.
- Department.
- Card status.
- Accompanying-person count.
- Relevant actions.

Additional finalized form fields should be shown when appropriate.

# 15. Physical Games Card Issuance

## 15.1 Overview

Cards will be distributed physically at the event venue.

The application records whether a card has been issued for a particular registration.

## 15.2 No QR Scanning Requirement

The system does not require:

- Scanning the physical card.
- Scanning a registration QR code.
- Assigning a physical card ID.
- Linking a QR code to a registration record.

## 15.3 Card States

```
type CardStatus =
  | "NOT_ISSUED"
  | "ISSUED";
```

New registrations begin with:

```
NOT_ISSUED
```

## 15.4 Issuance Workflow

```
VOLUNTEER SEARCHES CHILD
           |
           v
SELECTS REGISTRATION
           |
           v
VERIFIES CHILD DETAILS
           |
           v
CLICKS "ISSUE CARD"
           |
           v
ACCOMPANYING COUNT DIALOG
           |
           v
ENTERS NUMBER OF PEOPLE
           |
           v
CLICKS "CONFIRM"
           |
           v
ATOMIC BACKEND UPDATE
           |
           v
CARD STATUS = ISSUED
           |
           v
SUCCESS MESSAGE
           |
           v
CLEAR SEARCH & RETURN
```

## 15.5 Mandatory Accompanying Count

The accompanying-person count must be entered before confirming issuance.

If the dialog is canceled:

- No issuance occurs.
- Card status remains unchanged.
- Attendance totals remain unchanged.

## 15.6 Atomic Transaction

Card issuance and accompanying-count storage must happen as one logical transaction.

Partial updates are not acceptable.

For example, the system must not mark a card issued while failing to save its accompanying count.

## 15.7 Concurrent Issuance Protection

If two volunteers attempt to issue the same registration simultaneously:

- Only one transition from `NOT_ISSUED` to `ISSUED` should succeed.
- The second volunteer should receive the current status.
- Attendance must not increase twice.

This is card-operation concurrency protection, not duplicate-registration prevention.

## 15.8 Post-Issuance Behavior

After successful issuance:

1. Show confirmation.
2. Clear the search field.
3. Clear the selected registration.
4. Return to the search screen.
5. Prepare the interface for the next child.

This behavior is mandatory.

# 16. Card Reversal and Reissuance

## 16.1 Reversal Permission

Volunteers may reverse a card from:

```
ISSUED → NOT_ISSUED
```

No Admin approval is required.

## 16.2 Reversal Effects

When a card is reversed:

- The child is removed from the issued-card attendance count.
- The registration's accompanying-person count is excluded from attendance.
- The registration becomes eligible for reissuance.

## 16.3 Reissuance

A reversed registration may be issued again.

During reissuance:

- The accompanying-person count must be confirmed again.
- The new issued state must be saved atomically.
- Attendance must reflect the new current state.

## 16.4 Data Preservation

The application may preserve the previous accompanying count for operational reference, but it must not contribute to attendance while the card is not issued.

# 17. Accompanying Persons Management

## 17.1 Definition

Accompanying persons are people who arrive with the registered child.

Examples may include:

- Parents.
- Guardians.
- Family members.
- Other accompanying individuals.

The registered child is not included in the accompanying-person count.

## 17.2 Collection Point

The count is collected at card issuance.

It is not part of the public registration form.

## 17.3 Validation

The count must be:

- An integer.
- Zero or greater.
- Within the final configured technical range.
- Explicitly confirmed.

The final maximum count has not been decided.

## 17.4 Editing After Issuance

Volunteers can update the accompanying-person count after a card has been issued.

They must not need to reverse the card first.

Example:

```
Current count: 3
Correct count: 4

Update count → 4
```

The card remains issued.

## 17.5 Attendance Adjustment

If the count changes from 3 to 4:

```
Attendance change: +1
```

If the count changes from 4 to 2:

```
Attendance change: -2
```

The backend must ensure that changes are applied exactly once.

# 18. Attendance Calculation

## 18.1 Attendance Model

Attendance is calculated using the current card issuance state.

The system does not independently verify whether a person has physically entered or left the venue.

## 18.2 Core Formulas

Children Present

```
Count of active registrations
where cardStatus = ISSUED
```

Accompanying Persons Present

```
Sum of accompanyingPersonsCount
for active registrations
where cardStatus = ISSUED
```

Total Attendance

```
Children Present + Accompanying Persons Present
```

## 18.3 Example

| Metric                  | Count |
| ----------------------- | ----- |
| Issued Cards / Children | 50    |
| Accompanying Persons    | 200   |
| Total Attendance        | 250   |

## 18.4 Department-Based Attendance

Statistics must support:

- BAL.
- BLK.
- Combined.

## 18.5 Deletion Impact

Soft-deleted registrations must not contribute to active attendance statistics.

If an issued registration is soft-deleted, its contribution must be removed from the active totals.

If the registration is restored, its current operational state must be handled consistently so that attendance is not double-counted.

## 18.6 Duplicate Registration Impact

Duplicate registration records remain independent.

If two registrations exist for the same child and both have issued cards, both will count toward attendance.

The system must not automatically deduplicate them.

This is an accepted consequence of the confirmed duplicate-registration policy.

# 19. On-the-Spot Quick Registration

## 19.1 Purpose

Volunteers must be able to register children who arrive without an existing registration.

## 19.2 Access

Quick Registration is available only when the on-the-spot registration setting is enabled.

Volunteer category permissions apply.

## 19.3 Form Requirements

The form should be shorter than the public registration form.

The exact fields are not yet finalized.

Status: TBD

## 19.4 Mandatory Review

Quick Registration must include the same mandatory Review & Confirm step as public registration.

## 19.5 Registration Code Generation

Quick Registration uses the same numbering sequence as public registration.

Example:

```
Existing public registration:
BAL-0150

Next on-the-spot registration:
BAL-0151
```

The source does not determine a separate numbering sequence.

## 19.6 Registration Source

Every record must identify how it was created.

```
type RegistrationSource =
  | "ONLINE"
  | "ON_THE_SPOT";
```

## 19.7 Duplicate Policy

Quick Registration must allow:

- Repeated mobile numbers.
- Repeated names.
- Multiple registrations for the same child.

No duplicate detection or prevention is required.

## 19.8 After Submission

After a successful quick registration, the volunteer should be able to proceed to the registration detail and card issuance workflow without manually searching for the newly created record.

# 20. Admin Dashboard

## 20.1 Purpose

The Admin Dashboard provides a centralized overview of registrations, card distribution, and attendance.

## 20.2 Required Metrics

| Metric                    | Definition                                |
| ------------------------- | ----------------------------------------- |
| BAL Registrations         | Active BAL registration count             |
| BLK Registrations         | Active BLK registration count             |
| Total Registrations       | Active BAL + BLK                          |
| Online Registrations      | Active registrations created publicly     |
| On-the-Spot Registrations | Active quick registrations                |
| Cards Issued              | Active registrations with issued cards    |
| Cards Pending             | Active registrations without issued cards |
| Children Present          | Active issued-card count                  |
| Accompanying Persons      | Companion total for active issued cards   |
| Total Attendance          | Children + companions                     |

## 20.3 Filters

The dashboard must support:

- All departments.
- BAL.
- BLK.

## 20.4 Refresh Behavior

Manual refresh only.

Requirements:

- Fetch statistics when the dashboard opens.
- Provide a visible Refresh button.
- Do not continuously refresh statistics.
- Display the last successful refresh time.
- Show loading feedback during refresh.
- Preserve the previous successful values if a refresh fails, while clearly indicating the error.

## 20.5 Example Dashboard Layout

```
----------------------------------------------------
                 ANANDOTSAV 2026
                 ADMIN DASHBOARD
----------------------------------------------------

[ BAL Registrations ]  [ BLK Registrations ]
[ Total Registrations ]

[ Online ]             [ On-the-Spot ]

[ Cards Issued ]       [ Cards Pending ]

----------------------------------------------------
                  ATTENDANCE
----------------------------------------------------

[ Children Present ]

[ Accompanying Persons ]

[ Total Attendance ]

----------------------------------------------------

Department: [ All | BAL | BLK ]

Last Updated: [Timestamp]       [Refresh]

----------------------------------------------------
```

This is a functional layout reference, not a final UI design.

# 21. Registration Management

## 21.1 Registration List

Authorized management users must be able to view registration records.

### Required columns

- Registration code.
- Child full name.
- Mobile number.
- Department.
- Registration source.
- Registration date.
- Card status.
- Accompanying-person count.

## 21.2 Sorting

Confirmed options:

1. Latest First.
2. Oldest First.
3. Name A–Z.

## 21.3 Filtering

Recommended filters:

- BAL.
- BLK.
- Online.
- On-the-Spot.
- Issued.
- Not Issued.
- Active.
- Deleted, where authorized.

## 21.4 Search

Search by:

- Child name.
- Mobile number.
- Registration code.

## 21.5 Record Details

A registration detail view must show all finalized registration fields and operational information.

## 21.6 Editing Restrictions

Submitted registration fields must be read-only.

No Edit Registration feature should be provided for original submitted information.

# 22. Soft Delete and Restore

## 22.1 Deletion Policy

The system will use soft deletion.

Records are not physically removed from the database during normal operational deletion.

## 22.2 Authorized Roles

| Role        | Scope               |
| ----------- | ------------------- |
| Super Admin | All registrations   |
| Admin       | All registrations   |
| Coordinator | Assigned department |
| Volunteer   | No access           |

## 22.3 Delete Workflow

1. Authorized user opens a registration.
2. Selects Delete.
3. Confirmation dialog appears.
4. User confirms.
5. Backend marks the record deleted.
6. Record disappears from active lists.
7. Active statistics are updated.

## 22.4 Deleted Record Behavior

A deleted record must:

- Retain its registration code.
- Retain original registration information.
- Remain available in the deleted-record management area.
- Be excluded from ordinary volunteer search.
- Be excluded from active statistics.
- Remain restorable.

## 22.5 Restore Workflow

1. Authorized user opens Deleted Registrations.
2. Finds the record.
3. Selects Restore.
4. Confirms the action.
5. Backend restores the record.
6. The original registration code remains unchanged.
7. Active statistics are updated.

## 22.6 Duplicate Policy During Restore

Restoration must not be blocked because another record has the same name or mobile number.

Duplicate registrations are permitted.

# 23. Excel Export

## 23.1 Format

The system must support:

```
.xlsx
```

PDF export is not required.

## 23.2 Export Types

Admins must be able to export:

- All active registrations.
- BAL registrations.
- BLK registrations.
- Online registrations.
- On-the-Spot registrations.
- Issued-card registrations.
- Pending-card registrations.

## 23.3 Recommended Columns

```
Registration Code
Department
First Name
Father's Name
Surname
Full Name
Mobile Number
Registration Source
Registration Date
Card Status
Accompanying Persons Count
```

Additional finalized registration fields should be included as appropriate.

## 23.4 Export Requirements

- Correct filtering.
- Correct authorization.
- Human-readable column headings.
- Appropriate date formatting.
- Consistent registration codes.
- Proper handling of large datasets.
- No accidental formula execution from untrusted text values.

## 23.5 File Naming

Recommended format:

```
Anandotsav_2026_BAL_Registrations.xlsx
Anandotsav_2026_BLK_Registrations.xlsx
Anandotsav_2026_All_Registrations.xlsx
```

# 24. Event Management

## 24.1 Purpose

Admins must be able to update event information without changing application code.

## 24.2 Confirmed Editable Fields

| Field                  | Editable |
| ---------------------- | -------- |
| Event Name             | Yes      |
| Event Date             | Yes      |
| Event Time             | Yes      |
| Event Venue            | Yes      |
| Event Address          | Yes      |
| Event Description      | Yes      |
| Important Instructions | Yes      |
| Contact Information    | Yes      |
| Event Logo             | Yes      |
| Event Banner           | Yes      |
| Event Photos           | Yes      |

## 24.3 Management Workflow

1. Admin opens Event Management.
2. Existing event details are loaded.
3. Admin modifies the required fields.
4. Admin saves the changes.
5. Backend validates and stores the update.
6. Public website displays the updated content.

## 24.4 Media Management

The system must support secure upload and replacement of:

- Logo.
- Banner.
- Event photos.

Recommended technical safeguards:

- File type validation.
- File size limits.
- Storage access controls.
- Image optimization.
- Safe media URLs.
- Appropriate image dimensions.

## 24.5 Registration Closed State

Event details must remain editable and visible when registration is closed.

Closing registration must not disable the event-information website.

# 25. Account Management

## 25.1 Admin Account Management

Only the Super Admin can:

- Create Admin accounts.
- Disable Admin accounts.
- Enable Admin accounts.
- Manage Admin account access.

## 25.2 Coordinator Account Management

Admin and Super Admin can:

- Create Coordinator accounts.
- Disable Coordinator accounts.
- Enable Coordinator accounts.
- Assign department access.
- Update Coordinator access.

Coordinators cannot manage other Coordinator accounts.

## 25.3 Volunteer Account Management

Admin and Super Admin can manage the BAL and BLK shared volunteer accounts.

This includes:

- Credential changes.
- Account enable/disable.
- Access maintenance.

## 25.4 Account Status

Recommended model:

```
type AccountStatus =
  | "ACTIVE"
  | "DISABLED";
```

Disabled accounts must not be allowed to perform protected operations, even if a previously issued session token remains temporarily valid.

Backend checks must account for account status.

# 26. Authentication and Session Management

## 26.1 Authentication Provider

Recommended:

Firebase Authentication

## 26.2 Account Types

Individual accounts:

- Super Admin.
- Admin.
- Coordinator.

Shared accounts:

- BAL Volunteer.
- BLK Volunteer.

## 26.3 Session Persistence

Users should remain logged in until they manually log out, subject to security-related revocation.

Requirements:

- Browser restart should not normally require login again.
- Multiple volunteer devices may remain signed in simultaneously.
- Logout ends the local session.
- Disabling an account must prevent further authorized operations.
- Credential changes must be handled securely.

## 26.4 Security Requirements

- HTTPS.
- Secure authentication handling.
- No hardcoded credentials in frontend source.
- No plaintext password storage.
- Backend authorization.
- Appropriate rate limiting for login attempts.
- Safe error messages.
- Account revocation support.

# 27. Proposed Technical Architecture

## 27.1 Architecture Diagram

```
                  USERS
                    |
        +-----------+-----------+
        |           |           |
      PUBLIC     VOLUNTEER     ADMIN
      WEBSITE      PANEL       PANEL
        |           |           |
        +-----------+-----------+
                    |
             REACT FRONTEND
                    |
              FIREBASE HOSTING
                    |
        +-----------+-----------+
        |                       |
  FIREBASE AUTH          CLOUD FUNCTIONS
        |                       |
        |                BUSINESS LOGIC
        |                       |
        +-----------+-----------+
                    |
              CLOUD FIRESTORE
                    |
             FIREBASE STORAGE
              (Event Media)
                    |
             GOOGLE CLOUD
              MONITORING
```

## 27.2 Frontend Stack

Recommended:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Motion.
- React Router.
- React Hook Form.
- Zod validation.

These are recommended implementation choices, not additional business requirements.

## 27.3 Backend Stack

Recommended:

- Firebase Authentication.
- Cloud Firestore.
- Cloud Functions 2nd Gen.
- Firebase Storage.
- Firebase Hosting.

## 27.4 Server-Side Operations

Sensitive mutations should be implemented through trusted backend functions, including:

- Registration creation.
- Registration code allocation.
- Card issuance.
- Card reversal.
- Accompanying-count changes.
- Soft delete.
- Restore.
- Role management.
- Registration setting changes.
- Statistics updates.

# 28. Proposed Database Design

The following is a recommended logical schema. It should be refined after the final registration fields are confirmed.

## 28.1 `registrations`

```
interface Registration {
  id: string;

  registrationCode: string;

  category: "BAL" | "BLK";

  firstName: string;
  fatherName: string;
  surname: string;
  fullName: string;

  mobileNumber: string;

  source: "ONLINE" | "ON_THE_SPOT";

  cardStatus: "NOT_ISSUED" | "ISSUED";

  accompanyingPersonsCount: number | null;

  isDeleted: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  cardIssuedAt: Timestamp | null;
  deletedAt: Timestamp | null;
}
```

### Notes

- Mobile number is not unique.
- Full name is not unique.
- Registration code is unique.
- Submitted fields are immutable.
- Operational fields can change.
- Soft deletion preserves the record.

## 28.2 `users`

```
interface StaffUser {
  uid: string;

  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "COORDINATOR"
    | "VOLUNTEER";

  categoryAccess:
    | "BAL_ONLY"
    | "BLK_ONLY"
    | "BOTH";

  accountType:
    | "INDIVIDUAL"
    | "SHARED";

  isActive: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 28.3 `registrationCounters`

Recommended document structure:

```
interface RegistrationCounter {
  category: "BAL" | "BLK";

  lastAllocatedNumber: number;
}
```

Suggested documents:

```
registrationCounters/BAL
registrationCounters/BLK
```

Counters must be updated transactionally.

## 28.4 `eventSettings`

```
interface EventSettings {
  eventName: string;

  eventDate: Timestamp | null;
  eventTime: string | null;

  venue: string;
  address: string;

  description: string;
  instructions: string;
  contactInformation: string;

  logoUrl: string | null;
  bannerUrl: string | null;
  photoUrls: string[];

  publicRegistrationEnabled: boolean;
  onSpotRegistrationEnabled: boolean;

  automaticClosingAt: Timestamp | null;

  updatedAt: Timestamp;
}
```

## 28.5 `statistics`

A suggested aggregate document:

```
interface DepartmentStatistics {
  category: "BAL" | "BLK";

  totalRegistrations: number;

  onlineRegistrations: number;
  onSpotRegistrations: number;

  cardsIssued: number;
  cardsPending: number;

  accompanyingPersonsPresent: number;

  updatedAt: Timestamp;
}
```

Combined totals may be calculated from the BAL and BLK aggregate documents.

## 28.6 `registrationRequests`

Recommended for idempotency.

Purpose:

- Identify retried submission requests.
- Avoid duplicate records from the same network request.
- Preserve intentional repeated registrations.

This is not a mobile-number uniqueness system.

## 28.7 Collections Explicitly Not Required

The system does not need:

```
mobileReservations
duplicateRegistrations
duplicateDetection
```

No collection should exist solely to block repeated registrations.

# 29. Registration Backend Logic

## 29.1 Create Registration

Recommended process:

```
RECEIVE REGISTRATION REQUEST
           |
           v
VALIDATE INPUT
           |
           v
CHECK REGISTRATION AVAILABILITY
           |
           v
VALIDATE CATEGORY ACCESS
           |
           v
CHECK REQUEST IDEMPOTENCY
           |
           v
ALLOCATE UNIQUE CODE
           |
           v
CREATE REGISTRATION
           |
           v
UPDATE STATISTICS
           |
           v
RETURN SUCCESS
```

## 29.2 Explicit Exclusion

Do not perform:

```
Check existing mobile number
Check existing child name
Block repeated child
Reject matching registration
```

## 29.3 Atomicity

Registration creation must preserve consistency between:

- Registration record.
- Registration code allocation.
- Registration statistics.
- Submission idempotency state.

Implementation may use Firestore transactions and reliable event-driven aggregation, with safeguards against double counting.

# 30. Card Operations Backend Logic

## 30.1 Issue Card

Inputs:

```
{
  registrationId: string;
  accompanyingPersonsCount: number;
}
```

Validation:

- Authenticated staff.
- Authorized category.
- Active registration.
- Card currently not issued.
- Valid accompanying count.

Transaction:

- Update card status.
- Save accompanying count.
- Record issuance timestamp.
- Adjust statistics.

## 30.2 Reverse Card

Inputs:

```
{
  registrationId: string;
}
```

Transaction:

- Confirm currently issued.
- Change status to not issued.
- Remove attendance contribution.
- Preserve registration data.

## 30.3 Update Accompanying Count

Inputs:

```
{
  registrationId: string;
  accompanyingPersonsCount: number;
}
```

Transaction:

- Confirm authorized user.
- Confirm active registration.
- Confirm card is issued.
- Validate count.
- Calculate count difference.
- Save new count.
- Adjust statistics.

## 30.4 Race-Condition Handling

Transactions must protect against:

- Two simultaneous card issuances.
- Two simultaneous count updates.
- Card reversal during count update.
- Registration deletion during card issuance.
- Registration restoration during reporting.

# 31. Search Architecture

## 31.1 Search Requirements

Search must support:

- Name.
- Mobile number.
- Registration code.

## 31.2 Recommended Normalized Fields

```
{
  fullNameNormalized: string;
  mobileNumberNormalized: string;
  registrationCodeNormalized: string;
}
```

## 31.3 Matching Strategy

Recommended behavior:

- Exact code matching.
- Mobile-number matching.
- Case-insensitive name matching.
- Partial name search where technically supported.

## 31.4 Performance Requirements

- Debounce input.
- Avoid fetching the entire collection.
- Apply department filtering server-side.
- Exclude soft-deleted records.
- Limit returned results.
- Handle multiple matching records.

## 31.5 Security

Search must never reveal unauthorized records.

A volunteer must not be able to retrieve another department's registrations through modified search parameters.

# 32. Statistics Architecture

## 32.1 Required Aggregates

For each department:

```
Total Registrations
Online Registrations
On-the-Spot Registrations
Cards Issued
Cards Pending
Accompanying Persons Present
```

## 32.2 Derived Values

```
Children Present = Cards Issued

Total Attendance =
Cards Issued + Accompanying Persons Present
```

## 32.3 Consistency Requirements

Every relevant operation must produce the correct net statistical change.

Examples:

| Operation                        | Statistical Effect                                |
| -------------------------------- | ------------------------------------------------- |
| Create registration              | Registrations +1, Pending +1                      |
| Issue card                       | Pending -1, Issued +1, Attendance increases       |
| Reverse card                     | Issued -1, Pending +1, Attendance decreases       |
| Edit companions                  | Companion attendance adjusted by difference       |
| Soft-delete pending registration | Registrations -1, Pending -1                      |
| Soft-delete issued registration  | Registrations -1, Issued -1, Attendance decreases |
| Restore registration             | Restore appropriate active counts                 |

## 32.4 Refresh Model

The Admin Dashboard must not use automatic real-time subscriptions for continuously updating displayed statistics.

Data is fetched:

- On initial dashboard load.
- When Refresh is pressed.

Backend aggregate maintenance can still occur immediately after operations.

# 33. Non-Functional Requirements

## 33.1 Performance

Recommended targets under expected load:

| Operation                 | Target              |
| ------------------------- | ------------------- |
| Search response           | p95 under 1 second  |
| Registration submission   | p95 under 2 seconds |
| Card issuance             | p95 under 2 seconds |
| Card reversal             | p95 under 2 seconds |
| Accompanying-count update | p95 under 2 seconds |

These are targets to validate, not guaranteed performance claims.

## 33.2 Reliability

The system must:

- Avoid data loss.
- Prevent partial card updates.
- Maintain unique registration codes.
- Handle concurrent operations.
- Recover from transient errors.
- Avoid double counting.
- Display clear failure messages.

## 33.3 Responsiveness

Supported form factors:

- Mobile phones.
- Tablets.
- Laptops.
- Desktops.

The Volunteer Panel must be particularly well optimized for mobile screens.

## 33.4 Accessibility

Recommended requirements:

- Keyboard-accessible forms.
- Visible focus states.
- Clear labels.
- Accessible error messages.
- Adequate contrast.
- Large touch targets.
- Loading and disabled states.

## 33.5 Maintainability

The codebase should use:

- TypeScript.
- Modular components.
- Reusable validation schemas.
- Centralized authorization.
- Consistent error handling.
- Environment-based configuration.
- Automated tests.

# 34. Online-Only Requirements

## 34.1 Connectivity

An active internet connection is required for:

- Registration.
- Login.
- Search.
- Card issuance.
- Card reversal.
- Count updates.
- Management operations.
- Reporting.

## 34.2 Offline Behavior

The system will not support offline data changes.

If connectivity is lost:

- Show a clear connection error.
- Do not falsely report success.
- Preserve unsent form input where practical.
- Allow safe retry after reconnecting.

## 34.3 Retry Safety

If a request times out, the client must avoid blindly creating another transaction without checking the result or reusing the appropriate idempotency key.

# 35. Security Requirements

## 35.1 Authentication

Use secure authentication for all staff roles.

## 35.2 Authorization

Enforce:

- Role.
- Department.
- Account status.
- Operation permission.

## 35.3 Personal Information

Registration data contains children's information and contact numbers.

Access must be restricted to authorized staff.

## 35.4 Public Access Restrictions

The public website must not expose:

- Registration lists.
- Other children's information.
- Internal registration codes.
- Staff account information.
- Administrative settings.

## 35.5 Input Validation

All inputs must be validated server-side.

## 35.6 Media Security

Uploaded event media must be validated and stored securely.

## 35.7 Data Protection

Recommended safeguards:

- HTTPS.
- Least-privilege access.
- Database access rules.
- Secure backups.
- Monitoring.
- Appropriate data retention.
- Restricted production administration.

## 35.8 Compliance Considerations

Because children's personal information is involved, the project must establish appropriate privacy notices, consent handling, access policies, and retention/deletion procedures under applicable law before production deployment.

Exact legal requirements and retention periods are not yet finalized.

# 36. Monitoring and Error Handling

## 36.1 Monitoring

Recommended services:

- Firebase monitoring tools.
- Google Cloud Monitoring.
- Cloud Functions logs.
- Application error reporting.

## 36.2 Operational Events

Monitor:

- Registration failures.
- Authentication failures.
- Search errors.
- Card issuance failures.
- Transaction conflicts.
- Permission-denied errors.
- Backend exceptions.
- High latency.

## 36.3 User-Friendly Errors

Examples:

Registration Closed

> Registration is currently closed.

Card Already Issued

> This card has already been issued.

No Search Results

> No matching registrations found.

Permission Denied

> You do not have permission to perform this action.

Connection Error

> Connection lost. Please reconnect and try again.

Save Failure

> Unable to save changes. Please try again.

There must be no duplicate-registration error message because duplicates are allowed.

# 37. Suggested Navigation Structure

## 37.1 Public Website

```
Home
 |
 +-- Event Information
 |
 +-- Register
       |
       +-- Category Selection
       |
       +-- Registration Form
       |
       +-- Review & Confirm
       |
       +-- Success
```

## 37.2 Volunteer Panel

```
Volunteer Panel
 |
 +-- Search
 |     |
 |     +-- Search Results
 |     |
 |     +-- Registration Details
 |            |
 |            +-- Issue Card
 |            +-- Reverse Card
 |            +-- Edit Accompanying Count
 |
 +-- Quick Registration
 |
 +-- Logout
```

## 37.3 Admin Panel

```
Admin Dashboard
 |
 +-- Overview
 |
 +-- Registrations
 |     |
 |     +-- All Registrations
 |     +-- BAL
 |     +-- BLK
 |     +-- Deleted Registrations
 |
 +-- Attendance Statistics
 |
 +-- Excel Export
 |
 +-- Event Management
 |
 +-- Registration Settings
 |
 +-- Coordinator Management
 |
 +-- Volunteer Account Management
 |
 +-- Admin Account Management
 |     (Super Admin only)
 |
 +-- System Settings
 |     (Authorized roles only)
 |
 +-- Logout
```

# 38. End-to-End Event Workflows

## 38.1 Before the Event

1. Super Admin configures the initial system.
2. Super Admin creates Admin accounts.
3. Admin configures Coordinator accounts.
4. Admin configures volunteer shared accounts.
5. Admin enters event details.
6. Admin uploads event branding.
7. Admin enables public registration.
8. Parents register children.
9. Registrations receive unique internal codes.
10. Registration data becomes available to authorized staff.

## 38.2 Registration Closing

1. Admin manually closes registration or the configured closing time is reached.
2. Backend stops accepting new public registrations.
3. Public website displays Registration Closed.
4. Event information remains visible.
5. Admin can still update event content.
6. On-the-spot registration remains independently controlled.

## 38.3 Child Arrives at Event

1. Child and accompanying people arrive.
2. Parent provides child's name.
3. Volunteer searches the name.
4. Matching registrations appear.
5. Volunteer verifies the correct registration.
6. Volunteer opens the record.
7. Volunteer distributes the physical card.
8. Volunteer clicks Issue Card.
9. Volunteer enters accompanying-person count.
10. Volunteer confirms.
11. Backend saves the issued state.
12. Attendance aggregates update.
13. Success message appears.
14. Search screen resets.

## 38.4 Child Without Registration

1. Child arrives without a registration.
2. Volunteer opens Quick Registration.
3. Volunteer enters the required information.
4. Review screen appears.
5. Volunteer confirms.
6. Backend creates the registration.
7. Unique code is generated.
8. Volunteer proceeds to card issuance.

## 38.5 Incorrect Card Issuance

1. Volunteer finds the registration.
2. Volunteer selects Reverse Card.
3. System confirms the action.
4. Backend reverses the issued state.
5. Attendance contribution is removed.
6. Registration returns to Not Issued.

## 38.6 Incorrect Accompanying Count

1. Volunteer finds the issued registration.
2. Volunteer selects Edit Accompanying Count.
3. Volunteer enters the corrected count.
4. Backend saves the update.
5. Attendance totals are adjusted.

## 38.7 After the Event

1. Admin opens the dashboard.
2. Admin refreshes statistics.
3. Admin reviews registration totals.
4. Admin reviews issued and pending cards.
5. Admin reviews attendance estimates.
6. Admin exports Excel reports.
7. Event data is retained according to the finalized retention policy.

# 39. Testing Strategy

## 39.1 Public Registration Tests

Verify:

- BAL selection.
- BLK selection.
- Form validation.
- Review and confirmation.
- Successful registration.
- Registration code uniqueness.
- Hidden public registration code.
- Registration closed behavior.
- Automatic closing behavior.

## 39.2 Duplicate Registration Tests

Verify:

- Same mobile number can be registered multiple times.
- Same child name can be registered multiple times.
- Identical form details can be submitted in separate intentional registrations.
- Online and on-the-spot registrations may share a mobile number.
- Each successful registration receives a different code.
- No duplicate warning is shown.

## 39.3 Volunteer Tests

Verify:

- Shared BAL login.
- Shared BLK login.
- Concurrent sessions.
- Category restrictions.
- Search by name.
- Search by mobile.
- Search by code.
- Multiple matching results.
- Card issuance.
- Count entry.
- Card reversal.
- Reissuance.
- Count editing.
- Automatic return to search.

## 39.4 Admin Tests

Verify:

- Dashboard metrics.
- Manual refresh.
- BAL/BLK filtering.
- Registration sorting.
- Excel export.
- Soft deletion.
- Restoration.
- Event content editing.
- Registration availability.
- Account management.

## 39.5 Authorization Tests

Verify:

- Volunteers cannot delete registrations.
- Coordinators cannot access unauthorized departments.
- Coordinators cannot manage other Coordinators.
- Admins cannot manage Admin accounts.
- Super Admin can manage Admin accounts.
- Disabled accounts cannot perform operations.

## 39.6 Concurrency Tests

Verify:

- Simultaneous registration submissions.
- Unique code allocation.
- Concurrent card issuance.
- Concurrent count updates.
- Card reversal during another update.
- Registration deletion during card issuance.
- Safe retries after timeouts.

## 39.7 Load Tests

Test at:

- 20 concurrent users.
- 50 concurrent users.
- 100 concurrent users.
- 200 concurrent users.

Use representative search, registration, and card-issuance workloads.

## 39.8 Data Integrity Tests

Verify:

- No duplicate registration codes.
- No partial card issuance.
- No negative attendance counts.
- No double-counting from retries.
- No unauthorized cross-department access.
- Correct statistics after deletion and restoration.

# 40. Deployment and Environment Strategy

## 40.1 Development Environment

Used for feature implementation and developer testing.

## 40.2 Staging Environment

Used for:

- Functional testing.
- Volunteer workflow testing.
- Load testing.
- Permission testing.
- Deployment verification.

Staging should use synthetic test registrations.

## 40.3 Production Environment

Used for the actual Anandotsav 2026 event.

Requirements:

- Production Firebase project.
- Production authentication.
- Production database.
- Production storage.
- Monitoring.
- Secure environment configuration.
- Backup and recovery planning.

## 40.4 Deployment Checklist

Before production launch:

- Verify authentication.
- Verify role permissions.
- Verify department restrictions.
- Verify registration code generation.
- Verify public registration.
- Verify volunteer search.
- Verify card issuance.
- Verify attendance statistics.
- Verify Excel export.
- Verify event settings.
- Verify mobile responsiveness.
- Complete concurrency tests.
- Complete security tests.
- Confirm backup procedures.

# 41. Development Roadmap

| Phase                   | Deliverables                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| 1. Foundation           | Project structure, Firebase environments, authentication, authorization   |
| 2. Public Website       | Event information, category selection, registration form, review, success |
| 3. Registration Backend | Code allocation, persistence, availability controls, idempotency          |
| 4. Volunteer Operations | Shared login, search, registration details, quick registration            |
| 5. Card Management      | Issue, reverse, reissue, accompanying-person updates                      |
| 6. Statistics           | Attendance aggregates, Admin Dashboard, manual refresh                    |
| 7. Administration       | Registration management, soft delete/restore, account management          |
| 8. Event Management     | Editable details, logo, banner, photos, registration settings             |
| 9. Reporting            | Excel exports, filtering, formatting                                      |
| 10. Quality Assurance   | Functional, security, concurrency, performance tests                      |
| 11. Production          | Deployment, monitoring, final operational verification                    |

# 42. Acceptance Criteria

The product is ready for operational use when all critical requirements below are satisfied.

### Public Registration

- Users can register without logging in.
- BAL and BLK are available.
- Required fields are validated.
- Review & Confirm is mandatory.
- Registration codes are unique.
- Codes are hidden from public.
- Duplicate registrations are allowed.
- Submitted details are immutable.
- Success instructions are displayed.

### Volunteer Operations

- Shared team accounts work on multiple devices.
- Department restrictions are enforced.
- Search-as-you-type works.
- Multiple matching records are displayed.
- Card issuance requires accompanying count confirmation.
- Card status and count are saved atomically.
- Successful issuance returns to cleared search.
- Volunteers can reverse issued cards.
- Volunteers can edit accompanying counts.
- Quick Registration works when enabled.

### Administration

- Admin Dashboard shows required statistics.
- Dashboard refresh is manual.
- BAL and BLK statistics are available.
- Soft delete and restore work.
- Excel export works.
- Event details can be edited.
- Registration availability controls work.
- Coordinator management works.
- Volunteer account management works.
- Only Super Admin manages Admin accounts.

### Reliability and Security

- No duplicate registration codes.
- No double-counted card issuance.
- No unauthorized department access.
- No unauthorized account management.
- No lost or partially saved critical transactions.
- Expected event-day concurrency has been tested.

# 43. Pending Requirements and Decisions

The following remain unresolved and must not be silently treated as finalized.

| Requirement                                    | Status | Notes                                                 |
| ---------------------------------------------- | ------ | ----------------------------------------------------- |
| Complete public registration form              | TBD    | Only confirmed fields should be implemented initially |
| Mobile number ownership                        | TBD    | Parent, guardian, or other                            |
| Quick Registration fields                      | TBD    | Exact short-form fields                               |
| Event date                                     | TBD    | Admin-editable                                        |
| Event time                                     | TBD    | Admin-editable                                        |
| Event venue                                    | TBD    | Admin-editable                                        |
| Final logo and banner assets                   | TBD    | Admin-uploadable                                      |
| Maximum accompanying-person count              | TBD    | Validation limit                                      |
| Physical card quantities                       | TBD    | Including spare BAL/BLK quantities                    |
| Production domain                              | TBD    | Hosting configuration                                 |
| Data retention policy                          | TBD    | Privacy and operational requirements                  |
| Privacy notice and consent wording             | TBD    | Must be finalized before public launch                |
| Exact coordinator volunteer-management actions | TBD    | Within assigned department                            |

Important: Duplicate registration prevention is not pending. It has been explicitly removed and must not be implemented.

# 44. Final Business Rules

These are the authoritative business rules for this PRD version.

| ID     | Rule                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| BR-001 | Registration categories are BAL and BLK.                                                                          |
| BR-002 | Each registration receives a unique internal code.                                                                |
| BR-003 | BAL and BLK have independent code sequences.                                                                      |
| BR-004 | Online and on-the-spot registrations share the same category sequence.                                            |
| BR-005 | Registration codes are not shown to public users.                                                                 |
| BR-006 | Duplicate registrations are allowed without warnings or blocking.                                                 |
| BR-007 | The same mobile number may be used for unlimited separate registrations, subject only to general system capacity. |
| BR-008 | A mandatory review step precedes final submission.                                                                |
| BR-009 | Submitted registration details cannot be edited by any role.                                                      |
| BR-010 | Public and on-the-spot registration availability are controlled independently.                                    |
| BR-011 | Public registration supports automatic closing.                                                                   |
| BR-012 | Volunteers use shared BAL or BLK team accounts.                                                                   |
| BR-013 | Coordinators use individual accounts with assigned department access.                                             |
| BR-014 | Admins cannot manage other Admin accounts.                                                                        |
| BR-015 | Only Super Admin can manage Admin accounts.                                                                       |
| BR-016 | Admin and Super Admin can manage Coordinator accounts.                                                            |
| BR-017 | Volunteers can search by name, mobile number, or registration code.                                               |
| BR-018 | Search operates automatically as the user types.                                                                  |
| BR-019 | Card issuance is manual and does not require QR scanning.                                                         |
| BR-020 | Accompanying-person count is required before card issuance confirmation.                                          |
| BR-021 | Card issuance and count storage must be atomic.                                                                   |
| BR-022 | Successful issuance returns the volunteer to a cleared search screen.                                             |
| BR-023 | Volunteers can reverse issued cards.                                                                              |
| BR-024 | Volunteers can edit accompanying-person counts after issuance.                                                    |
| BR-025 | Children present equals active issued-card count.                                                                 |
| BR-026 | Total attendance equals children present plus accompanying persons.                                               |
| BR-027 | Soft-deleted registrations are excluded from active statistics.                                                   |
| BR-028 | Deleted registration codes are never reused.                                                                      |
| BR-029 | Coordinators can delete and restore registrations within their assigned category.                                 |
| BR-030 | Admin statistics refresh manually, not continuously.                                                              |
| BR-031 | Registration export uses Excel `.xlsx`.                                                                           |
| BR-032 | Public registration closing does not remove event information.                                                    |
| BR-033 | Admins can edit event details and event media.                                                                    |
| BR-034 | All application interfaces use English.                                                                           |
| BR-035 | Claymorphism applies only to the public website.                                                                  |
| BR-036 | The system requires an internet connection.                                                                       |
| BR-037 | Individual volunteer activity attribution is not required.                                                        |
| BR-038 | There is no predefined maximum BAL or BLK registration count.                                                     |

# 45. Final Product Definition

BAPS Anandotsav 2026 will be a centralized, responsive, cloud-hosted event registration and operations platform.

It will provide a colorful public registration website, fast mobile-friendly volunteer operations, category-based coordinator management, and comprehensive administrative control.

The product's most important workflows are:

Public registration

```
Select Department
    → Enter Details
    → Review
    → Confirm
    → Registration Successful
```

Event-day card distribution

```
Search Child
    → Verify Registration
    → Issue Card
    → Enter Accompanying Count
    → Confirm
    → Return to Search
```

Attendance calculation

```
Issued Cards
    + Accompanying Persons
    = Total Attendance
```

Administration

```
Manage Registrations
    + Manage Event
    + Manage Accounts
    + View Statistics
    + Export Reports
```

The system must allow repeated registrations without duplicate detection or prevention, while maintaining unique registration numbers, correct card-state transitions, consistent statistics, and secure role-based access.

End of PRD — Version 2.0

This document reflects the finalized requirements and explicitly identifies unresolved details. It is suitable as the baseline for technical design, development planning, implementation, and acceptance testing.