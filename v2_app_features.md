# GoHealth Patient Portal — v2 Feature Roadmap

Features from the dream specification not yet implemented in the current app.

---

## 1. Authentication & Access

### Login Methods (New)
- Phone OTP fallback (for patients without email)
- Social login: Google, Microsoft (institutional SSO for corporate health plans)
- ABHA Health ID via ABDM (India) / IHI via myGov (Australia) / CNP / eID (Romania)
- SMART on FHIR OAuth2 for US EHR system login (Epic, Oracle Health, athenahealth)

### Session & Security (New)
- Role-based sessions: patient, caregiver, proxy, ASHA worker (India), community mediator (Romania)
- Configurable idle session timeout per security policy
- HIPAA / GDPR / Australian Privacy Act compliant session audit logging
- WCAG 2.1 Level AA compliant login page (US ADA mandate)

---

## 2. Dashboard Enhancements

### Health Alerts Panel (New)
- Flagged results, missed medications, overdue screenings

### Health Literacy Mode (New)
- "Simple View" toggle: converts medical dashboard to plain-language summaries
- Reading level selector (Grade 6 default) applied across all content
- Tooltip system: hover/tap any medical term for plain-language pop-over definition
- AI-generated daily health brief: one-paragraph summary of current health status

---

## 3. Appointments

### Booking & Scheduling (New)
- Full-featured calendar: specialty, doctor, location, insurance, language filter
- Real-time slot availability pulled from GoEMR EMR backend
- Waitlist registration with automated slot-open notification
- Multi-provider appointment linking (specialist referral workflow)
- Group appointment / health class booking (diabetes education, antenatal classes)

### Telehealth (New)
- Browser-based WebRTC video consultation (no plugin required)
- Pre-consult AI intake form: structured symptom history before doctor joins
- Waiting room with countdown, preparation tips, and connection test
- Screen sharing for reviewing documents/results during consultation
- Post-consult: downloadable consultation notes, e-prescription, follow-up plan

### Management (New)
- Request repeat referrals from appointment history
- Policy-driven cancel/reschedule confirmation
- Google / iCal calendar export
- SMS and email reminders configurable per patient

---

## 4. Smart Triage & Messaging

### Triage Gateway (New — replaces free-text entry)
- Landing screen: "What do you need help with today?" with category tiles
- Category tiles: Urgent symptoms, Medication question, Appointment, Test results, Billing, Other
- Urgent symptoms path: short symptom checklist → AI urgency score → redirect to emergency services or urgent booking
- Chest pain / breathing difficulty / stroke symptoms → immediate 3-click emergency redirect with local number displayed

### Structured Messaging Enhancements (New)
- Mandatory subject category and optional file attachment
- Routing rules: clinical queries → physician, billing → admin, refills → pharmacist/nurse
- SLA display: "Expect a response within 2 business days"
- Read receipts and status indicators: Sent, Delivered, Read, Responded
- Clinician-drafted template responses

---

## 5. Health Records & Results

### Lab Results (New)
- Plain-language AI interpretation panel alongside each result
- Trend chart (line graph) for longitudinal tests: HbA1c, lipid panel, renal function
- Result comparison: side-by-side previous vs current
- One-click "What does this mean?" modal with patient education content
- Result notification setting: immediate release vs after provider review
- Sensitive result delay configurable per test category (Australia My Health Record compliance)

### Clinical Documents (New)
- Document library: discharge summaries, referral letters, clinical notes (OpenNotes compliant for USA)
- AI-generated lay summary for each clinical document
- Document error flagging: patient can request correction via structured feedback form
- Advanced filter: by provider, date range, document type, facility

### Imaging (New)
- DICOM image viewer embedded in browser (zero-footprint, no plugin)
- Report viewer alongside image viewer in split-pane layout
- Annotated radiology report highlights mapped to image regions
- Image download with watermark for sharing with other providers

### Immunization & Preventive Health (New)
- WHO-format vaccination certificate download (for travel)
- Screening due-date tracker: breast cancer, colorectal, cervical, prostate, diabetic eye
- Preventive care calendar with age/sex-based automated reminders

---

## 6. Medications (New)

- Drug interaction checker across full active medication list
- Side-effect encyclopedia with plain-language descriptions
- E-prescription viewer and pharmacy sharing (QR code or direct e-send)
- Refill request triage gate (not for opioids/controlled substances without appointment)
- Medication adherence self-reporting log
- PBS Active Script List integration (Australia)
- Jan Aushadhi / government pharmacy locator (India)

---

