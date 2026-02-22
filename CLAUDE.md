# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoHealth Patient Portal - A HIPAA-compliant patient portal built with Angular 21 and PrimeNG 21. Despite the repository name, this is a TypeScript/Angular project, not Go.

## Commands

```bash
npm start          # Start dev server at http://localhost:4200
npm run build      # Production build to dist/patient-portal
npm test           # Run tests with Karma
npm run lint       # Run linting
```

## Architecture

This project follows Nx-style folder structure with standalone Angular 19 components and Signal-based state management.

### Folder Pattern
Each feature module follows this structure:
- `feature/` - Smart/container components (routed, handle logic)
- `data-access/` - Services with Signal-based state management
- `ui/` - Presentational components (receive data via @Input)
- `utils/` - Guards, pipes, helpers

### Main Features
- **shell/** - Main layout with sidebar navigation
- **auth/** - Login and MFA verification
- **dashboard/** - Health summary, appointments, vitals, medications
- **appointments/** - Appointment management with telehealth support
- **health-records/** - Medications, labs, allergies, immunizations
- **messages/** - Secure messaging threads
- **billing/** - Statements and payments
- **forms/** - Patient forms and documents
- **settings/** - User preferences

### Path Aliases
Configured in `tsconfig.json`:
- `@shared/*`, `@auth/*`, `@dashboard/*`, `@appointments/*`, `@health-records/*`, `@messages/*`, `@billing/*`, `@forms/*`, `@settings/*`

## Key Patterns

### State Management
Uses Angular Signals (not RxJS observables):
```typescript
private _data = signal<T[]>([]);
readonly data = this._data.asReadonly();
readonly computed = computed(() => this._data().filter(...));
```

### Component Pattern
All components are standalone with OnPush change detection. Smart components in `feature/` orchestrate data; presentational components in `ui/` are pure.

### Route Guards
- `authGuard` - Requires authentication
- `mfaGuard` - Requires MFA verification when enabled
- `guestGuard` - Prevents authenticated users from accessing login

### Backend Communication
`EmrSyncService` in `shared/data-access/` handles backend communication (currently stubbed with mock data).

## Demo Credentials
- Email: patient@demo.com
- Password: demo123
- MFA Code: 123456 (or any 6 digits)

## Data Models
Domain interfaces in `shared/data-access/models.ts` follow USCDI v5 / FHIR R4 patterns.
