# GoHealth Patient Portal - Feature List

## Authentication & Security

### Login (`/login`)
- Email/password authentication form
- Demo account quick-fill functionality
- Remember me checkbox
- Error message display with loading state indicator
- HIPAA compliance badge and 256-bit encryption indicator
- Form validation

### Multi-Factor Authentication (`/mfa`)
- 6-digit OTP code input (PrimeNG InputOtp)
- Code verification
- Resend code via SMS or Email
- Error and success messaging
- End-to-end encryption indicator
- Back to login option

### Route Guards
- `authGuard` - Protects authenticated routes, redirects to login
- `mfaGuard` - Enforces MFA verification when enabled
- `guestGuard` - Prevents authenticated users from accessing login

### Session Management
- LocalStorage-based session persistence
- Session expiration (30 minutes)
- Automatic session restoration on page reload
- Logout functionality

---

## Dashboard (`/dashboard`)

### Welcome Banner
- Personalized greeting based on time of day
- User name display and health summary message
- Quick action buttons (Book Appointment, Send Message)

### Health Summary Stats
- Upcoming appointments count
- Unread messages count with badge
- New lab results count with badge
- Outstanding balance display
- Skeleton loading states
- Clickable stats for navigation

### Next Appointment Card
- Appointment date, time, and type
- Provider name, specialty, and avatar
- Location name or video visit indicator
- Join video / Check-in button
- Reschedule button

### Recent Vitals Display
- Blood pressure, heart rate, weight, oxygen saturation
- Trend indicators (up/down/stable arrows)
- Recorded dates
- Responsive grid layout (2 columns desktop, 1 column mobile)

### Active Medications Panel
- Medication name, dosage, and frequency
- Refills remaining count
- Request refill button
- First 3 medications shown in preview

### Recent Messages Panel
- Message threads list (up to 3)
- Unread count with badge
- Subject and preview text with timestamp
- Click to open full conversation

---

## Appointments (`/appointments`)

### Appointment Listing
- Tab view: Upcoming / Past appointments
- Date badge with month, day, time
- Provider name, specialty, and location
- Appointment type and status display

### Appointment Actions
- Join video call (telehealth appointments)
- Check-in (in-person appointments)
- Reschedule and cancel appointment

### Book New Appointment
- Dialog-based booking form
- Visit type selector (Annual Physical, Follow-up, Sick Visit)
- Date picker with minimum date validation
- Find availability button

---

## Health Records (`/records`)

### Medications Tab
- Medication cards grid layout
- Medication name, generic name, dosage, and frequency
- Prescriber information
- Active/discontinued/completed status
- Refills remaining with request refill button
- Controlled substance indicator (orange border)
- Instructions display

### Lab Results Tab
- Paginated table (10 rows per page)
- Test name with NEW badge for recent results
- Result date, ordered by provider
- Status display (ordered, collected, processing, resulted, reviewed)
- Abnormal flag indicator
- View results button

### Allergies Tab
- Allergy cards with allergen name (drug, food, environmental)
- Reaction description
- Severity level (mild, moderate, severe, life-threatening)
- Color-coded severity indicators

### Immunizations Tab
- Immunization table with vaccine name and date
- Administration location
- Series completion status
- Next dose date (when applicable)
- Color-coded status tags

---

## Messages (`/messages`, `/messages/:id`)

### Threads List
- Search/filter messages
- Thread items with provider avatar, sender name, subject
- Message preview text and last message date
- Unread message badge
- Active and unread thread highlighting

### Message View
- Conversation header with subject
- Message category (general, appointment, prescription, lab results, billing, referral)
- Message bubbles with sender info, avatar, and timestamp
- Sent/received indicators

### Compose & New Message
- Reply text area with send button
- New message dialog with recipient selector, subject, and message body

---

## Billing (`/billing`)

### Billing Summary Cards
- Current balance display with pay now button
- Pending claims count
- Insurance status
- Color-coded cards with icons

