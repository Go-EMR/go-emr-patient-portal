# GoHealth Patient Portal

A HIPAA-compliant patient portal built with Angular 19 and PrimeNG, following Nx-style architecture patterns.

## Architecture

This project follows the Nx-inspired folder structure with clear separation of concerns:

```
src/app/
├── shell/              # Main layout with navigation
│   └── feature/
├── dashboard/          # Dashboard feature
│   ├── feature/        # Smart components (routed)
│   ├── data-access/    # Services, state management
│   └── ui/             # Presentational components
├── appointments/
│   ├── feature/
│   ├── data-access/
│   └── ui/
├── health-records/
│   ├── feature/
│   ├── data-access/
│   └── ui/
├── messages/
│   ├── feature/
│   ├── data-access/
│   └── ui/
├── billing/
│   ├── feature/
│   └── ...
├── forms/
│   ├── feature/
│   └── ...
├── settings/
│   ├── feature/
│   └── ...
├── auth/
│   ├── feature/        # Login, MFA components
│   └── data-access/    # Auth service
└── shared/
    ├── data-access/    # Shared models, services
    ├── ui/             # Shared components
    └── utils/          # Guards, pipes, helpers
```

## Key Concepts

- **feature/** - Smart/container components that are routed
- **data-access/** - Services, state management, API calls
- **ui/** - Presentational/dumb components (receive data via @Input)
- **utils/** - Guards, pipes, validators, helper functions

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Demo Credentials

- Email: patient@demo.com
- Password: demo123
- MFA Code: 123456 (or any 6 digits)

## Features

- ✅ Secure login with MFA
- ✅ Dashboard with health summary
- ✅ Appointment management
- ✅ Health records (medications, labs, allergies, immunizations)
- ✅ Secure messaging
- ✅ Billing & payments
- ✅ Forms & documents
- ✅ User settings

## Tech Stack

- Angular 19 (Standalone components, Signals)
- PrimeNG 19 (UI components)
- PrimeFlex (CSS utilities)
- SCSS (Styling)

## Compliance

Built with HIPAA compliance in mind:
- Secure authentication with MFA
- Session management
- Audit logging (structure in place)
- Role-based access control
