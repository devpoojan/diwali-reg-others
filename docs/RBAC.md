# Role-Based Access Control (RBAC) Specification

## BAPS Anandotsav 2026
### Authorization, Roles & Permissions Model

**Document Version:** 1.0  
**Date:** October 17, 2026  
**Status:** Approved RBAC Baseline  

---

## 1. Role Definitions & Hierarchy

```
+-------------------------------------------------------------+
|                        SUPER ADMIN                          |
|  - Full system authority                                    |
|  - Exclusive management of Admin accounts                   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                           ADMIN                             |
|  - Manages Coordinators & Volunteer shared accounts         |
|  - Manages Event Settings & Registration Availability       |
|  - Manages BAL & BLK Registrations (soft-delete, restore)   |
|  - Manual Dashboard Refresh & Excel Exports                 |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                        COORDINATOR                          |
|  - Individual login assigned to: BAL_ONLY, BLK_ONLY, or BOTH|
|  - Operational actions + Soft-Delete/Restore in assigned cat|
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                         VOLUNTEER                           |
|  - Shared team accounts (BAL Volunteer, BLK Volunteer)      |
|  - Search, Quick Register, Issue/Reverse Card, Edit Count   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                          PUBLIC                             |
|  - No account / No login required                           |
|  - Submit registration, view event details                  |
+-------------------------------------------------------------+
```

---

## 2. Permissions Matrix

| Operational Capability | Public | Volunteer | Coordinator | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Event Info & Branding | Yes | Yes | Yes | Yes | Yes |
| Submit Online Registration | Yes | Yes | Yes | Yes | Yes |
| View Internal Registration Code | **No** | Assigned Cat | Assigned Cat | All | All |
| Search Registrations (Search-as-you-type) | **No** | Assigned Cat | Assigned Cat | All | All |
| Issue Physical Games Card | **No** | Assigned Cat | Assigned Cat | All | All |
| Reverse Card (`ISSUED` $\rightarrow$ `NOT_ISSUED`) | **No** | Assigned Cat | Assigned Cat | All | All |
| Edit Accompanying Person Count | **No** | Assigned Cat | Assigned Cat | All | All |
| Quick Registration (On-the-spot) | **No** | Assigned Cat | Assigned Cat | All | All |
| Soft-Delete Registration | **No** | **No** | Assigned Cat | All | All |
| Restore Soft-Deleted Registration | **No** | **No** | Assigned Cat | All | All |
| View Operational / Attendance Statistics | **No** | **No** | Assigned Cat | All | All |
| Refresh Admin Dashboard (Manual) | **No** | **No** | **No** | All | All |
| Export Data to Excel (`.xlsx`) | **No** | **No** | **No** | All | All |
| Edit Event Details & Media Uploads | **No** | **No** | **No** | Yes | Yes |
| Manage Registration Availability Toggles | **No** | **No** | **No** | Yes | Yes |
| Manage Coordinator Accounts | **No** | **No** | **No** | Yes | Yes |
| Manage Volunteer Shared Account Credentials| **No** | **No** | **No** | Yes | Yes |
| Create / Disable Admin Accounts | **No** | **No** | **No** | **No** | **Yes** |
| Edit Submitted Registration Personal Details| **NO** | **NO** | **NO** | **NO** | **NO** |

*Note: Edit of original submitted registration details is strictly prohibited across **ALL** roles, including Super Admin.*

---

## 3. Account Models

### 3.1 Individual Staff Accounts
- Used by: **Super Admin**, **Admin**, **Coordinator**.
- Authenticated via Firebase Authentication (Email/Password).
- Profile stored in `users/{uid}`.
- Distinct credentials per staff member.

### 3.2 Shared Volunteer Accounts
- Used by: Ground volunteers at the event.
- Accounts:
  - `bal.volunteer@anandotsav.baps.org` (Department: `BAL`)
  - `blk.volunteer@anandotsav.baps.org` (Department: `BLK`)
- Multiple physical devices (20–50+ volunteers) will log into the same team account concurrently.
- No session invalidation on concurrent logins.
- Volunteers do not have individual attribution or personal accounts.

---

## 4. Department Scope Isolation

```typescript
export type DepartmentAccess = "BAL_ONLY" | "BLK_ONLY" | "BOTH";
```

Department boundaries are strictly isolated at the server level:
1. A user with `BAL_ONLY` (such as the BAL Volunteer shared account or a BAL Coordinator):
   - Queries to `/registrations` **must** enforce `category == 'BAL'`.
   - Card operations on a `BLK` registration will be rejected with HTTP 403 / Firestore permission-denied.
2. A user with `BLK_ONLY`:
   - Queries to `/registrations` **must** enforce `category == 'BLK'`.
   - Card operations on a `BAL` registration will be rejected.
3. Users with `BOTH` (Admin, Super Admin, or assigned Coordinators):
   - May view and operate on both categories.

---

## 5. Token Custom Claims & Server-Side Enforcement

Firebase Auth custom claims are refreshed on token issuance:
```json
{
  "role": "COORDINATOR",
  "categoryAccess": "BAL_ONLY",
  "accountStatus": "ACTIVE"
}
```

### Callable Cloud Functions Middleware:
```typescript
interface AuthContext {
  uid: string;
  role: UserRole;
  categoryAccess: DepartmentAccess;
  isActive: boolean;
}

export function authorize(
  requiredRoles: UserRole[],
  targetCategory?: "BAL" | "BLK"
) {
  return (context: AuthContext) => {
    if (!context.isActive) {
      throw new HttpsError("permission-denied", "Account is disabled.");
    }
    if (!requiredRoles.includes(context.role)) {
      throw new HttpsError("permission-denied", "Insufficient role privileges.");
    }
    if (targetCategory && context.categoryAccess !== "BOTH") {
      const allowed = context.categoryAccess === `${targetCategory}_ONLY`;
      if (!allowed) {
        throw new HttpsError("permission-denied", "Category access restricted.");
      }
    }
  };
}
```