## 7. Billing & Insurance (New)

- Invoice dashboard: paid, unpaid, insurance-pending, disputed
- Itemized invoice view with service codes and plain-language descriptions
- Insurance coverage check: eligible services and estimated out-of-pocket before booking
- Pre-authorization status tracker
- Online payment: credit/debit card, UPI (India), BPAY (Australia), direct debit
- Explanation of Benefits (EOB) viewer (USA)
- CNAS reimbursement tracker (Romania)
- PM-JAY / Ayushman Bharat scheme status (India)
- Billing dispute submission form with document upload
- Payment plan / installment request for large invoices

---

## 8. Personal Health Analytics (New — Entire Section)

- Health score dashboard: composite wellness indicator updated after each encounter
- Chronic condition management panel: dedicated views for diabetes, hypertension, asthma
- Weight / BMI trend chart with target zone visualization
- Blood pressure trend with hypertension guideline overlay
- Glucose trend (fasting, post-meal) with HbA1c correlation
- Sleep, steps, and activity data from wearable integrations
- Patient-reported outcomes (PRO) questionnaires with longitudinal scoring

---

## 9. Accessibility & Multilingual Support (New — Extensive Expansion)

### Language Support
- **India:** Hindi, Tamil, Bengali, Telugu, Marathi, Kannada + 16 other scheduled languages
- **Romania:** Romanian and Hungarian (legally required in minority-majority areas)
- **Australia:** Top 20 community languages (Vietnamese, Mandarin, Cantonese, Arabic, Italian, Greek...)
- **USA:** Spanish, Mandarin, Vietnamese, Tagalog, French Creole
- AI-powered real-time translation of uploaded clinical documents
- Interpreter booking integration: TIS National (Australia), NIMDZI-listed services (USA / Romania)

### Accessibility Standards (New)
- WCAG 2.1 Level AA on all 8 critical portal workflows
- Screen reader support: NVDA, JAWS, VoiceOver compatible
- Keyboard-only navigation for all features
- Minimum 4.5:1 colour contrast ratio throughout
- Captions on all embedded video content
- All PDFs converted to accessible tagged format

---

## 10. Consent, Privacy & Data Control (New Enhancements)

### Consent Management (New)
- Visual map of which organizations access which record categories
- Time-limited consent grants (e.g., specialist access for 6 months only)
- One-click consent revocation with immediate effect
- ABDM consent manager protocol (India)
- GDPR Article 7 compliant consent records (Romania / EU)
- Australian Privacy Act 1988 / My Health Records Act compliant
- HIPAA authorization records (USA)

### Patient Data Rights (New)
- Full audit log: timestamped record of every access event by provider/system
- Data portability: export full health record as FHIR Bundle (JSON / XML) or PDF
- Error correction request form: structured dispute for incorrect clinical data
- Research participation dashboard: opt-in/out of de-identified data studies with usage transparency

---

## 11. Patient-Facing Admin Tools (New — Entire Section)

- Referral tracker: status of specialist referrals from GP
- Medical certificate / sick note request (structured form, not free message)
- Insurance pre-authorization request form
- Health record sharing: generate time-limited access link for a specific provider
- Feedback and complaint submission portal with reference number tracking
- Post-appointment survey / CAHPS questionnaire

---

## 12. Country-Specific Features (New — Entire Section)

### India
- ABHA Health ID management and QR code generation
- ABDM-linked health locker with records from all linked hospitals
- eSanjeevani telemedicine integration
- Jan Aushadhi pharmacy locator and price comparison
- ASHA worker proxy portal mode
- CoWIN vaccination certificate retrieval

### Romania
- DES (Dosarul Electronic de Sănătate) read integration
- CNAS e-prescription and sick leave certificate status
- Romanian / Hungarian / English trilingual interface
- EU EHDS (European Health Data Space) compliance roadmap visibility
- Digital queue management for public hospital outpatient departments

### Australia
- My Health Record read/write via Australian Digital Health Agency FHIR API
- Medicare Benefits Schedule item description lookup
- PBS prescription status via Active Script List
- Culturally appropriate First Nations health content and imagery
- TIS National interpreter booking integration
- Bulk-billing clinic locator via healthdirect API

### USA
- SMART on FHIR EHR launch context (launchable from within Epic, Oracle Health)
- CommonWell / Carequality network record retrieval for cross-provider history
- CMS Blue Button 2.0 Medicare claims data integration
- 21st Century Cures Act compliance: all records released within 1 business day
- OpenNotes compliant: clinical notes released to patients immediately