### Statements Tab
- Table view with statement number, date, due date, amount
- Status badges (pending, paid, partial, overdue)
- View details and download PDF buttons

### Payment History Tab
- Records of all payments made
- Payment dates, amounts, and method

### Insurance Tab
- Insurance provider name and status (Primary, Secondary)
- Member ID, group number, plan type (PPO, HMO, etc.)
- Update insurance button

### Payment Dialog
- Outstanding balance display
- Secure payment processor note
- Continue to payment button

---

## Forms & Documents (`/forms`)

### Pending Forms Tab
- Form cards with icon, title, and description
- Due date with calendar icon
- Progress bar with percentage
- Status badge (pending, in_progress)
- Start/Continue button based on progress

### Completed Forms Tab
- Completed form cards with checkmark icon
- Completion date
- View and download buttons

### Supported Form Types
- Pre-visit health questionnaires
- HIPAA acknowledgments
- New patient registration
- Medical history forms
- Consent and financial forms

---

## Settings (`/settings`)

### Profile Information
- First name, last name, email, phone inputs
- Save changes button with pre-populated data

### Security
- Two-factor authentication toggle
- Change password button (with last changed date)
- Trusted devices management

### Notifications
- Email, SMS, and appointment reminder toggles
- Customizable notification preferences

### Preferences
- Language selector (English, Spanish)
- Time zone selector (Eastern, Central, Pacific)
- Paperless statements toggle

---

## Shell & Navigation

### Sidebar Navigation
- Logo with heart icon and "GoHealth" branding
- Collapsible sidebar with smooth animation
- Navigation items: Dashboard, Appointments, Health Records, Messages (with unread badge), Billing, Forms, Settings
- Active route highlighting
- Tooltip support for collapsed state

### User Information Footer
- User avatar with initials
- User name and MRN display
- Sign out button

---

## Shared UI Components

### Stat Card Component
- Card with icon, value, and label
- Multiple variants (appointments, messages, labs, balance)
- Optional badge display with hover effects

### Vitals Grid Component
- Grid display of vital signs with icons
- Trend indicators and color-coded vital types
- Value, unit, and recorded date display

### Appointment Card Component
- Date badge, provider info with avatar
- Location/telehealth indicator
- Action buttons and empty state handling

---

## Data Models (USCDI v5 / FHIR R4 Compliant)

- **Appointment** - Full details with provider/location, telehealth support, status tracking
- **Medication** - Name, dosage, frequency, refill tracking, controlled substance flag
- **Lab Results** - Test details, components with reference ranges, abnormal flags
- **Allergies** - Allergen, reaction, severity, type classification
- **Vitals** - Multiple vital sign types with units and trend tracking
- **Immunizations** - Vaccine details, series completion, next dose scheduling
- **Messages** - Thread organization, category classification, unread tracking
- **Forms** - Type, progress tracking, due dates, appointment association
- **Billing/Statements** - Line items, balance calculation, payment tracking
- **Patient User** - Profile, MRN, MFA configuration, preferences

---

## Cross-Cutting Features

### HIPAA Compliance
- Security badges on login page
- Encryption indicators (256-bit)
- End-to-end encryption messaging
- Secure session management
- HIPAA acknowledgment forms

### Accessibility & Responsive Design
- Mobile-first responsive design
- Sidebar collapse for mobile devices
- Tooltip support and form labels
- Keyboard navigation support

### Loading & State Management
- Skeleton loaders for async operations
- Loading indicators on buttons
- Signal-based reactive state with computed properties
- Error and success message display

### Demo Account Support
- Pre-configured demo credentials (`patient@demo.com` / `demo123`)
- Quick-fill demo button on login
- Any 6-digit code accepted for MFA demo
- Mock data loading for all features

### Technical Stack
- Angular 19 standalone components (no NgModules)
- Signal-based state management (not RxJS)
- OnPush change detection strategy
- Lazy-loaded route components
- PrimeNG UI library
