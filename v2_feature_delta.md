# Angular Web vs Flutter — v2 Feature Delta

Comparison of `go-emr-patient-portal/v2_app_features.md` (Angular Web) against `flutter-go-emr-patient-portal/v2_app_features.md` (Flutter Mobile).

---

## Only in Angular Web — not in Flutter

| Section | Feature |
|---------|---------|
| **Auth** | Microsoft SSO (Flutter has Apple instead) |
| **Auth** | Configurable idle session timeout per security policy |
| **Auth** | HIPAA / GDPR / Australian Privacy Act session audit logging |
| **Auth** | WCAG 2.1 Level AA compliant login page |
| **Dashboard** | Health Literacy Mode — "Simple View" toggle |
| **Dashboard** | Reading level selector (Grade 6 default) |
| **Dashboard** | Tooltip system for medical term definitions |
| **Dashboard** | AI-generated daily health brief |
| **Appointments** | Multi-provider appointment linking (specialist referral workflow) |
| **Appointments** | Group appointment / health class booking |
| **Appointments** | Browser-based WebRTC video specifically mentioned |
| **Appointments** | Screen sharing for reviewing documents during consult |
| **Messaging** | Clinician-drafted template responses |
| **Health Records** | Result comparison: side-by-side previous vs current |
| **Health Records** | One-click "What does this mean?" modal |
| **Health Records** | Document error flagging / correction request |
| **Health Records** | Advanced filter by provider, date range, document type, facility |
| **Health Records** | Annotated radiology highlights mapped to image regions |
| **Health Records** | Image download with watermark |
| **Health Records** | WHO-format vaccination certificate download |
| **Health Records** | Screening due-date tracker (breast, colorectal, cervical, prostate, diabetic eye) |
| **Health Records** | Preventive care calendar with age/sex-based reminders |
| **Health Records** | Sensitive result delay configurable per test category |
| **Medications** | Side-effect encyclopedia with plain-language descriptions |
| **Medications** | Medication adherence self-reporting log |
| **Billing** | Insurance coverage check / estimated out-of-pocket before booking |
| **Billing** | Pre-authorization status tracker |
| **Billing** | Explanation of Benefits (EOB) viewer (USA) |
| **Billing** | Billing dispute submission form with document upload |
| **Billing** | Payment plan / installment request |
| **Analytics** | Health score dashboard: composite wellness indicator |
| **Analytics** | Chronic condition management panel (diabetes, hypertension, asthma) |
| **Analytics** | Weight / BMI trend chart with target zone |
| **Analytics** | Blood pressure trend with hypertension guideline overlay |
| **Analytics** | Glucose trend with HbA1c correlation |
| **Analytics** | Patient-reported outcomes (PRO) questionnaires |
| **Accessibility** | AI-powered real-time translation of clinical documents |
| **Accessibility** | Interpreter booking integration (TIS National, NIMDZI) |
| **Accessibility** | Captions on all embedded video content |
| **Accessibility** | All PDFs converted to accessible tagged format |
| **Consent** | Time-limited consent grants (e.g., 6 months) |
| **Consent** | GDPR Article 7 compliant consent records |
| **Consent** | Error correction request form for incorrect clinical data |
| **Consent** | Full audit log of every access event |
| **Admin Tools** | Referral tracker (entire section missing from Flutter) |
| **Admin Tools** | Medical certificate / sick note request |
| **Admin Tools** | Insurance pre-authorization request form |
| **Admin Tools** | Health record sharing with time-limited access link |
| **Admin Tools** | Feedback and complaint portal with reference tracking |
| **Admin Tools** | Post-appointment survey / CAHPS questionnaire |
| **Country: Romania** | EU EHDS compliance roadmap visibility |
| **Country: Romania** | Digital queue management for public hospital OPD |
| **Country: Australia** | Bulk-billing clinic locator via healthdirect API |
| **Country: USA** | CommonWell / Carequality network record retrieval |
| **Country: USA** | CMS Blue Button 2.0 Medicare claims integration |
| **Country: USA** | 21st Century Cures Act compliance |
| **Country: USA** | OpenNotes compliance |

