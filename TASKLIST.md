# Patient Portal Gap Analysis — Implementation Tasklist

## Gap Analysis Summary

Compared doctor EMR (`go-emr-fe`, 333 components, 28 domains) against the patient portal (`go-emr-patient-portal`). These features exist in the doctor app and require patient-facing counterparts:

---

## Tasks

### 1. Forgot Password & Reset Password Flow
- **Gap:** Doctor app has `/auth/forgot-password` + `/auth/reset-password`. Patient portal only had login + MFA.
- **Priority:** CRITICAL
- **Files created:**
  - `src/app/auth/feature/forgot-password.component.ts`
  - `src/app/auth/feature/reset-password.component.ts`
- **Routes:** `/forgot-password` (guestGuard), `/reset-password` (guestGuard)
- **Status:** [x] DONE

### 2. Digital Check-In (Pre-Arrival)
- **Gap:** Doctor app has `check-in-kiosk.component.ts`. Patients could not check in remotely.
- **Priority:** HIGH
- **Files created:**
  - `src/app/check-in/feature/check-in.component.ts`
  - `src/app/check-in/data-access/check-in.service.ts`
- **Route:** `/check-in/:appointmentId`
- **Features:** 5-step flow — demographics, insurance, consent, arrival, confirmation with token
- **Status:** [x] DONE

### 3. Visit Summaries (After-Visit Summary / AVS)
- **Gap:** Doctor app has encounter documentation. Patient portal had no structured visit summary view.
- **Priority:** HIGH
- **Files created:**
  - `src/app/visit-summaries/feature/visit-summaries.component.ts`
  - `src/app/visit-summaries/data-access/visit-summaries.service.ts`
- **Route:** `/visit-summaries`
- **Features:** List + detail dialog with vitals, diagnoses (ICD + plain language), treatment plan, meds, labs, referrals, warning signs
- **Status:** [x] DONE

### 4. Care Plans
- **Gap:** Doctor app has `shared-care-plans.component.ts`. Patient portal had zero care plan visibility.
- **Priority:** HIGH
- **Files created:**
  - `src/app/care-plans/feature/care-plans.component.ts`
  - `src/app/care-plans/data-access/care-plans.service.ts`
- **Route:** `/care-plans`
- **Features:** Active/completed tabs, goals with progress, interactive activity checkboxes, provider notes
- **Status:** [x] DONE

### 5. Queue Position & Wait Time Display
- **Gap:** Doctor app has queue-board + token-display. Patients had no queue visibility.
- **Priority:** HIGH
- **Files created:**
  - `src/app/queue-status/feature/queue-status.component.ts`
  - `src/app/queue-status/data-access/queue-status.service.ts`
- **Route:** `/queue-status`
- **Features:** Token display, position tracker, SVG wait gauge, status timeline, auto-refresh
- **Status:** [x] DONE

### 6. Waitlist Management (Patient-side)
- **Gap:** Doctor app has `waitlist.component.ts`. Patient portal had no waitlist visibility.
- **Priority:** MEDIUM
- **Files created:**
  - `src/app/waitlist/feature/waitlist.component.ts`
  - `src/app/waitlist/data-access/waitlist.service.ts`
- **Route:** `/waitlist`
- **Features:** Position tracking, slot-available alerts with countdown, accept/decline, notification prefs
- **Status:** [x] DONE

---

## Modified Files
- `src/app/app.routes.ts` — 5 new routes added
- `src/app/shell/feature/shell.component.ts` — 4 new nav items
- `src/app/shared/data-access/models.ts` — 11 new interfaces
- `src/app/auth/feature/index.ts` — barrel exports for new auth components

## Build Status: PASSING