---

## Only in Flutter — not in Angular Web

| Section | Feature |
|---------|---------|
| **Auth** | Apple Sign-In (Web has Microsoft instead) |
| **Auth** | Family member sub-accounts with granular permissions |
| **Auth** | Caregiver / proxy access mode with full audit trail |
| **Auth** | Offline PIN fallback when network unavailable |
| **Onboarding** | Guided Onboarding Wizard (demographics, insurance, emergency contacts, language) |
| **Onboarding** | Photo capture for profile identity |
| **Onboarding** | Accessibility preferences at onboarding |
| **Onboarding** | Medical History Import (ABDM, MHR, manual, CSV/PDF) |
| **Appointments** | Public vs private facility filter (Romania/India two-tier) |
| **Appointments** | Walk-in queue registration with live position updates |
| **Appointments** | Out-of-pocket cost estimate before booking |
| **Appointments** | Push notification reminders: 24h, 2h, 30min |
| **Appointments** | SMS fallback for patients without smartphones |
| **Appointments** | Doctor search by specialty, location, language, rating |
| **Messaging** | Pre-filled patient templates (refill, sick note, follow-up) |
| **Messaging** | One-tap SOS button with location sharing |
| **Messaging** | Nearest emergency facility map with live routes |
| **Messaging** | ICE data display without login |
| **Messaging** | In-app push notifications for message replies |
| **Health Records** | Prescription viewer with plain-language side effects |
| **Health Records** | Offline Access: downloadable health summary card (PDF) |
| **Health Records** | Offline caching of recent records, prescriptions, allergies |
| **Health Records** | Low-bandwidth mode: text-only, stripped images |
| **Medications** | Medication reminder with customizable alarm schedule |
| **Medications** | Medication history archive |
| **Telehealth** | eSanjeevani API integration (India) — standalone section |
| **Telehealth** | Low-bandwidth fallback: audio-only or async text consult |
| **Wearables** | Apple Health / Google Fit / Samsung Health integration (entire section) |
| **Wearables** | Bluetooth glucometer pairing |
| **Wearables** | Home blood pressure monitor integration |
| **Wearables** | Pulse oximetry data logging |
| **Wearables** | AI-driven alert for out-of-range vitals |
| **Wearables** | Periodic wellness check-in questionnaire |
| **Billing** | Receipt download and email forwarding |
| **Notifications** | Granular preferences per category |
| **Notifications** | Do Not Disturb scheduling with emergency override |
| **Notifications** | SMS fallback for critical notifications |
| **Accessibility** | Dynamic text scaling (S / M / L / XL / XXL) |
| **Accessibility** | High-contrast dark mode for outdoor readability |
| **Accessibility** | Assisted mode: simplified UI for low-literacy users |
| **Consent** | Verifiable data erasure confirmation |
| **Country: India** | WhatsApp deep-link fallback |
| **Country: India** | 22-language support for voice and text |
| **Country: Romania** | Roma community mediator access mode |
| **Country: Romania** | SMS / USSD menu for feature-phone users |
| **Country: Australia** | Aboriginal and Torres Strait Islander culturally safe care indicator |
| **Country: USA** | MyChart Central compatible patient profile |
| **Meta** | Implementation Priority Matrix (P0-P3 with complexity/impact) |

---

## Summary

|  | Angular Web | Flutter | Shared |
|---|---|---|---|
| Unique features | ~55 | ~45 | ~40 |

### Key thematic differences

- **Angular Web** is stronger on: health literacy/AI, admin tools, compliance (GDPR/Cures Act/OpenNotes), advanced analytics, document management
- **Flutter** is stronger on: offline/low-bandwidth, wearable integrations, mobile-native features (push notifications, SOS, camera), accessibility modes (text scaling, assisted mode), feature-phone fallbacks (SMS/USSD)
