/* =========================================================
   GoHealth Flow Demo — Application Logic
   Theme: #001524, #15616D, #FFECD1, #FF7D00, #78290F
   Expanded: 10 Pillars, 30 Flows, 50+ Feature Modules
   ========================================================= */

const FLOWS = [
  {
    id: 'patient-signup',
    num: '01',
    title: 'Patient Sign-Up & Identity Verification',
    desc: 'Complete onboarding journey from account creation to identity proofing — covering email registration, MFA setup, KBA verification, and HIPAA consent capture.',
    tags: ['Registration', 'MFA', 'Identity', 'Consent'],
    steps: [
      { title: 'Create Account', text: 'A new patient registers with email. The system validates format, checks duplicates, and sends a verification link with a branded welcome message.', module: 'Registration', benefits: ['Email verification prevents fake accounts', 'Duplicate detection avoids multiple records', 'Branded welcome sets onboarding expectations'] },
      { title: 'Email Verification & Profile', text: 'Patient clicks the link and completes their profile — name, DOB, phone, emergency contact. Fields are validated in real-time with auto-suggestions.', module: 'Registration', benefits: ['Real-time validation catches errors before submission', 'Progressive form design reduces cognitive load', 'Emergency contact ensures safety for urgent situations'] },
      { title: 'Multi-Factor Authentication', text: 'Patient enables MFA via authenticator app QR code or SMS. Recovery codes are generated for backup access scenarios.', module: 'MFA', benefits: ['TOTP and SMS options give flexibility', 'Required MFA meets HIPAA security standards', 'Recovery codes prevent permanent lockout'] },
      { title: 'Identity Proofing', text: 'For medical record access, the patient uploads a government ID and answers knowledge-based questions matched against healthcare databases.', module: 'Identity Verification', benefits: ['KBA prevents unauthorized record access', 'ID document adds physical identity verification', 'Proofing level determines accessible records'] },
      { title: 'Consent & Activation', text: 'Patient accepts terms, privacy policy, and HIPAA consent with digital signature. Account activates and directs to the dashboard with a provider-linking prompt.', module: 'Consent Forms', benefits: ['Digital consent eliminates paper forms', 'Timestamped acceptance creates audit trail', 'Guided activation reduces time-to-value'] }
    ],
    businessValue: [
      { icon: '🔐', metric: 'HIPAA', desc: 'Compliant verification' },
      { icon: '⚡', metric: '<3 min', desc: 'Account creation' },
      { icon: '🛡️', metric: '100%', desc: 'MFA-protected' },
      { icon: '📝', metric: 'Digital', desc: 'Consent capture' }
    ],
    features: ['Registration', 'MFA', 'Identity Verification', 'Consent Forms', 'Dashboard', 'Notifications']
  },
  {
    id: 'profile-setup',
    num: '02',
    title: 'Profile Setup & Demographics',
    desc: 'Completing a comprehensive patient profile with demographics, communication preferences, insurance details, and health history import via FHIR.',
    tags: ['Profile', 'Demographics', 'Insurance', 'Preferences'],
    steps: [
      { title: 'Complete Demographics', text: 'Patient fills in address (auto-suggested), preferred language, race/ethnicity, and communication preferences with real-time validation.', module: 'Demographics', benefits: ['Auto-suggest reduces data entry errors', 'Language preference ensures correct communications', 'Demographics support population health analytics'] },
      { title: 'Insurance Card Scan', text: 'Patient photographs their insurance card. OCR extracts member ID, group number, and plan info automatically. Manual entry is also available.', module: 'Insurance', benefits: ['OCR scanning reduces manual entry by 80%', 'Real-time eligibility confirms coverage', 'Multiple plans supported for coordination of benefits'] },
      { title: 'Communication Preferences', text: 'Patient configures notification channels (email, SMS, push) for appointments, results, billing, and health tips with quiet-hours support.', module: 'Preferences', benefits: ['Granular control reduces alert fatigue', 'Preferred channels increase open rates', 'Quiet hours respect patient lifestyle'] },
      { title: 'Health History Import', text: 'Patient imports records from previous providers through FHIR-based data exchange. Allergies, medications, immunizations, and conditions are auto-structured.', module: 'Health Records', benefits: ['FHIR import eliminates manual re-entry', 'Structured data enables clinical decision support', 'Complete history gives providers full context'] }
    ],
    businessValue: [
      { icon: '📸', metric: 'OCR', desc: 'Insurance card scanning' },
      { icon: '🔄', metric: 'FHIR', desc: 'Data exchange' },
      { icon: '⏱️', metric: '5 min', desc: 'Profile completion' },
      { icon: '🌐', metric: '20+', desc: 'Languages supported' }
    ],
    features: ['Demographics', 'Insurance', 'Preferences', 'Health Records', 'Profile', 'FHIR']
  },
  {
    id: 'family-linking',
    num: '03',
    title: 'Family Account Linking & Proxy Access',
    desc: 'Linking family members for proxy healthcare management — managing dependents, elderly parents, and shared health information with age-based access controls.',
    tags: ['Family', 'Proxy Access', 'Pediatric', 'Elder Care'],
    steps: [
      { title: 'Add Family Member', text: 'A parent initiates linking by entering their child\'s name and DOB. The system verifies the relationship through matching against registration data.', module: 'Family Linking', benefits: ['DOB matching prevents unauthorized linking', 'Relationship verification ensures proper access', 'Support for multiple relationship types'] },
      { title: 'Configure Proxy Permissions', text: 'The parent sets proxy access level — full access for young children, limited access for teens, view-only for elderly parents. Permissions are granular per record type.', module: 'Proxy Access', benefits: ['Granular permissions match real-world needs', 'Age-based rules auto-adjust as children grow', 'Record-type filtering protects sensitive information'] },
      { title: 'Family Dashboard Setup', text: 'All linked members appear on a unified family dashboard with health summaries, upcoming appointments, and action items for each member.', module: 'Family Dashboard', benefits: ['Single view manages entire family health', 'Per-member action items prevent missed care', 'Color-coded status shows who needs attention'] },
      { title: 'Family Health Pedigree', text: 'The family health history pedigree chart captures genetic conditions across generations — supporting clinical risk assessment and genetic counseling.', module: 'Pedigree Chart', benefits: ['Multi-generational view reveals hereditary patterns', 'Standardized pedigree format supports genetic counseling', 'Condition tracking informs screening recommendations'] },
      { title: 'Consent & Notification', text: 'Adult family members receive consent requests for proxy access. Accepted links activate bidirectional notifications for care events.', module: 'Consent Forms', benefits: ['Consent ensures informed participation', 'Bidirectional notifications keep all parties informed', 'Revocable access maintains individual autonomy'] }
    ],
    businessValue: [
      { icon: '👨‍👩‍👧‍👦', metric: 'Family', desc: 'Multi-member management' },
      { icon: '🧬', metric: 'Pedigree', desc: 'Genetic history mapping' },
      { icon: '🔒', metric: 'Granular', desc: 'Age-based permissions' },
      { icon: '📊', metric: 'Unified', desc: 'Family health dashboard' }
    ],
    features: ['Family Linking', 'Proxy Access', 'Family Dashboard', 'Pedigree Chart', 'Consent Forms', 'Notifications']
  },
  {
    id: 'provider-search',
    num: '04',
    title: 'Provider Search & Appointment Booking',
    desc: 'Finding the right provider by specialty, location, insurance, and availability — then booking with real-time calendar integration and insurance eligibility checks.',
    tags: ['Provider Search', 'Scheduling', 'Calendar', 'Insurance'],
    steps: [
      { title: 'Search by Specialty & Location', text: 'Patient searches for a dermatologist within 10 miles. Results show proximity, ratings, languages, and next available slots with insurance acceptance.', module: 'Provider Directory', benefits: ['Location-based search prioritizes convenience', 'Insurance filtering eliminates surprise costs', 'Provider ratings inform patient choice'] },
      { title: 'View Provider Profile', text: 'Patient views credentials, specialties, languages, office photos, patient reviews, and a real-time availability calendar.', module: 'Provider Directory', benefits: ['Comprehensive profiles build confidence', 'Real-time availability eliminates phone calls', 'Peer reviews provide quality perspective'] },
      { title: 'Select Slot & Visit Type', text: 'Patient selects a 2 PM slot and chooses between new patient, follow-up, or telehealth visit types with estimated durations.', module: 'Scheduling', benefits: ['Visit type selection ensures proper time allocation', 'Duration estimates help patients plan their day', 'Same-day filtering serves urgent needs'] },
      { title: 'Pre-Booking Eligibility Check', text: 'System performs real-time insurance eligibility verification showing copay amount, deductible status, and prior authorization requirements.', module: 'Insurance', benefits: ['Pre-appointment eligibility prevents billing surprises', 'Copay transparency enables financial planning', 'Prior auth requirements identified upfront'] },
      { title: 'Confirmation & Calendar Sync', text: 'Appointment confirmed with calendar invite synced to Google, Apple, or Outlook. Customizable reminders set and pre-visit instructions provided.', module: 'Calendar Sync', benefits: ['Calendar integration prevents double-booking', 'Customizable reminders reduce no-shows by 60%', 'Pre-visit instructions prepare patients'] }
    ],
    businessValue: [
      { icon: '🔍', metric: 'Smart', desc: 'Provider matching' },
      { icon: '📅', metric: 'Real-time', desc: 'Availability & booking' },
      { icon: '💳', metric: 'Instant', desc: 'Eligibility check' },
      { icon: '📉', metric: '60%', desc: 'No-show reduction' }
    ],
    features: ['Provider Directory', 'Scheduling', 'Insurance', 'Calendar Sync', 'Notifications', 'Reviews']
  },
  {
    id: 'pre-visit',
    num: '05',
    title: 'Pre-Visit Questionnaire & Digital Check-In',
    desc: 'Completing intake forms and health questionnaires digitally before arriving — streamlining check-in and giving providers advance clinical context.',
    tags: ['Forms', 'Check-In', 'Questionnaires', 'Intake'],
    steps: [
      { title: 'Pre-Visit Notification', text: 'Three days before the appointment, patient receives a deep-link to complete pre-visit forms. Tiered reminders follow at 1 day and 2 hours.', module: 'Notifications', benefits: ['Tiered reminders maximize form completion', 'Deep links go straight to the forms', 'Mobile-optimized for any device'] },
      { title: 'Health Questionnaire', text: 'Specialty-specific questionnaire with smart branching — dermatology asks about skin conditions, medications, allergies, and family history. Auto-populates from existing records.', module: 'Forms', benefits: ['Specialty forms capture relevant information', 'Smart branching eliminates irrelevant questions', 'Auto-population saves patient time'] },
      { title: 'Medication & Allergy Update', text: 'Patient reviews and updates their medication list, adds a new allergy, and confirms dosages. Drug interaction checking runs automatically.', module: 'Medications', benefits: ['Interaction checking catches dangers before visits', 'Visual medication list makes review quick', 'Allergy updates propagate network-wide'] },
      { title: 'Insurance Card Upload', text: 'Patient photographs both sides of their insurance card. OCR verifies info matches their profile and flags discrepancies.', module: 'Insurance', benefits: ['Pre-visit upload eliminates front desk delays', 'OCR catches quality issues early', 'Updated info prevents claim denials'] },
      { title: 'Digital Check-In', text: 'On appointment day, patient checks in digitally from the parking lot. System confirms arrival, estimates wait time, and notifies when provider is ready.', module: 'Check-In', benefits: ['Contactless check-in reduces waiting room crowding', 'Real-time wait estimates reduce anxiety', 'Arrival notification optimizes clinic flow'] }
    ],
    businessValue: [
      { icon: '📋', metric: '80%', desc: 'Pre-arrival completion' },
      { icon: '⏱️', metric: '12 min', desc: 'Saved per visit' },
      { icon: '💊', metric: 'Auto', desc: 'Drug interaction alerts' },
      { icon: '📱', metric: 'Digital', desc: 'Contactless check-in' }
    ],
    features: ['Notifications', 'Forms', 'Medications', 'Insurance', 'Check-In', 'Allergies']
  },
  {
    id: 'in-office-visit',
    num: '06',
    title: 'In-Office Visit & Real-Time Updates',
    desc: 'The in-person visit experience with real-time status updates, waitlist management, and seamless handoffs between front desk, nursing, and provider.',
    tags: ['Visit Tracking', 'Waitlist', 'Status Updates', 'Notifications'],
    steps: [
      { title: 'Arrival Confirmation', text: 'Front desk verifies identity and insurance via the pre-populated check-in data. Patient receives a digital queue position and estimated wait.', module: 'Check-In', benefits: ['Pre-populated data eliminates redundant paperwork', 'Queue visibility reduces perceived wait time', 'Digital identity verification speeds processing'] },
      { title: 'Nursing Intake', text: 'Nurse reviews pre-visit questionnaire responses, takes vitals (BP, temp, weight, pulse ox), and updates the chart. Patient receives a notification when vitals are recorded.', module: 'Vitals', benefits: ['Pre-questionnaire review saves nursing time', 'Digital vitals entry eliminates transcription errors', 'Patient notification of recorded vitals builds transparency'] },
      { title: 'Provider Encounter', text: 'Provider reviews the comprehensive pre-visit summary — questionnaire, vitals, medication list, recent labs. Patient sees real-time status: "With Dr. Smith."', module: 'Visit Tracking', benefits: ['Comprehensive pre-visit summary improves encounter quality', 'Real-time status keeps family members informed', 'Digital workflow reduces provider documentation burden'] },
      { title: 'Waitlist Management', text: 'If the provider is running late, patients in the waitlist receive updated ETAs. Those willing to see an alternate provider get matched automatically.', module: 'Waitlist', benefits: ['Proactive delay communication reduces frustration', 'Alternate provider matching minimizes patient wait', 'Waitlist analytics identify scheduling bottlenecks'] },
      { title: 'Checkout & Summary', text: 'After the visit, the patient receives checkout instructions, copay notification, and a link to the visit summary — all before leaving the building.', module: 'Notifications', benefits: ['Immediate summary ensures patients remember key points', 'In-office copay collection improves revenue cycle', 'Follow-up scheduling before departure maintains continuity'] }
    ],
    businessValue: [
      { icon: '📍', metric: 'Real-time', desc: 'Visit status tracking' },
      { icon: '⏱️', metric: '15 min', desc: 'Average wait reduction' },
      { icon: '📊', metric: 'Digital', desc: 'Vitals capture' },
      { icon: '🔔', metric: 'Instant', desc: 'Status notifications' }
    ],
    features: ['Check-In', 'Vitals', 'Visit Tracking', 'Waitlist', 'Notifications', 'Scheduling']
  },
  {
    id: 'telehealth',
    num: '07',
    title: 'Telehealth Video Visit',
    desc: 'End-to-end virtual care from pre-visit tech check through HIPAA-compliant video consultation to e-prescriptions and visit documentation.',
    tags: ['Telehealth', 'Video', 'E-Prescribe', 'Virtual Care'],
    steps: [
      { title: 'Pre-Visit Tech Check', text: 'Fifteen minutes before, patient tests camera, microphone, and internet. System provides troubleshooting and falls back to audio-only if bandwidth is low.', module: 'Tech Check', benefits: ['Pre-check prevents wasted appointment time', 'Auto troubleshooting reduces support calls', 'Bandwidth detection enables graceful degradation'] },
      { title: 'Virtual Waiting Room', text: 'Patient joins the waiting room, sees queue position, and views educational content about their condition while waiting.', module: 'Virtual Waiting Room', benefits: ['Queue visibility reduces patient anxiety', 'Educational content makes wait productive', 'Provider dashboard enables schedule management'] },
      { title: 'Video Consultation', text: 'Secure HIPAA-compliant video with screen sharing for photos and provider image annotation during discussion.', module: 'Video Visits', benefits: ['Screen sharing enables remote visual examination', 'Image annotation explains conditions clearly', 'End-to-end encryption protects all content'] },
      { title: 'E-Prescription', text: 'Provider prescribes medication via e-prescribing. Patient selects preferred pharmacy and the prescription is sent electronically before the visit ends.', module: 'E-Prescribing', benefits: ['E-prescribing eliminates paper and phone calls', 'Pharmacy selection gives patients control', 'Formulary checking ensures insurance coverage'] },
      { title: 'Visit Summary & Follow-Up', text: 'Patient receives a visit summary with diagnosis, treatment plan, and follow-up instructions. One-click follow-up booking is available immediately.', module: 'Visit Summaries', benefits: ['Immediate summary captures key takeaways', 'Treatment plan creates accountability', 'One-click follow-up maintains care continuity'] }
    ],
    businessValue: [
      { icon: '🎥', metric: 'HD', desc: 'HIPAA-compliant video' },
      { icon: '💊', metric: 'E-Rx', desc: 'Digital prescriptions' },
      { icon: '📍', metric: 'Anywhere', desc: 'Care from any location' },
      { icon: '📊', metric: '95%', desc: 'Patient satisfaction' }
    ],
    features: ['Tech Check', 'Virtual Waiting Room', 'Video Visits', 'E-Prescribing', 'Visit Summaries', 'Scheduling']
  },
  {
    id: 'visit-summary',
    num: '08',
    title: 'Visit Summary & After-Visit Instructions',
    desc: 'Post-visit documentation with patient-friendly summaries, care plans, treatment instructions, and automatic health record updates.',
    tags: ['Visit Notes', 'Care Plans', 'Instructions', 'Records'],
    steps: [
      { title: 'Summary Generation', text: 'Within minutes of the visit ending, the system generates a patient-friendly summary. Medical jargon is translated to plain language.', module: 'Visit Summaries', benefits: ['Plain language improves patient understanding', 'Automatic generation ensures timely delivery', 'Provider review maintains clinical accuracy'] },
      { title: 'Diagnosis & Treatment Plan', text: 'Patient reviews diagnosis, prescribed treatments, and lifestyle modifications. Each item includes educational links and resources.', module: 'Health Records', benefits: ['Educational resources deepen understanding', 'Clear treatment plans improve adherence', 'Linked resources reduce follow-up questions'] },
      { title: 'After-Visit Instructions', text: 'Detailed care instructions — wound care steps, medication schedules, warning signs, and when to seek emergency care. Printable and saveable.', module: 'Care Plans', benefits: ['Step-by-step instructions prevent confusion', 'Warning sign checklists help patients self-assess', 'Print option serves patients preferring paper'] },
      { title: 'Health Record Update', text: 'Visit auto-updates health records — new allergies, medications, conditions. Changes are highlighted in the patient timeline.', module: 'Health Timeline', benefits: ['Automatic updates eliminate manual entry', 'Change highlighting makes updates visible', 'Longitudinal timeline shows health journey'] },
      { title: 'Follow-Up Scheduling', text: 'System suggests a follow-up based on the care plan. Patient books immediately or sets a reminder. Between-visit symptom check-ins track progress.', module: 'Scheduling', benefits: ['Proactive follow-up improves continuity', 'Between-visit check-ins catch complications', 'Reminder scheduling prevents follow-up gaps'] }
    ],
    businessValue: [
      { icon: '📄', metric: 'Instant', desc: 'Summary delivery' },
      { icon: '🧠', metric: 'Plain', desc: 'Language translation' },
      { icon: '📊', metric: 'Auto', desc: 'Record updates' },
      { icon: '🔔', metric: 'Smart', desc: 'Follow-up reminders' }
    ],
    features: ['Visit Summaries', 'Health Records', 'Care Plans', 'Health Timeline', 'Scheduling', 'Patient Education']
  },
  {
    id: 'lab-results',
    num: '09',
    title: 'Lab Results Review & Trending',
    desc: 'Receiving lab results with color-coded ranges, historical trending charts, provider annotations, and secure cross-provider sharing.',
    tags: ['Lab Results', 'Trending', 'Alerts', 'Sharing'],
    steps: [
      { title: 'Result Notification', text: 'Patient receives a push notification with severity indicator (normal/abnormal/critical) without revealing values on the lock screen.', module: 'Notifications', benefits: ['Severity indicators set appropriate urgency', 'Push delivery ensures timely awareness', 'HIPAA-safe preview protects PHI'] },
      { title: 'Results with Context', text: 'Each value shows reference range, units, and color indicator (green/yellow/red). Out-of-range values are highlighted with explanatory notes.', module: 'Lab Results', benefits: ['Color-coded ranges are instantly understandable', 'Reference ranges provide context', 'Plain language notes translate medical values'] },
      { title: 'Historical Trending', text: 'Line chart shows cholesterol trending over 3 years — LDL, HDL, total, and triglycerides with trend direction and rate of change.', module: 'Trending Charts', benefits: ['Visual trending reveals invisible patterns', 'Multi-year views show lifestyle impact', 'Trend alerts catch gradual changes'] },
      { title: 'Provider Annotations', text: 'Dr. Smith adds a note: "LDL down 15% — great progress. Continue current dose." Patient can reply with questions directly.', module: 'Messaging', benefits: ['Annotations add needed clinical context', 'Reply capability reduces unnecessary visits', 'Timestamps create communication record'] },
      { title: 'Share with Provider', text: 'Patient shares results with their cardiologist via a secure time-limited link, no GoHealth account needed for the recipient.', module: 'Record Sharing', benefits: ['Secure sharing eliminates faxing', 'Time-limited links prevent indefinite access', 'Cross-provider sharing improves coordination'] }
    ],
    businessValue: [
      { icon: '🧪', metric: 'Real-time', desc: 'Result delivery' },
      { icon: '📈', metric: 'Visual', desc: 'Multi-year trending' },
      { icon: '💬', metric: 'Direct', desc: 'Provider annotations' },
      { icon: '🔗', metric: 'Secure', desc: 'Cross-provider sharing' }
    ],
    features: ['Lab Results', 'Trending Charts', 'Notifications', 'Messaging', 'Record Sharing', 'Health Records']
  },
  {
    id: 'imaging-review',
    num: '10',
    title: 'Imaging Order & Report Review',
    desc: 'Tracking imaging orders from request through completion — viewing reports, accessing images, understanding findings, and coordinating with specialists.',
    tags: ['Imaging', 'Radiology', 'Reports', 'Orders'],
    steps: [
      { title: 'Imaging Order Notification', text: 'After the provider orders an MRI, the patient receives a notification with preparation instructions, scheduling options, and facility locations.', module: 'Notifications', benefits: ['Immediate notification accelerates scheduling', 'Prep instructions prevent rescheduling', 'Facility options offer convenience'] },
      { title: 'Schedule & Prepare', text: 'Patient selects an imaging center, books a slot, and reviews preparation requirements — fasting, contrast allergies, metal implant questionnaire.', module: 'Scheduling', benefits: ['Online scheduling eliminates phone calls', 'Prep checklists prevent wasted trips', 'Allergy screening improves safety'] },
      { title: 'Report Available', text: 'Radiology report is published to the patient portal. Findings are presented in patient-friendly language alongside the technical report.', module: 'Imaging Reports', benefits: ['Patient-friendly language improves understanding', 'Technical report available for other providers', 'Immediate availability reduces anxiety'] },
      { title: 'Image Access', text: 'Patient can view their imaging studies (X-ray, MRI, CT) directly in the portal through a DICOM viewer with basic zoom and contrast tools.', module: 'Imaging Reports', benefits: ['Direct image access empowers patients', 'DICOM viewer supports standard formats', 'Download option enables sharing with specialists'] },
      { title: 'Specialist Referral', text: 'Based on findings, the system facilitates a referral to a specialist. Imaging and reports are automatically shared with the referred provider.', module: 'Referrals', benefits: ['Automatic record sharing speeds referral process', 'Provider-to-provider handoff eliminates patient burden', 'Referral tracking shows status at every step'] }
    ],
    businessValue: [
      { icon: '🩻', metric: 'DICOM', desc: 'Image viewing in portal' },
      { icon: '📋', metric: 'Plain', desc: 'Language reports' },
      { icon: '⚡', metric: 'Instant', desc: 'Report availability' },
      { icon: '🔗', metric: 'Auto', desc: 'Specialist sharing' }
    ],
    features: ['Imaging Reports', 'Scheduling', 'Notifications', 'Referrals', 'Record Sharing', 'Health Records']
  },
  {
    id: 'health-records',
    num: '11',
    title: 'Health Record Download & Sharing',
    desc: 'Accessing, downloading, and securely sharing complete health records in CCD, FHIR, and PDF formats with patient-controlled access management.',
    tags: ['Records', 'Download', 'Sharing', 'FHIR'],
    steps: [
      { title: 'Health Record Timeline', text: 'Patient navigates a comprehensive timeline — encounters, diagnoses, medications, allergies, immunizations, labs, and vitals organized chronologically with category filters.', module: 'Health Timeline', benefits: ['Unified timeline gives complete health picture', 'Chronological organization reveals patterns', 'Category filters find specific records quickly'] },
      { title: 'Download Records', text: 'Patient requests a download in CCD (PDF), FHIR JSON, or both. Date range and record-type selection limit exports to relevant data.', module: 'Record Export', benefits: ['PDF serves insurance and legal needs', 'FHIR enables health system interoperability', 'Date filtering limits exports to relevant periods'] },
      { title: 'Share with Provider', text: 'Patient generates a secure sharing link for a new doctor. Email verification and configurable access duration maintain control.', module: 'Record Sharing', benefits: ['Email-verified sharing ensures correct recipients', 'Configurable duration maintains patient control', 'Share history logs all access events'] },
      { title: 'Revoke Access', text: 'Patient reviews active sharing links and revokes access for a previous specialist. Revocation is immediate and logged.', module: 'Record Sharing', benefits: ['One-click revocation gives data control', 'Access logs provide complete transparency', 'Immediate effect prevents further access'] },
      { title: 'Data Portability Export', text: 'Under patient data rights, a complete export including all notes, results, imaging, and billing is prepared within 24 hours.', module: 'Record Export', benefits: ['21st Century Cures Act compliance', 'Complete export covers all data categories', 'Notification when export is ready'] }
    ],
    businessValue: [
      { icon: '📥', metric: 'CCD/FHIR', desc: 'Standard formats' },
      { icon: '🔗', metric: 'Secure', desc: 'Provider sharing' },
      { icon: '🔒', metric: 'Patient', desc: 'Controlled access' },
      { icon: '⚖️', metric: 'Compliant', desc: 'Data portability' }
    ],
    features: ['Health Timeline', 'Record Export', 'Record Sharing', 'Health Records', 'Audit Trail', 'FHIR']
  },
  {
    id: 'referral-specialist',
    num: '12',
    title: 'Referral Request & Specialist Coordination',
    desc: 'Managing referrals from request through specialist appointment — with automatic record transfer, authorization tracking, and care coordination.',
    tags: ['Referrals', 'Specialists', 'Authorization', 'Coordination'],
    steps: [
      { title: 'Referral Initiated', text: 'PCP refers patient to a cardiologist. Patient receives notification with specialist details, reason for referral, and next steps.', module: 'Referrals', benefits: ['Immediate notification keeps patient informed', 'Referral reason helps patient understand urgency', 'Specialist details include profile and reviews'] },
      { title: 'Authorization Check', text: 'System checks if prior authorization is needed. If required, it is submitted automatically and the patient can track status in real-time.', module: 'Authorization', benefits: ['Automatic auth submission eliminates delays', 'Real-time tracking reduces patient anxiety', 'Denial reasons explained with appeal options'] },
      { title: 'Record Transfer', text: 'Relevant records — labs, imaging, visit notes, medications — are automatically packaged and shared with the specialist before the appointment.', module: 'Record Sharing', benefits: ['Automatic packaging saves manual collection', 'Pre-visit record sharing improves specialist preparation', 'Complete context prevents redundant testing'] },
      { title: 'Specialist Booking', text: 'Patient books with the specialist directly through GoHealth, seeing only available slots that match their insurance and authorization.', module: 'Scheduling', benefits: ['Filtered availability ensures insurance acceptance', 'Authorization-matched slots prevent booking issues', 'Direct booking eliminates phone tag'] },
      { title: 'Care Loop Closure', text: 'After the specialist visit, notes flow back to the PCP. Patient sees both providers\' notes in their timeline with a unified care plan.', module: 'Care Plans', benefits: ['Bidirectional note sharing closes the care loop', 'Unified care plan prevents conflicting treatments', 'Patient visibility ensures nothing falls through cracks'] }
    ],
    businessValue: [
      { icon: '🔄', metric: 'Auto', desc: 'Record transfer' },
      { icon: '⏳', metric: 'Tracked', desc: 'Authorization status' },
      { icon: '🤝', metric: 'Seamless', desc: 'Care coordination' },
      { icon: '📋', metric: 'Unified', desc: 'Care plans' }
    ],
    features: ['Referrals', 'Authorization', 'Record Sharing', 'Scheduling', 'Care Plans', 'Health Records']
  },
  {
    id: 'prescription-refill',
    num: '13',
    title: 'Prescription Refill Request',
    desc: 'Requesting medication refills with pharmacy selection, provider approval tracking, adherence monitoring, and automatic renewal management.',
    tags: ['Medications', 'Refills', 'Pharmacy', 'Adherence'],
    steps: [
      { title: 'Refill Reminder', text: 'System detects 5 days of supply remaining and sends an automated refill reminder with a one-tap refill button.', module: 'Medications', benefits: ['Proactive reminders prevent medication gaps', 'Supply calculation uses fill history', 'One-tap refill reduces friction'] },
      { title: 'Pharmacy Selection', text: 'Patient confirms medication and selects preferred pharmacy with pricing comparison and real-time availability across nearby locations.', module: 'Pharmacy', benefits: ['Pharmacy comparison finds best prices', 'Preferred pharmacy memory speeds future refills', 'Availability prevents wasted trips'] },
      { title: 'Provider Review', text: 'Refill request routed to prescriber with adherence history, last readings, and time since last visit for informed approval.', module: 'Prescriptions', benefits: ['Adherence data informs refill decisions', 'Clinical context reduces unnecessary visits', 'Batch review capability improves efficiency'] },
      { title: 'Approval & Notification', text: 'Provider approves. E-prescription sent to pharmacy. Patient receives confirmation with estimated pickup time.', module: 'E-Prescribing', benefits: ['Electronic transmission eliminates phone calls', 'Pickup time estimate helps patient plan', 'Confirmation closes the loop'] },
      { title: 'Adherence Tracking', text: 'System logs fill date and resets supply countdown. Adherence patterns are tracked and shared with the care team.', module: 'Adherence Tracking', benefits: ['Fill tracking identifies non-adherence risk', 'Care team visibility enables outreach', 'Adherence reporting supports quality measures'] }
    ],
    businessValue: [
      { icon: '💊', metric: 'Auto', desc: 'Refill reminders' },
      { icon: '🏪', metric: 'Compare', desc: 'Pharmacy pricing' },
      { icon: '⚡', metric: '<24 hr', desc: 'Approval time' },
      { icon: '📊', metric: 'Tracked', desc: 'Adherence monitoring' }
    ],
    features: ['Medications', 'Pharmacy', 'Prescriptions', 'E-Prescribing', 'Adherence Tracking', 'Notifications']
  },
  {
    id: 'new-medication',
    num: '14',
    title: 'New Medication & Pharmacy Selection',
    desc: 'Starting a new medication with formulary checking, pharmacy comparison, patient education, side effect monitoring, and adherence support.',
    tags: ['Prescriptions', 'Pharmacy', 'Education', 'Side Effects'],
    steps: [
      { title: 'Prescription Received', text: 'After a visit, the provider sends a new prescription. Patient receives notification with medication details, purpose, and expected benefits.', module: 'Prescriptions', benefits: ['Clear purpose explanation improves compliance', 'Expected benefits set realistic expectations', 'Immediate notification prevents delay'] },
      { title: 'Formulary & Cost Check', text: 'System checks insurance formulary status and shows patient cost: tier, copay, and generic alternatives with savings comparison.', module: 'Insurance', benefits: ['Formulary check prevents pharmacy surprises', 'Generic alternatives can save significant money', 'Tier information explains cost structure'] },
      { title: 'Pharmacy Selection', text: 'Patient selects a pharmacy from mapped locations with real-time pricing, hours, and drive-through availability.', module: 'Pharmacy', benefits: ['Location mapping shows nearest options', 'Price transparency enables informed choice', 'Hours and services match patient needs'] },
      { title: 'Medication Education', text: 'Patient views an educational page — how it works, dosing instructions, common side effects, food interactions, and storage requirements.', module: 'Patient Education', benefits: ['Understanding mechanism improves compliance', 'Side effect awareness prevents panic discontinuation', 'Food interaction warnings prevent reduced efficacy'] },
      { title: 'Side Effect Monitoring', text: 'System schedules check-ins at 1 week and 1 month to assess side effects and effectiveness. Responses are shared with the prescriber.', module: 'Symptom Tracking', benefits: ['Scheduled check-ins catch adverse effects early', 'Structured symptom reporting improves communication', 'Prescriber visibility enables timely adjustments'] }
    ],
    businessValue: [
      { icon: '💰', metric: 'Savings', desc: 'Generic alternatives' },
      { icon: '📚', metric: 'Education', desc: 'Medication guides' },
      { icon: '🔍', metric: 'Monitor', desc: 'Side effect tracking' },
      { icon: '✅', metric: 'Formulary', desc: 'Insurance verification' }
    ],
    features: ['Prescriptions', 'Insurance', 'Pharmacy', 'Patient Education', 'Symptom Tracking', 'Notifications']
  },
  {
    id: 'allergy-interaction',
    num: '15',
    title: 'Allergy & Drug Interaction Alerts',
    desc: 'Proactive safety alerts for drug-drug interactions, drug-allergy conflicts, and medication safety checks across the complete medication profile.',
    tags: ['Allergies', 'Interactions', 'Safety', 'Alerts'],
    steps: [
      { title: 'Allergy Update', text: 'Patient adds a new sulfa allergy with reaction type (rash), severity, and onset timing captured in structured format.', module: 'Allergies', benefits: ['Structured data enables precise decision support', 'Severity tracking differentiates allergies from intolerances', 'Onset timing helps assess causality'] },
      { title: 'Cross-Reference Check', text: 'System immediately cross-references against active medications. Conflict detected: sulfasalazine contains a sulfonamide component.', module: 'Drug Interactions', benefits: ['Automatic cross-referencing catches hidden conflicts', 'Ingredient-level checking catches indirect conflicts', 'Active scanning covers all current prescriptions'] },
      { title: 'Dual Alert', text: 'Both patient and provider receive alerts. Patient sees plain-language explanation; provider sees clinical details with alternatives.', module: 'Notifications', benefits: ['Dual notification ensures both parties are aware', 'Patient-friendly language makes alerts understandable', 'Provider alert includes clinical context'] },
      { title: 'Interaction Dashboard', text: 'Patient views their complete interaction profile — drug-drug, drug-food, and allergy cross-references with color-coded risk levels.', module: 'Drug Interactions', benefits: ['Comprehensive view reveals complete safety picture', 'Color-coded risk prioritizes attention', 'Food interaction warnings include dietary guidance'] },
      { title: 'Resolution', text: 'Patient messages provider about the alert. Provider switches medication. Dashboard updates to reflect resolved conflict.', module: 'Messaging', benefits: ['In-context messaging enables efficient resolution', 'Alternative suggestions speed decisions', 'Real-time dashboard updates confirm resolution'] }
    ],
    businessValue: [
      { icon: '⚠️', metric: 'Real-time', desc: 'Interaction detection' },
      { icon: '🛡️', metric: 'Multi-level', desc: 'Safety checking' },
      { icon: '💊', metric: 'Complete', desc: 'Medication profile' },
      { icon: '📱', metric: 'Instant', desc: 'Dual alerts' }
    ],
    features: ['Allergies', 'Drug Interactions', 'Notifications', 'Messaging', 'Medications', 'Safety Alerts']
  },
  {
    id: 'immunization-records',
    num: '16',
    title: 'Immunization Records & Reminders',
    desc: 'Comprehensive immunization tracking with state registry integration, CDC schedule, family dashboard, multi-patient booking, and compliance certificates.',
    tags: ['Immunizations', 'Schedule', 'Certificates', 'Family'],
    steps: [
      { title: 'Immunization History', text: 'Patient views complete vaccination history imported from state immunization registries — dates, lot numbers, providers, and locations.', module: 'Immunizations', benefits: ['Registry import ensures complete records', 'Lot tracking supports recall notifications', 'Completeness eliminates unnecessary revaccination'] },
      { title: 'Personalized Schedule', text: 'CDC-aligned schedule generated based on age, conditions, and prior doses. Upcoming vaccines shown with recommended dates and due windows.', module: 'Immunizations', benefits: ['CDC alignment follows evidence-based guidelines', 'Personalized schedule accounts for individual factors', 'Due windows help patients plan ahead'] },
      { title: 'Family Dashboard', text: 'Parent views immunization status for all family members. Color-coded: up-to-date (green), due soon (yellow), overdue (red). School-required vaccines highlighted.', module: 'Family Dashboard', benefits: ['Family view manages multiple schedules at once', 'Color coding enables quick assessment', 'School-requirement flags prevent enrollment delays'] },
      { title: 'Multi-Patient Booking', text: 'Parent books flu shots for the whole family in one flow. Age-appropriate formulations selected automatically.', module: 'Scheduling', benefits: ['Multi-patient booking reduces scheduling effort', 'Age-appropriate selection prevents dosing errors', 'Family clustering saves multiple trips'] },
      { title: 'Compliance Certificate', text: 'System generates state-format immunization compliance certificates for school enrollment — printable or electronically submittable.', module: 'Certificates', benefits: ['Auto-generated certificates eliminate manual forms', 'State-specific formats ensure acceptance', 'Electronic submission option saves trips'] }
    ],
    businessValue: [
      { icon: '💉', metric: 'Complete', desc: 'Immunization history' },
      { icon: '📅', metric: 'CDC', desc: 'Guideline scheduling' },
      { icon: '👨‍👩‍👧‍👦', metric: 'Family', desc: 'Multi-member tracking' },
      { icon: '📜', metric: 'Auto', desc: 'Compliance certificates' }
    ],
    features: ['Immunizations', 'Family Dashboard', 'Scheduling', 'Certificates', 'Notifications', 'Registry Integration']
  },
  {
    id: 'secure-messaging',
    num: '17',
    title: 'Secure Messaging with Care Team',
    desc: 'HIPAA-compliant messaging with category-based routing, photo attachments, nurse triage, provider responses, and complete conversation history.',
    tags: ['Messaging', 'Care Team', 'Triage', 'Attachments'],
    steps: [
      { title: 'Compose Message', text: 'Patient starts a new message about a concerning mole. Category selection (medical, Rx, scheduling, billing) routes to the right team member.', module: 'Messaging', benefits: ['Category routing reaches the right person', 'Subject templates guide relevant details', 'Draft auto-save prevents message loss'] },
      { title: 'Attach Photos', text: 'Patient attaches a photo from their camera. System supports image, PDF, and documents up to 25MB with automatic virus scanning.', module: 'Attachments', benefits: ['Photo attachments enable visual communication', 'Virus scanning protects the network', 'Document support shares external records'] },
      { title: 'Nurse Triage', text: 'Care team nurse triages the message. Based on the photo, she escalates to the dermatologist with urgent flag. Patient sees status: "Escalated to Dr. Smith."', module: 'Triage', benefits: ['Nurse triage filters and prioritizes messages', 'Escalation paths reach specialists quickly', 'Status visibility keeps patients informed'] },
      { title: 'Provider Response', text: 'Dr. Smith responds within 4 hours with assessment and a scheduling link for in-person evaluation.', module: 'Messaging', benefits: ['Photo-based assessment prevents ER visits', 'Embedded scheduling links reduce friction', 'Response time tracking ensures SLA compliance'] },
      { title: 'Thread History', text: 'Full conversation thread is preserved and linked to the chart. Previous threads are searchable by date and provider.', module: 'Messaging', benefits: ['Threaded conversations maintain context', 'Chart-linked messages create documentation trail', 'Search helps find past advice'] }
    ],
    businessValue: [
      { icon: '💬', metric: 'Secure', desc: 'HIPAA messaging' },
      { icon: '⏱️', metric: '<4 hr', desc: 'Response time' },
      { icon: '📎', metric: 'Rich', desc: 'Photo & doc sharing' },
      { icon: '📋', metric: 'Full', desc: 'Conversation history' }
    ],
    features: ['Messaging', 'Attachments', 'Triage', 'Care Team', 'Scheduling', 'Notifications']
  },
  {
    id: 'notification-mgmt',
    num: '18',
    title: 'Notification & Reminder Management',
    desc: 'Configuring and managing multi-channel notifications — appointment reminders, result alerts, medication reminders, and wellness nudges.',
    tags: ['Notifications', 'Reminders', 'Channels', 'Preferences'],
    steps: [
      { title: 'Channel Configuration', text: 'Patient configures preferred channels per notification type — push for urgent results, email for statements, SMS for appointment reminders.', module: 'Preferences', benefits: ['Per-type channel selection optimizes delivery', 'Channel preference increases engagement', 'Multi-channel coverage ensures delivery'] },
      { title: 'Reminder Scheduling', text: 'Patient sets appointment reminder timing — 1 week, 1 day, and 2 hours before. Medication reminders set for specific times matching their routine.', module: 'Notifications', benefits: ['Customizable timing matches patient lifestyle', 'Medication timing alignment improves adherence', 'Multiple reminder points prevent forgetting'] },
      { title: 'Quiet Hours', text: 'Patient sets quiet hours (10 PM - 7 AM) during which only critical alerts (abnormal results, urgent messages) are delivered.', module: 'Preferences', benefits: ['Quiet hours respect patient rest', 'Critical exceptions ensure safety', 'Timezone awareness handles travel'] },
      { title: 'Notification Center', text: 'Central hub shows all notifications with read/unread status, category filters, and action items. Batch actions mark multiple as read.', module: 'Notifications', benefits: ['Centralized view prevents missed notifications', 'Category filters organize by type', 'Batch actions reduce notification overload'] },
      { title: 'Family Notifications', text: 'Parent receives consolidated notifications for all family members — one daily digest or individual real-time alerts per member.', module: 'Family Dashboard', benefits: ['Consolidated digest reduces notification volume', 'Per-member alerts serve urgent needs', 'Family overview keeps everyone on track'] }
    ],
    businessValue: [
      { icon: '🔔', metric: 'Multi-channel', desc: 'Push, SMS, Email' },
      { icon: '🌙', metric: 'Smart', desc: 'Quiet hours' },
      { icon: '📱', metric: 'Central', desc: 'Notification hub' },
      { icon: '👨‍👩‍👧‍👦', metric: 'Family', desc: 'Consolidated alerts' }
    ],
    features: ['Notifications', 'Preferences', 'Family Dashboard', 'Medications', 'Scheduling', 'Messaging']
  },
  {
    id: 'patient-education',
    num: '19',
    title: 'Patient Education & Resource Library',
    desc: 'Curated health education with condition-specific resources, medication guides, procedure preparation, and personalized wellness content.',
    tags: ['Education', 'Resources', 'Library', 'Wellness'],
    steps: [
      { title: 'Condition-Based Resources', text: 'After a diabetes diagnosis, the system recommends a curated learning path — what is diabetes, diet management, blood sugar monitoring, and exercise guidelines.', module: 'Patient Education', benefits: ['Condition-specific content is immediately relevant', 'Learning paths structure complex information', 'Evidence-based resources ensure accuracy'] },
      { title: 'Medication Guides', text: 'For each active medication, detailed guides explain how it works, proper usage, side effects, interactions, and what to do if a dose is missed.', module: 'Patient Education', benefits: ['Medication understanding improves adherence', 'Missed dose guidance prevents doubling up', 'Interaction awareness improves safety'] },
      { title: 'Procedure Preparation', text: 'Before a colonoscopy, the patient receives a step-by-step prep guide — diet restrictions, bowel prep timeline, what to expect during and after the procedure.', module: 'Patient Education', benefits: ['Clear prep guides reduce procedure cancellations', 'Timeline format makes multi-day prep manageable', 'Expectation setting reduces pre-procedure anxiety'] },
      { title: 'Wellness Content', text: 'Personalized wellness articles based on health profile — stress management for hypertension patients, calcium-rich recipes for osteoporosis risk.', module: 'Wellness Content', benefits: ['Personalized content is more engaging than generic', 'Profile-based recommendations are clinically relevant', 'Regular content delivery maintains engagement'] },
      { title: 'Provider-Recommended Reading', text: 'Providers can assign specific educational materials to patients. Patient receives notification and the material appears in their learning queue.', module: 'Patient Education', benefits: ['Provider-assigned content is clinically targeted', 'Learning queue tracks what to read next', 'Completion tracking shows engagement to providers'] }
    ],
    businessValue: [
      { icon: '📚', metric: 'Curated', desc: 'Health library' },
      { icon: '🎯', metric: 'Personal', desc: 'Targeted content' },
      { icon: '💊', metric: 'Complete', desc: 'Medication guides' },
      { icon: '📊', metric: 'Tracked', desc: 'Learning progress' }
    ],
    features: ['Patient Education', 'Wellness Content', 'Medications', 'Notifications', 'Health Records', 'Care Plans']
  },
  {
    id: 'bill-payment',
    num: '20',
    title: 'Bill Review & Online Payment',
    desc: 'Transparent billing with itemized statements, insurance breakdown, claim tracking, and flexible online payment options including payment plans.',
    tags: ['Billing', 'Payments', 'Insurance', 'Statements'],
    steps: [
      { title: 'Statement Notification', text: 'Patient receives notification with amount due and due date. HIPAA-safe preview shows balance without service details on lock screen.', module: 'Notifications', benefits: ['Timely notification prevents missed deadlines', 'HIPAA-safe preview protects billing privacy', 'Direct payment link reduces friction'] },
      { title: 'Itemized Review', text: 'Each service shows insurance adjustment, plan payment, and patient responsibility. CPT codes translated to plain-language descriptions.', module: 'Statements', benefits: ['Itemized detail builds trust', 'Plain language helps understanding', 'Insurance breakdown prevents confusion'] },
      { title: 'Claim Tracking', text: 'Patient tracks claim status — submitted, processing, adjudicated, or denied. Denial reasons explained with appeal templates and next steps.', module: 'Claims', benefits: ['Status visibility reduces billing calls', 'Denial explanations empower patients', 'Appeal templates help contest denials'] },
      { title: 'Online Payment', text: 'Patient pays using stored card, bank transfer, or HSA. Payment plans available for larger balances — 3, 6, or 12 installments.', module: 'Payments', benefits: ['Stored methods enable one-click payment', 'Payment plans reduce bad debt', 'Multiple methods serve all patients'] },
      { title: 'Receipt & History', text: 'Instant receipt generated. Year-to-date spending, deductible progress, and out-of-pocket maximum tracked for financial planning.', module: 'Billing', benefits: ['Instant receipts serve tax purposes', 'Deductible tracking helps spending decisions', 'YTD summary supports HSA/FSA management'] }
    ],
    businessValue: [
      { icon: '💳', metric: 'Online', desc: 'Payment processing' },
      { icon: '📊', metric: 'Transparent', desc: 'Itemized billing' },
      { icon: '📉', metric: '35%', desc: 'Faster collections' },
      { icon: '🏦', metric: 'Flexible', desc: 'Payment plans' }
    ],
    features: ['Billing', 'Statements', 'Claims', 'Payments', 'Insurance', 'Notifications']
  },
  {
    id: 'insurance-mgmt',
    num: '21',
    title: 'Insurance Card Upload & Eligibility Verification',
    desc: 'Managing insurance with card scanning, real-time eligibility verification, coverage details, coordination of benefits, and prior authorization tracking.',
    tags: ['Insurance', 'Eligibility', 'Coverage', 'OCR'],
    steps: [
      { title: 'Card Upload & OCR', text: 'Patient photographs new insurance card. OCR extracts plan name, member ID, group number, and contact information from both sides.', module: 'Insurance', benefits: ['Camera capture works on any smartphone', 'OCR reduces manual entry errors', 'Both sides ensure complete info'] },
      { title: 'Eligibility Check', text: 'System queries payer eligibility in real-time. Patient sees: active coverage, PCP assignment, copay amounts per visit type.', module: 'Eligibility', benefits: ['Real-time verification eliminates surprises', 'Visit-type copays enable planning', 'PCP confirmation prevents referral issues'] },
      { title: 'Coverage Details', text: 'Patient explores deductible progress, in-network vs. out-of-network benefits, covered services, and exclusions with previous plan comparison.', module: 'Coverage', benefits: ['Plan comparison highlights changes', 'Deductible tracking informs decisions', 'Exclusion visibility prevents unexpected costs'] },
      { title: 'Authorization Tracker', text: 'Pending MRI authorization tracked: submitted, under review, estimated decision timeline displayed with denial appeal options.', module: 'Authorization', benefits: ['Status transparency reduces anxiety', 'Timeline estimates help planning', 'Appeal options explained for denials'] },
      { title: 'Coordination of Benefits', text: 'Dual coverage managed — primary/secondary determination, claim splitting, and combined coverage view for total out-of-pocket picture.', module: 'Insurance', benefits: ['Automatic COB simplifies dual coverage', 'Combined view shows total picture', 'Proper determination prevents rejections'] }
    ],
    businessValue: [
      { icon: '📸', metric: 'OCR', desc: 'Card scanning' },
      { icon: '✅', metric: 'Real-time', desc: 'Eligibility checks' },
      { icon: '🔍', metric: 'Full', desc: 'Coverage transparency' },
      { icon: '⏳', metric: 'Tracked', desc: 'Authorization status' }
    ],
    features: ['Insurance', 'Eligibility', 'Coverage', 'Authorization', 'OCR', 'Benefits']
  },
  {
    id: 'prior-auth',
    num: '22',
    title: 'Prior Authorization & Appeal Process',
    desc: 'Tracking prior authorizations from submission through decision — with real-time status updates, denial management, and guided appeal workflows.',
    tags: ['Authorization', 'Appeals', 'Insurance', 'Tracking'],
    steps: [
      { title: 'Authorization Required', text: 'Provider orders a knee MRI. System detects prior auth requirement and auto-submits with clinical justification, CPT codes, and supporting documentation.', module: 'Authorization', benefits: ['Auto-detection prevents missed auth requirements', 'Auto-submission eliminates manual paperwork', 'Clinical justification improves approval rates'] },
      { title: 'Status Tracking', text: 'Patient tracks authorization status: submitted, in review, pending additional info, approved, or denied. Estimated decision timeline shown.', module: 'Authorization', benefits: ['Real-time status reduces phone calls', 'Timeline estimates help patients plan', 'Additional info requests routed to provider'] },
      { title: 'Approval Notification', text: 'Authorization approved. Patient notified with authorization number, valid dates, approved facility, and a link to schedule the procedure.', module: 'Notifications', benefits: ['Immediate notification enables quick scheduling', 'Valid dates ensure timely completion', 'Scheduling link reduces booking friction'] },
      { title: 'Denial & Appeal', text: 'If denied, patient sees plain-language denial reason with an appeal guide. System provides template appeal letter with auto-populated clinical data.', module: 'Appeals', benefits: ['Plain-language reasons help understanding', 'Template letters reduce appeal effort', 'Auto-populated data ensures completeness'] },
      { title: 'Appeal Tracking', text: 'Appeal submitted and tracked through the review process. External review option presented if internal appeal is denied.', module: 'Appeals', benefits: ['Appeal tracking provides visibility', 'External review escalation explained', 'Complete audit trail for documentation'] }
    ],
    businessValue: [
      { icon: '📋', metric: 'Auto', desc: 'Auth submission' },
      { icon: '⏱️', metric: 'Real-time', desc: 'Status tracking' },
      { icon: '📝', metric: 'Guided', desc: 'Appeal process' },
      { icon: '✅', metric: 'Higher', desc: 'Approval rates' }
    ],
    features: ['Authorization', 'Appeals', 'Notifications', 'Insurance', 'Scheduling', 'Audit Trail']
  },
  {
    id: 'cost-estimator',
    num: '23',
    title: 'Cost Estimator & HSA Management',
    desc: 'Transparent healthcare cost estimation before services — with HSA/FSA balance tracking, payment planning, and year-end tax preparation.',
    tags: ['Cost Estimator', 'HSA', 'FSA', 'Financial Planning'],
    steps: [
      { title: 'Pre-Service Estimate', text: 'Before scheduling an MRI, patient views cost estimate: facility charge, professional fee, insurance adjustment, and estimated patient responsibility.', module: 'Cost Estimator', benefits: ['Pre-service transparency enables informed decisions', 'Facility comparison shows price variation', 'Insurance adjustment preview prevents sticker shock'] },
      { title: 'Compare Facilities', text: 'Patient compares costs across in-network facilities — hospital imaging center ($1,200) vs. standalone center ($450) for the same MRI.', module: 'Cost Estimator', benefits: ['Price variation awareness saves money', 'Quality metrics alongside pricing inform choices', 'Distance and availability aid decision-making'] },
      { title: 'HSA/FSA Balance', text: 'Patient views their HSA balance ($2,340), recent transactions, and projected year-end balance based on planned procedures.', module: 'HSA Management', benefits: ['Balance visibility enables spending planning', 'Transaction history provides spending record', 'Projection prevents year-end fund loss'] },
      { title: 'Payment Planning', text: 'For a $3,000 procedure, patient creates a payment plan: $500 from HSA, remainder in 6 monthly installments of $416 with no interest.', module: 'Payment Plans', benefits: ['Mixed payment sources maximize tax benefits', 'Interest-free plans make care affordable', 'Automatic debit prevents missed payments'] },
      { title: 'Tax Documentation', text: 'Year-end tax summary generated with total healthcare spending, HSA contributions/withdrawals, and eligible expenses categorized for tax filing.', module: 'HSA Management', benefits: ['Automated summary saves tax prep time', 'Categorized expenses simplify HSA documentation', 'IRS-ready format reduces filing errors'] }
    ],
    businessValue: [
      { icon: '💰', metric: 'Transparent', desc: 'Cost estimates' },
      { icon: '🏥', metric: 'Compare', desc: 'Facility pricing' },
      { icon: '💳', metric: 'HSA/FSA', desc: 'Balance tracking' },
      { icon: '📊', metric: 'Year-end', desc: 'Tax documentation' }
    ],
    features: ['Cost Estimator', 'HSA Management', 'Payment Plans', 'Insurance', 'Billing', 'Statements']
  },
  {
    id: 'wellness-screening',
    num: '24',
    title: 'Annual Wellness & Preventive Screening',
    desc: 'Proactive health maintenance with personalized USPSTF-based screening recommendations, health risk assessments, and preventive care scheduling.',
    tags: ['Wellness', 'Screening', 'Prevention', 'Assessment'],
    steps: [
      { title: 'Wellness Reminder', text: 'One month before annual wellness is due, system sends personalized reminder with age/sex-appropriate screening recommendations based on USPSTF guidelines.', module: 'Notifications', benefits: ['Proactive reminders prevent care gaps', 'USPSTF-based recommendations ensure evidence', 'Personalization improves relevance'] },
      { title: 'Health Risk Assessment', text: 'Patient completes annual HRA — lifestyle, mental health, social determinants, family history updates, and current symptoms generating a risk score.', module: 'Health Assessments', benefits: ['Standardized HRA captures holistic picture', 'Social determinants identify non-medical barriers', 'Risk scoring prioritizes screenings'] },
      { title: 'Preventive Checklist', text: 'Personalized preventive care checklist generated — mammogram due, colonoscopy recommended, flu shot available, dental cleaning overdue.', module: 'Preventive Care', benefits: ['Personalized checklists eliminate guesswork', 'Multi-specialty coverage coordinates care', 'Status tracking shows completion'] },
      { title: 'Book Screenings', text: 'Patient books mammogram and flu shot from the checklist. In-network facilities filtered and pre-authorization handled automatically.', module: 'Scheduling', benefits: ['One-click booking from checklist reduces friction', 'Network filtering prevents cost surprises', 'Auto-authorization removes barriers'] },
      { title: 'Wellness Report', text: 'At the wellness visit, provider reviews HRA results, completed screenings, and year-over-year health trends in a comprehensive report.', module: 'Health Records', benefits: ['Comprehensive report saves provider time', 'Year-over-year comparison reveals trajectory', 'Patient preparation makes visits productive'] }
    ],
    businessValue: [
      { icon: '🏥', metric: 'Proactive', desc: 'Preventive reminders' },
      { icon: '📋', metric: 'USPSTF', desc: 'Evidence-based' },
      { icon: '🎯', metric: 'Personal', desc: 'Risk assessment' },
      { icon: '📊', metric: 'Annual', desc: 'Health trends' }
    ],
    features: ['Preventive Care', 'Health Assessments', 'Scheduling', 'Notifications', 'Health Records', 'Wellness Goals']
  },
  {
    id: 'chronic-disease',
    num: '25',
    title: 'Chronic Disease Management Program',
    desc: 'Structured programs for diabetes, hypertension, and asthma with remote monitoring, care plan adherence, and care team coordination.',
    tags: ['Chronic Care', 'Monitoring', 'Care Plans', 'Goals'],
    steps: [
      { title: 'Program Enrollment', text: 'After a Type 2 diabetes diagnosis, patient is enrolled in the diabetes management program with a personalized care plan, goals, and monitoring schedule.', module: 'Care Plans', benefits: ['Structured programs improve outcomes', 'Personalized goals are achievable', 'Clear monitoring schedule sets expectations'] },
      { title: 'Daily Monitoring', text: 'Patient logs blood glucose readings, meals, and exercise. Connected glucose meter auto-syncs readings. Trends and patterns are highlighted.', module: 'Symptom Tracking', benefits: ['Auto-sync eliminates manual entry', 'Pattern recognition reveals triggers', 'Visual trends motivate behavior change'] },
      { title: 'Care Plan Review', text: 'Monthly care plan review compares actual vs. target A1C, medication adherence, and lifestyle goal progress with care team annotations.', module: 'Care Plans', benefits: ['Regular reviews maintain accountability', 'Actual vs. target comparison shows progress', 'Care team input adjusts plans as needed'] },
      { title: 'Alert Escalation', text: 'Blood glucose reading above 300 mg/dL triggers an immediate alert to the care team. Nurse calls within 15 minutes with guidance.', module: 'Notifications', benefits: ['Threshold alerts catch dangerous readings', 'Rapid nurse response prevents emergencies', 'Escalation protocols ensure appropriate care'] },
      { title: 'Quarterly Reporting', text: 'Quarterly report shows A1C trend, medication compliance, ER visits avoided, and quality measure reporting for the care team.', module: 'Health Records', benefits: ['Quarterly metrics show program effectiveness', 'ER avoidance demonstrates value', 'Quality reporting supports accreditation'] }
    ],
    businessValue: [
      { icon: '📊', metric: 'Daily', desc: 'Remote monitoring' },
      { icon: '🎯', metric: 'Structured', desc: 'Care programs' },
      { icon: '🚨', metric: 'Real-time', desc: 'Alert escalation' },
      { icon: '📉', metric: '40%', desc: 'ER visits reduced' }
    ],
    features: ['Care Plans', 'Symptom Tracking', 'Notifications', 'Health Records', 'Wellness Goals', 'Adherence Tracking']
  },
  {
    id: 'wearable-monitoring',
    num: '26',
    title: 'Wearable Device & Remote Monitoring',
    desc: 'Integrating wearable devices and home medical equipment for continuous health monitoring with automatic alerts and care team sharing.',
    tags: ['Wearables', 'Remote Monitoring', 'IoT', 'Vitals'],
    steps: [
      { title: 'Device Pairing', text: 'Patient connects Apple Watch, Fitbit, or blood pressure cuff to GoHealth. OAuth-based pairing securely syncs health data in the background.', module: 'Wearable Integration', benefits: ['OAuth pairing ensures secure connection', 'Background sync requires no manual effort', 'Multi-device support covers major brands'] },
      { title: 'Continuous Data Sync', text: 'Heart rate, steps, sleep quality, blood pressure, and SpO2 sync automatically. Data appears in the patient\'s health timeline alongside clinical data.', module: 'Wearable Integration', benefits: ['Continuous data provides complete health picture', 'Clinical + consumer data in one timeline', 'Automated sync prevents data gaps'] },
      { title: 'Smart Alerts', text: 'System detects irregular heart rhythm pattern over 3 nights. Alert sent to patient and cardiologist with relevant data summary.', module: 'Notifications', benefits: ['Pattern detection catches gradual changes', 'Clinical alert routing ensures appropriate response', 'Data summary provides actionable context'] },
      { title: 'Provider Dashboard', text: 'Cardiologist reviews patient\'s 30-day heart rate, activity, and sleep data in a clinical dashboard with annotation capability.', module: 'Health Records', benefits: ['30-day view reveals patterns invisible in visits', 'Annotation capability documents clinical decisions', 'Remote monitoring reduces unnecessary visits'] },
      { title: 'Goal Integration', text: 'Wearable step counts feed into the patient\'s 10,000-step goal. Weekly progress reports and encouraging notifications maintain motivation.', module: 'Wellness Goals', benefits: ['Automatic goal tracking eliminates manual logging', 'Progress reports show achievement streaks', 'Encouragement notifications sustain motivation'] }
    ],
    businessValue: [
      { icon: '⌚', metric: 'Connected', desc: 'Multi-device support' },
      { icon: '📊', metric: 'Continuous', desc: 'Health monitoring' },
      { icon: '🚨', metric: 'Smart', desc: 'Pattern alerts' },
      { icon: '🎯', metric: 'Integrated', desc: 'Goal tracking' }
    ],
    features: ['Wearable Integration', 'Notifications', 'Health Records', 'Wellness Goals', 'Vitals', 'Symptom Tracking']
  },
  {
    id: 'nutrition-fitness',
    num: '27',
    title: 'Nutrition Planning & Fitness Tracking',
    desc: 'Personalized nutrition guidance, meal planning, fitness tracking, and goal management integrated with clinical conditions and medications.',
    tags: ['Nutrition', 'Fitness', 'Goals', 'Wellness'],
    steps: [
      { title: 'Nutrition Profile', text: 'Based on the patient\'s conditions (diabetes, hypertension) and medications, the system generates dietary guidelines — low-sodium, controlled-carb recommendations.', module: 'Nutrition Planning', benefits: ['Condition-aware guidance is clinically relevant', 'Medication-diet interactions highlighted', 'Personalized over generic dietary advice'] },
      { title: 'Meal Planning', text: 'Weekly meal plans with recipes, nutritional breakdowns, and grocery lists. Plans adapt to dietary restrictions, allergies, and cultural preferences.', module: 'Nutrition Planning', benefits: ['Ready-made plans reduce decision fatigue', 'Allergy-aware recipes prevent reactions', 'Cultural preferences increase adherence'] },
      { title: 'Food Logging', text: 'Patient logs meals with photo recognition or barcode scanning. Nutritional data auto-populated and tracked against daily targets.', module: 'Nutrition Planning', benefits: ['Photo recognition speeds logging', 'Barcode scanning ensures accuracy', 'Target tracking shows daily progress'] },
      { title: 'Fitness Activity', text: 'Exercise sessions logged manually or synced from wearables. System recommends activities based on conditions and physical limitations.', module: 'Fitness Tracking', benefits: ['Wearable sync automates tracking', 'Condition-appropriate recommendations prevent injury', 'Activity variety prevents burnout'] },
      { title: 'Progress Reports', text: 'Monthly reports show weight trend, nutritional compliance, activity levels, and correlation with clinical metrics like blood glucose and blood pressure.', module: 'Wellness Goals', benefits: ['Clinical correlation proves lifestyle impact', 'Visual progress motivates continuation', 'Provider sharing enables informed guidance'] }
    ],
    businessValue: [
      { icon: '🥗', metric: 'Personal', desc: 'Nutrition plans' },
      { icon: '🏃', metric: 'Tracked', desc: 'Fitness activity' },
      { icon: '📊', metric: 'Clinical', desc: 'Correlation insights' },
      { icon: '🎯', metric: 'Goal', desc: 'Progress tracking' }
    ],
    features: ['Nutrition Planning', 'Fitness Tracking', 'Wellness Goals', 'Wearable Integration', 'Health Records', 'Symptom Tracking']
  },
  {
    id: 'mental-health',
    num: '28',
    title: 'Mental Health Screening & Therapy Booking',
    desc: 'Mental health support with validated screening tools, therapist matching, teletherapy sessions, mood tracking, and crisis resources.',
    tags: ['Mental Health', 'Therapy', 'Screening', 'Mood Tracking'],
    steps: [
      { title: 'Mental Health Screening', text: 'Patient completes PHQ-9 (depression) and GAD-7 (anxiety) screenings. Validated scoring generates severity assessment and recommended care level.', module: 'Mental Health Screening', benefits: ['Validated instruments ensure clinical accuracy', 'Automated scoring provides instant assessment', 'Care level recommendation guides next steps'] },
      { title: 'Therapist Matching', text: 'Based on screening results and preferences, system suggests therapists — filtered by specialty (CBT, DBT), insurance, telehealth availability, and cultural competency.', module: 'Provider Directory', benefits: ['Specialty matching improves outcomes', 'Cultural competency filters serve diverse patients', 'Telehealth option removes access barriers'] },
      { title: 'Therapy Booking', text: 'Patient books an initial teletherapy session. System ensures confidential scheduling separate from general appointments.', module: 'Scheduling', benefits: ['Confidential scheduling protects privacy', 'Telehealth reduces stigma barriers', 'Rapid availability for acute needs'] },
      { title: 'Mood Tracking', text: 'Between sessions, patient tracks mood, sleep, and anxiety on a daily scale. Trends are shared with the therapist before each session.', module: 'Mood Tracking', benefits: ['Daily tracking reveals patterns between sessions', 'Pre-session data improves therapy efficiency', 'Visual trends show treatment progress'] },
      { title: 'Crisis Resources', text: 'If screening or mood tracking indicates severe distress, system immediately displays crisis hotline numbers, text lines, and nearest ER with one-tap calling.', module: 'Crisis Support', benefits: ['Immediate crisis resources may save lives', 'One-tap calling removes friction in emergencies', 'Multiple resource types serve different preferences'] }
    ],
    businessValue: [
      { icon: '🧠', metric: 'Validated', desc: 'PHQ-9 & GAD-7' },
      { icon: '🤝', metric: 'Matched', desc: 'Therapist fit' },
      { icon: '📊', metric: 'Daily', desc: 'Mood tracking' },
      { icon: '🆘', metric: 'Instant', desc: 'Crisis resources' }
    ],
    features: ['Mental Health Screening', 'Provider Directory', 'Scheduling', 'Mood Tracking', 'Crisis Support', 'Telehealth']
  },
  {
    id: 'pediatric-visit',
    num: '29',
    title: 'Pediatric Well-Child Visit Flow',
    desc: 'Managing children\'s healthcare with growth tracking, developmental milestones, vaccine scheduling, school forms, and parent-friendly visit summaries.',
    tags: ['Pediatric', 'Growth', 'Milestones', 'Family'],
    steps: [
      { title: 'Well-Child Reminder', text: 'Parent receives a reminder for their 2-year-old\'s well-child visit with age-appropriate developmental questionnaire and vaccine schedule preview.', module: 'Notifications', benefits: ['Age-based reminders follow AAP schedule', 'Developmental questionnaire pre-visit saves time', 'Vaccine preview helps parents prepare'] },
      { title: 'Growth Tracking', text: 'Height, weight, and head circumference plotted on CDC growth charts with percentiles. BMI tracking begins at age 2 with trend analysis.', module: 'Growth Charts', benefits: ['CDC chart comparison shows healthy development', 'Percentile tracking identifies concerns early', 'Visual charts are easy for parents to understand'] },
      { title: 'Developmental Milestones', text: 'Provider assesses and documents developmental milestones — language, motor, social, and cognitive. Delays flagged with referral recommendations.', module: 'Developmental Milestones', benefits: ['Structured assessment ensures nothing is missed', 'Delay detection enables early intervention', 'Referral recommendations guide next steps'] },
      { title: 'Vaccine Administration', text: 'Scheduled vaccines administered and documented. Parent receives updated immunization record and next vaccine schedule on the portal.', module: 'Immunizations', benefits: ['Real-time record update ensures accuracy', 'Next-schedule preview helps planning', 'Lot tracking supports safety surveillance'] },
      { title: 'Parent-Friendly Summary', text: 'Visit summary written in parent-friendly language — growth status, milestones met, vaccines given, and what to expect next. School forms auto-generated if needed.', module: 'Visit Summaries', benefits: ['Parent-friendly language improves understanding', 'Milestone summary reassures or flags concerns', 'Auto-generated school forms save time'] }
    ],
    businessValue: [
      { icon: '👶', metric: 'CDC', desc: 'Growth tracking' },
      { icon: '🧩', metric: 'Tracked', desc: 'Developmental milestones' },
      { icon: '💉', metric: 'AAP', desc: 'Vaccine schedule' },
      { icon: '📄', metric: 'Auto', desc: 'School forms' }
    ],
    features: ['Growth Charts', 'Developmental Milestones', 'Immunizations', 'Visit Summaries', 'Notifications', 'Family Dashboard']
  },
  {
    id: 'caregiver-elder',
    num: '30',
    title: 'Caregiver Access & Elder Care Management',
    desc: 'Supporting caregivers managing elderly family members — with proxy access, medication management, appointment coordination, and care team communication.',
    tags: ['Caregiver', 'Elder Care', 'Proxy', 'Coordination'],
    steps: [
      { title: 'Caregiver Authorization', text: 'Adult child sets up caregiver access for elderly parent. HIPAA authorization form completed digitally with specific access scopes — medical, billing, scheduling.', module: 'Proxy Access', benefits: ['HIPAA-compliant authorization protects privacy', 'Specific scopes match caregiver responsibilities', 'Digital process eliminates paper forms'] },
      { title: 'Medication Oversight', text: 'Caregiver views parent\'s medication list, sets up pill reminders, and receives notifications when refills are needed or medications are missed.', module: 'Medications', benefits: ['Medication visibility prevents dangerous errors', 'Pill reminders support adherence for elderly', 'Miss notifications enable timely intervention'] },
      { title: 'Appointment Coordination', text: 'Caregiver books and manages appointments for parent, arranges transportation, and receives visit summaries and follow-up instructions.', module: 'Scheduling', benefits: ['Proxy booking eliminates coordination burden', 'Transportation integration ensures attendance', 'Summary access enables informed caregiving'] },
      { title: 'Fall & Safety Monitoring', text: 'Connected devices monitor for falls and activity changes. Caregiver receives alerts for detected falls or unusual inactivity patterns.', module: 'Wearable Integration', benefits: ['Fall detection enables rapid response', 'Inactivity monitoring catches health changes', 'Peace of mind for remote caregivers'] },
      { title: 'Care Team Communication', text: 'Caregiver participates in care team messaging, receives provider notes, and coordinates with home health aides through the portal.', module: 'Messaging', benefits: ['Care team access enables coordinated care', 'Provider note access keeps caregiver informed', 'Home health coordination in one platform'] }
    ],
    businessValue: [
      { icon: '🤲', metric: 'Full', desc: 'Caregiver tools' },
      { icon: '💊', metric: 'Managed', desc: 'Medication oversight' },
      { icon: '🚨', metric: 'Connected', desc: 'Safety monitoring' },
      { icon: '👥', metric: 'Coordinated', desc: 'Care team access' }
    ],
    features: ['Proxy Access', 'Medications', 'Scheduling', 'Wearable Integration', 'Messaging', 'Notifications']
  }
];

// ── STEP COLORS ──────────────────────────────────────────
const STEP_COLORS = ['#78290F', '#15616D', '#FF7D00', '#001524', '#9a3a1a', '#1d7a89', '#ffaa44', '#0a2a3d'];

// ── FEATURE MAP DATA (10 groups, 56 modules) ─────────────
const FEATURE_GROUPS = [
  {
    title: 'Profile & Access',
    color: '#78290F',
    items: [
      { icon: '👤', name: 'Registration', desc: 'Self-registration with email verification and progressive onboarding', count: 'Self-service' },
      { icon: '🔐', name: 'MFA', desc: 'Multi-factor auth with TOTP, SMS, and recovery codes', count: 'HIPAA required' },
      { icon: '🪪', name: 'Identity Verification', desc: 'Government ID upload and knowledge-based identity proofing', count: '3 levels' },
      { icon: '📝', name: 'Consent Forms', desc: 'Digital consent with versioning and electronic signatures', count: 'Version-tracked' },
      { icon: '⚙️', name: 'Preferences', desc: 'Notification channels, timing, language, and quiet hours', count: 'Granular' },
      { icon: '🌐', name: 'Demographics', desc: 'Address, language, race/ethnicity, and emergency contacts', count: '20+ languages' }
    ]
  },
  {
    title: 'Family & Caregiving',
    color: '#15616D',
    items: [
      { icon: '👨‍👩‍👧‍👦', name: 'Family Linking', desc: 'Proxy access for dependents with relationship verification', count: 'Unlimited members' },
      { icon: '🔑', name: 'Proxy Access', desc: 'Age-based and role-based access controls for family members', count: 'Granular scopes' },
      { icon: '📊', name: 'Family Dashboard', desc: 'Unified health view for all linked family members', count: 'Multi-member' },
      { icon: '🧬', name: 'Pedigree Chart', desc: 'Multi-generational family health history visualization', count: 'D3-powered' },
      { icon: '👶', name: 'Growth Charts', desc: 'CDC growth chart plotting with percentile tracking', count: 'Pediatric' },
      { icon: '🧩', name: 'Developmental Milestones', desc: 'AAP-aligned milestone tracking and delay detection', count: 'Age-appropriate' }
    ]
  },
  {
    title: 'Appointments & Scheduling',
    color: '#FF7D00',
    items: [
      { icon: '🔍', name: 'Provider Directory', desc: 'Search by specialty, location, insurance, and availability', count: 'Real-time' },
      { icon: '📅', name: 'Scheduling', desc: 'Online booking with real-time calendar and waitlist', count: 'Multi-provider' },
      { icon: '📱', name: 'Check-In', desc: 'Digital check-in from mobile with wait time estimates', count: 'Contactless' },
      { icon: '📋', name: 'Forms', desc: 'Pre-visit questionnaires with smart branching', count: 'Specialty-specific' },
      { icon: '🔄', name: 'Calendar Sync', desc: 'Google, Apple, and Outlook calendar integration', count: 'Bi-directional' },
      { icon: '📊', name: 'Waitlist', desc: 'Automated waitlist management with alternate matching', count: 'Smart matching' }
    ]
  },
  {
    title: 'Telehealth & Virtual Care',
    color: '#001524',
    items: [
      { icon: '🎥', name: 'Video Visits', desc: 'HIPAA-compliant video with screen sharing and annotation', count: 'HD quality' },
      { icon: '🏠', name: 'Virtual Waiting Room', desc: 'Queue position, educational content, and provider readiness', count: 'Branded' },
      { icon: '🔧', name: 'Tech Check', desc: 'Pre-visit camera, mic, and bandwidth testing', count: 'Auto-troubleshoot' },
      { icon: '💊', name: 'E-Prescribing', desc: 'Electronic prescriptions with pharmacy selection', count: 'Formulary-aware' },
      { icon: '📍', name: 'Visit Tracking', desc: 'Real-time visit status updates for patients and family', count: 'Live status' },
      { icon: '🩺', name: 'Vitals', desc: 'Digital vitals capture integrated with visit workflow', count: 'Real-time entry' }
    ]
  },
  {
    title: 'Health Records',
    color: '#78290F',
    items: [
      { icon: '📊', name: 'Health Records', desc: 'Unified timeline with encounters, diagnoses, and conditions', count: 'Longitudinal' },
      { icon: '📄', name: 'Visit Summaries', desc: 'Patient-friendly notes with plain-language translation', count: 'Auto-generated' },
      { icon: '📈', name: 'Health Timeline', desc: 'Chronological health journey with change highlighting', count: 'Interactive' },
      { icon: '🗂️', name: 'Record Export', desc: 'Download in CCD, FHIR R4, and PDF formats', count: 'Multi-format' },
      { icon: '🔗', name: 'Record Sharing', desc: 'Time-limited secure links with access logging', count: 'Revocable' },
      { icon: '📑', name: 'Care Plans', desc: 'Treatment plans with goal tracking and adherence monitoring', count: 'Multi-condition' }
    ]
  },
  {
    title: 'Lab & Imaging',
    color: '#15616D',
    items: [
      { icon: '🧪', name: 'Lab Results', desc: 'Color-coded results with reference ranges and explanations', count: 'Visual display' },
      { icon: '📈', name: 'Trending Charts', desc: 'Multi-year line charts for tracking health metrics over time', count: 'Interactive' },
      { icon: '🩻', name: 'Imaging Reports', desc: 'Radiology reports with patient-friendly summaries and DICOM viewer', count: 'Image access' },
      { icon: '🔬', name: 'Pathology', desc: 'Pathology report viewing with educational context', count: 'Annotated' },
      { icon: '🧬', name: 'Genetic Testing', desc: 'Genetic test results with counseling resources', count: 'Privacy-protected' },
      { icon: '🔄', name: 'Referrals', desc: 'Specialist referral tracking with automatic record transfer', count: 'Bidirectional' }
    ]
  },
  {
    title: 'Medications & Pharmacy',
    color: '#FF7D00',
    items: [
      { icon: '💊', name: 'Medications', desc: 'Active medication list with dosage, frequency, and supply tracking', count: 'Complete profile' },
      { icon: '💉', name: 'Immunizations', desc: 'Vaccination history with CDC schedule and registry integration', count: 'Registry-linked' },
      { icon: '⚠️', name: 'Allergies', desc: 'Allergy and intolerance tracking with severity levels', count: 'Structured data' },
      { icon: '🏪', name: 'Pharmacy', desc: 'Preferred pharmacy management with pricing comparison', count: 'Multi-pharmacy' },
      { icon: '📋', name: 'Prescriptions', desc: 'E-prescribing with formulary and prior authorization', count: 'E-Rx enabled' },
      { icon: '⚡', name: 'Drug Interactions', desc: 'Real-time drug-drug, drug-food, and drug-allergy checking', count: 'Multi-level' }
    ]
  },
  {
    title: 'Communication',
    color: '#001524',
    items: [
      { icon: '💬', name: 'Messaging', desc: 'HIPAA-compliant threaded messaging with care team routing', count: 'Secure threads' },
      { icon: '🔔', name: 'Notifications', desc: 'Multi-channel alerts for appointments, results, and billing', count: 'Push/SMS/Email' },
      { icon: '👥', name: 'Care Team', desc: 'View care team members with roles and direct messaging', count: 'Role-based' },
      { icon: '📎', name: 'Attachments', desc: 'Secure photo and document sharing within messages', count: 'Up to 25MB' },
      { icon: '🏥', name: 'Triage', desc: 'Nurse-driven message triage with escalation workflows', count: 'Priority-based' },
      { icon: '📚', name: 'Patient Education', desc: 'Condition-specific educational resources and materials', count: 'Curated library' }
    ]
  },
  {
    title: 'Billing & Insurance',
    color: '#78290F',
    items: [
      { icon: '💳', name: 'Payments', desc: 'Online payment with stored cards, bank, and HSA', count: 'Multiple methods' },
      { icon: '📃', name: 'Statements', desc: 'Itemized billing with insurance breakdown', count: 'Plain language' },
      { icon: '🏥', name: 'Insurance', desc: 'Card scanning, eligibility, and coverage details', count: 'Real-time verify' },
      { icon: '📑', name: 'Claims', desc: 'Insurance claim tracking with denial management', count: 'Full lifecycle' },
      { icon: '⏳', name: 'Authorization', desc: 'Prior authorization submission and status tracking', count: 'Auto-submit' },
      { icon: '💰', name: 'Cost Estimator', desc: 'Pre-service cost estimation with facility comparison', count: 'Transparent' }
    ]
  },
  {
    title: 'Wellness & Mental Health',
    color: '#15616D',
    items: [
      { icon: '🎯', name: 'Wellness Goals', desc: 'Personal health goal setting with progress tracking', count: 'Goal tracker' },
      { icon: '🩺', name: 'Preventive Care', desc: 'USPSTF-based screening checklists and reminders', count: 'Age-appropriate' },
      { icon: '📋', name: 'Health Assessments', desc: 'Annual health risk assessments with scoring', count: 'Validated tools' },
      { icon: '🧠', name: 'Mental Health Screening', desc: 'PHQ-9, GAD-7, and other validated screening tools', count: 'Auto-scored' },
      { icon: '📊', name: 'Mood Tracking', desc: 'Daily mood, sleep, and anxiety tracking with trends', count: 'Visual trends' },
      { icon: '🆘', name: 'Crisis Support', desc: 'Crisis hotlines, text lines, and nearest ER with one-tap calling', count: 'Immediate access' }
    ]
  }
];

// ── EXPORT for Node.js ───────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLOWS, STEP_COLORS, FEATURE_GROUPS };
}

// Guard browser-only code
if (typeof document === 'undefined') { /* Node.js — stop here */ } else {

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

document.addEventListener('DOMContentLoaded', () => {
  renderFlowCards();
  renderFeatureMap();
  initNav();
  initScrollAnimations();
  initMindMap();
});

function initNav() {
  const nav = $('.nav');
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 20); });
  if (toggle) {
    toggle.addEventListener('click', () => { links.classList.toggle('open'); });
    $$('a', links).forEach(a => { a.addEventListener('click', () => links.classList.remove('open')); });
  }
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a[href^="#"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => observer.observe(s));
}

function renderFlowCards() {
  const grid = $('#flow-grid');
  if (!grid) return;
  grid.innerHTML = FLOWS.map(f => `
    <a class="flow-card" href="flow-${f.id}.html" target="_blank" rel="noopener" data-flow-id="${f.id}">
      <div class="flow-card-top">
        <div class="flow-card-num">Flow ${f.num}</div>
        <div class="flow-card-title">${f.title}</div>
        <div class="flow-card-desc">${f.desc.slice(0, 120)}${f.desc.length > 120 ? '...' : ''}</div>
      </div>
      <div class="flow-card-footer">
        <div class="flow-card-tags">${f.tags.map(t => `<span class="flow-tag">${t}</span>`).join('')}</div>
        <span class="flow-card-arrow">\u2192</span>
      </div>
    </a>
  `).join('');
}

function renderFeatureMap() {
  const container = $('#feature-map');
  if (!container) return;
  container.innerHTML = FEATURE_GROUPS.map(g =>
    g.items.map(item => `
      <div class="fm-card">
        <div class="fm-card-icon" style="background: ${g.color}15; color: ${g.color}">${item.icon}</div>
        <div class="fm-card-title">${item.name}</div>
        <div class="fm-card-text">${item.desc}</div>
        <div class="fm-card-count">${item.count}</div>
      </div>
    `).join('')
  ).join('');
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  $$('.fade-section').forEach(el => observer.observe(el));
}

// ── MIND MAP (10 pillars, 12 connections) ─────────────────
const MIND_MAP = {
  center: { x: 50, y: 46, label: 'GoHealth', sublabel: 'Patient Portal' },
  pillars: [
    { id: 'profile', title: 'Profile &\nAccess', color: '#78290F', x: 50, y: 10,
      desc: 'Patient onboarding, identity verification, consent management, and personalized preferences.',
      modules: ['Registration', 'MFA', 'Identity Verification', 'Consent Forms', 'Preferences'] },
    { id: 'family', title: 'Family &\nCare', color: '#15616D', x: 79, y: 17,
      desc: 'Family account linking, proxy access, pediatric tracking, elder care, and pedigree charts.',
      modules: ['Family Linking', 'Proxy Access', 'Family Dashboard', 'Growth Charts', 'Pedigree Chart'] },
    { id: 'appointments', title: 'Appoint-\nments', color: '#FF7D00', x: 93, y: 40,
      desc: 'Provider search, online booking, digital check-in, pre-visit forms, and waitlist management.',
      modules: ['Provider Directory', 'Scheduling', 'Check-In', 'Forms', 'Waitlist'] },
    { id: 'telehealth', title: 'Tele-\nhealth', color: '#001524', x: 87, y: 68,
      desc: 'HIPAA-compliant video visits, e-prescribing, virtual waiting rooms, and visit tracking.',
      modules: ['Video Visits', 'E-Prescribing', 'Virtual Waiting Room', 'Tech Check'] },
    { id: 'records', title: 'Health\nRecords', color: '#78290F', x: 68, y: 87,
      desc: 'Unified health timeline, visit summaries, record export/sharing, and care plans.',
      modules: ['Health Records', 'Visit Summaries', 'Record Export', 'Record Sharing', 'Care Plans'] },
    { id: 'lab', title: 'Lab &\nImaging', color: '#15616D', x: 32, y: 87,
      desc: 'Lab results with trending, imaging reports with DICOM viewer, and specialist referrals.',
      modules: ['Lab Results', 'Trending Charts', 'Imaging Reports', 'Referrals'] },
    { id: 'medications', title: 'Medica-\ntions', color: '#FF7D00', x: 13, y: 68,
      desc: 'Prescriptions, immunizations, allergy management, pharmacy selection, and drug interaction checking.',
      modules: ['Medications', 'Immunizations', 'Allergies', 'Pharmacy', 'Drug Interactions'] },
    { id: 'communication', title: 'Commu-\nnication', color: '#001524', x: 7, y: 40,
      desc: 'Secure messaging, notifications, care team contacts, triage, and patient education.',
      modules: ['Messaging', 'Notifications', 'Care Team', 'Triage', 'Patient Education'] },
    { id: 'billing', title: 'Billing &\nInsurance', color: '#78290F', x: 21, y: 17,
      desc: 'Online payments, insurance management, claims tracking, cost estimation, and authorization.',
      modules: ['Payments', 'Insurance', 'Claims', 'Cost Estimator', 'Authorization'] },
    { id: 'wellness', title: 'Wellness &\nMental', color: '#15616D', x: 50, y: 92,
      desc: 'Wellness goals, preventive care, mental health screening, mood tracking, and crisis support.',
      modules: ['Wellness Goals', 'Preventive Care', 'Mental Health Screening', 'Mood Tracking', 'Crisis Support'] },
  ],
  connections: [
    { from: 'profile', to: 'family', label: 'Identity \u2192 Family Linking', flows: ['patient-signup', 'family-linking'] },
    { from: 'profile', to: 'appointments', label: 'Profile \u2192 Provider Matching', flows: ['provider-search', 'pre-visit'] },
    { from: 'appointments', to: 'telehealth', label: 'Booking \u2192 Virtual Visit', flows: ['telehealth', 'in-office-visit'] },
    { from: 'telehealth', to: 'records', label: 'Visit \u2192 Health Records', flows: ['visit-summary', 'health-records'] },
    { from: 'records', to: 'lab', label: 'Orders \u2192 Results', flows: ['lab-results', 'imaging-review'] },
    { from: 'lab', to: 'medications', label: 'Results \u2192 Prescriptions', flows: ['prescription-refill', 'allergy-interaction'] },
    { from: 'medications', to: 'communication', label: 'Alerts \u2192 Care Team', flows: ['secure-messaging', 'new-medication'] },
    { from: 'communication', to: 'billing', label: 'Follow-Up \u2192 Billing', flows: ['bill-payment', 'notification-mgmt'] },
    { from: 'billing', to: 'profile', label: 'Insurance \u2192 Profile', flows: ['insurance-mgmt', 'profile-setup'] },
    { from: 'wellness', to: 'appointments', label: 'Screening \u2192 Booking', flows: ['wellness-screening', 'chronic-disease'] },
    { from: 'wellness', to: 'medications', label: 'Monitoring \u2192 Adherence', flows: ['wearable-monitoring', 'nutrition-fitness'] },
    { from: 'family', to: 'wellness', label: 'Pediatric \u2192 Well-Child', flows: ['pediatric-visit', 'immunization-records'] },
  ],
  businessValue: [
    { icon: '\ud83d\udcc8', metric: '60%', desc: 'Fewer No-Shows' },
    { icon: '\ud83d\udcb0', metric: '35%', desc: 'Faster Collections' },
    { icon: '\ud83d\udee1\ufe0f', metric: '100%', desc: 'HIPAA Compliant' },
    { icon: '\u26a1', metric: '24/7', desc: 'Patient Access' },
  ]
};

function initMindMap() {
  const game = $('#mm-game');
  if (!game) return;
  const stage = $('#mm-stage');
  const svg = $('#mm-lines');
  const info = $('#mm-info');
  const hint = $('#mm-hint');
  const finale = $('#mm-finale');
  const progressFill = $('#mm-progress-fill');
  const progressText = $('#mm-progress-text');

  let state = 'IDLE';
  const discovered = new Set();
  let activeConnection = null;
  let autoAdvanceTimer = null;
  const pillarNodes = {};
  const pillarLeaves = {};
  const PILLAR_COUNT = MIND_MAP.pillars.length;

  const isMobile = () => window.innerWidth < 768;

  function getMobilePositions() {
    const cols = 2, rows = Math.ceil(PILLAR_COUNT / cols);
    const pillars = [];
    for (let i = 0; i < PILLAR_COUNT; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      pillars.push({ x: col === 0 ? 28 : 72, y: 16 + row * 14 });
    }
    return { center: { x: 50, y: 5 }, pillars };
  }

  function getPos(data, index) {
    if (isMobile()) {
      const mp = getMobilePositions();
      if (index === undefined) return mp.center;
      return mp.pillars[index];
    }
    return data;
  }

  const centerData = MIND_MAP.center;
  const centerPos = getPos(centerData);
  const centerEl = document.createElement('div');
  centerEl.className = 'mm-node mm-node--center';
  centerEl.style.left = centerPos.x + '%';
  centerEl.style.top = centerPos.y + '%';
  centerEl.innerHTML = `<span class="mm-node-label">${centerData.label}</span><span class="mm-node-sub">${centerData.sublabel}</span>`;
  centerEl.dataset.role = 'center';
  stage.appendChild(centerEl);

  MIND_MAP.pillars.forEach((p, i) => {
    const pos = getPos(p, i);
    const el = document.createElement('div');
    el.className = 'mm-node mm-node--pillar';
    el.style.left = pos.x + '%';
    el.style.top = pos.y + '%';
    el.style.background = p.color + '25';
    el.style.borderColor = p.color;
    el.innerHTML = `<span class="mm-node-label">${p.title.replace(/\n/g, '<br>')}</span>`;
    el.dataset.role = 'pillar';
    el.dataset.pillar = p.id;
    stage.appendChild(el);
    pillarNodes[p.id] = el;

    const leaves = [];
    p.modules.forEach((mod, mi) => {
      const leaf = document.createElement('div');
      leaf.className = 'mm-node mm-node--leaf';
      leaf.style.borderColor = p.color;
      leaf.innerHTML = `<span class="mm-node-label">${mod}</span>`;
      leaf.dataset.role = 'leaf';
      leaf.dataset.pillar = p.id;
      leaf.dataset.module = mod;
      const angle = (Math.PI * 2 / p.modules.length) * mi - Math.PI / 2;
      const radius = isMobile() ? 9 : 8;
      const lx = pos.x + Math.cos(angle) * radius;
      const ly = pos.y + Math.sin(angle) * (isMobile() ? 5 : 8);
      leaf.style.left = Math.max(3, Math.min(97, lx)) + '%';
      leaf.style.top = Math.max(2, Math.min(98, ly)) + '%';
      stage.appendChild(leaf);
      leaves.push(leaf);
    });
    pillarLeaves[p.id] = leaves;
  });

  requestAnimationFrame(() => { centerEl.classList.add('visible'); });

  function getNodeCenter(el) {
    const stageRect = stage.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - stageRect.left, y: rect.top + rect.height / 2 - stageRect.top };
  }

  function drawLine(x1, y1, x2, y2, color, clickable) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.classList.add('mm-line');
    if (clickable) line.classList.add('clickable');
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    svg.appendChild(line);
    requestAnimationFrame(() => { requestAnimationFrame(() => { line.classList.add('drawn'); }); });
    return line;
  }

  function updateProgress(pct, text) { progressFill.style.width = pct + '%'; progressText.textContent = text; }

  function updateInfo(title, desc, modules, hintText) {
    info.innerHTML = `<div class="mm-info-title">${title}</div><div class="mm-info-desc">${desc}</div>${modules ? `<div class="mm-info-modules">${modules.map(m => `<span class="mm-info-pill">${m}</span>`).join('')}</div>` : ''}${hintText ? `<div class="mm-info-hint">${hintText}</div>` : ''}`;
    info.classList.add('show');
  }

  function updateHint(text) { hint.textContent = text; }

  function activateConnection(connIndex) {
    if (activeConnection === connIndex) { resetFilter(); return; }
    activeConnection = connIndex;
    const conn = MIND_MAP.connections[connIndex];
    const connPillars = [conn.from, conn.to];
    MIND_MAP.pillars.forEach(p => {
      const el = pillarNodes[p.id]; const leaves = pillarLeaves[p.id];
      if (connPillars.includes(p.id)) { el.classList.remove('dimmed'); el.classList.add('highlighted'); leaves.forEach(l => { l.classList.remove('dimmed'); l.classList.add('highlighted'); }); }
      else { el.classList.remove('highlighted'); el.classList.add('dimmed'); leaves.forEach(l => { l.classList.remove('highlighted'); l.classList.add('dimmed'); }); }
    });
    centerEl.classList.add('dimmed');
    svg.querySelectorAll('.mm-line').forEach(line => {
      if (line.dataset.connIndex === String(connIndex)) { line.classList.remove('dimmed'); line.classList.add('highlighted'); }
      else { line.classList.remove('highlighted'); line.classList.add('dimmed'); }
    });
    document.querySelectorAll('.flow-card[data-flow-id]').forEach(card => {
      if (conn.flows.includes(card.dataset.flowId)) { card.classList.remove('dimmed'); card.classList.add('highlighted'); }
      else { card.classList.remove('highlighted'); card.classList.add('dimmed'); }
    });
    const fromP = MIND_MAP.pillars.find(p => p.id === conn.from);
    const toP = MIND_MAP.pillars.find(p => p.id === conn.to);
    const related = conn.flows.map(fid => FLOWS.find(f => f.id === fid)).filter(Boolean);
    updateInfo(conn.label, `${fromP.title.replace(/\n/g, ' ')} \u2194 ${toP.title.replace(/\n/g, ' ')} \u2014 ${related.length} workflows.`, related.map(f => f.title), null);
    const r = document.createElement('span'); r.className = 'mm-info-reset'; r.textContent = '\u2715 Clear filter';
    r.addEventListener('click', (e) => { e.stopPropagation(); resetFilter(); });
    info.querySelector('.mm-info-desc').after(r);
    updateHint('Click a flow card or clear filter');
  }

  function showModuleInfo(moduleName, pillarId) {
    let foundItem = null, foundGroup = null;
    const lm = moduleName.toLowerCase();
    for (const g of FEATURE_GROUPS) { for (const it of g.items) { if (it.name.toLowerCase() === lm || it.name.toLowerCase().includes(lm) || lm.includes(it.name.toLowerCase())) { foundItem = it; foundGroup = g; break; } } if (foundItem) break; }
    const pillar = MIND_MAP.pillars.find(p => p.id === pillarId);
    const related = FLOWS.filter(f => (f.features && f.features.some(ft => ft.toLowerCase().includes(lm) || lm.includes(ft.toLowerCase()))) || (f.tags && f.tags.some(t => t.toLowerCase().includes(lm) || lm.includes(t.toLowerCase()))));
    const title = foundItem ? `${foundItem.icon} ${foundItem.name}` : moduleName;
    const desc = foundItem ? `${foundItem.desc}<br><small style="color:var(--teal-dark)">${foundItem.count} \u00b7 ${pillar ? pillar.title.replace(/\n/g, ' ') : ''} pillar</small>` : `Module in the ${pillar ? pillar.title.replace(/\n/g, ' ') : ''} pillar.`;
    updateInfo(title, desc, related.length > 0 ? related.map(f => f.title) : null, related.length > 0 ? `Used in ${related.length} workflow${related.length > 1 ? 's' : ''}` : null);
    Object.values(pillarLeaves).flat().forEach(l => { if (l.dataset.module === moduleName) { l.classList.add('highlighted'); l.classList.remove('dimmed'); } else { l.classList.remove('highlighted'); } });
    const r = document.createElement('span'); r.className = 'mm-info-reset'; r.textContent = '\u2715 Clear selection';
    r.addEventListener('click', (e) => { e.stopPropagation(); resetFilter(); });
    info.querySelector('.mm-info-desc').after(r);
  }

  function resetFilter() {
    activeConnection = null;
    stage.querySelectorAll('.mm-node').forEach(n => n.classList.remove('dimmed', 'highlighted'));
    svg.querySelectorAll('.mm-line').forEach(l => l.classList.remove('dimmed', 'highlighted'));
    document.querySelectorAll('.flow-card').forEach(c => c.classList.remove('dimmed', 'highlighted'));
    if (state === 'CONNECTED') updateInfo('System Connections', 'GoHealth modules don\'t work in isolation \u2014 data flows automatically between pillars. Click any glowing connection line to see the relationship.', null, 'Click connection lines or leaf modules to explore');
    else if (state === 'COMPLETE') info.classList.remove('show');
  }

  function transitionToExploring() {
    state = 'EXPLORING';
    centerEl.classList.add('expanded');
    updateInfo('GoHealth \u2014 Patient Portal', 'A unified platform connecting every aspect of patient healthcare \u2014 10 pillars covering profile, family, appointments, telehealth, records, lab, medications, communication, billing, and wellness.', null, 'Click any glowing pillar to discover its modules');
    updateProgress(5, 'Exploring \u2014 click the pillars');
    updateHint('Click any glowing pillar to discover its modules');
    MIND_MAP.pillars.forEach((p, i) => {
      setTimeout(() => { pillarNodes[p.id].classList.add('visible'); pillarNodes[p.id].classList.add('clickable'); }, 200 + i * 100);
    });
  }

  function discoverPillar(pillarId) {
    if (discovered.has(pillarId)) return;
    discovered.add(pillarId);
    const pillar = MIND_MAP.pillars.find(p => p.id === pillarId);
    const el = pillarNodes[pillarId];
    el.classList.remove('clickable'); el.classList.add('discovered');
    el.style.background = pillar.color + '40';
    el.style.boxShadow = `0 0 20px ${pillar.color}50`;
    const c = getNodeCenter(centerEl), p = getNodeCenter(el);
    drawLine(c.x, c.y, p.x, p.y, pillar.color + '80', false);
    pillarLeaves[pillarId].forEach((leaf, i) => { setTimeout(() => leaf.classList.add('visible'), 300 + i * 80); });
    const remaining = PILLAR_COUNT - discovered.size;
    updateInfo(pillar.title.replace(/\n/g, ' '), pillar.desc, pillar.modules, remaining > 0 ? `${remaining} more pillar${remaining > 1 ? 's' : ''} to discover` : 'All pillars discovered! Watch the connections come alive...');
    updateProgress(5 + (discovered.size / PILLAR_COUNT) * 70, `${discovered.size}/${PILLAR_COUNT} pillars discovered`);
    if (remaining > 0) updateHint(`${remaining} more pillar${remaining > 1 ? 's' : ''} to discover`);
    if (discovered.size === PILLAR_COUNT) setTimeout(transitionToConnected, 800);
  }

  function transitionToConnected() {
    state = 'CONNECTED';
    updateHint('Cross-pillar connections revealed \u2014 click a line or leaf module to explore');
    updateProgress(80, 'Connections revealed');
    Object.values(pillarLeaves).flat().forEach(l => l.classList.add('clickable'));
    MIND_MAP.connections.forEach((conn, i) => {
      const fromEl = pillarNodes[conn.from], toEl = pillarNodes[conn.to];
      if (!fromEl || !toEl) return;
      setTimeout(() => { const f = getNodeCenter(fromEl), t = getNodeCenter(toEl); const pf = MIND_MAP.pillars.find(p => p.id === conn.from); const line = drawLine(f.x, f.y, t.x, t.y, pf.color + '60', true); line.dataset.connIndex = i; }, i * 150);
    });
    updateInfo('System Connections', 'GoHealth modules don\'t work in isolation \u2014 data flows automatically between pillars. Click any glowing connection line to see the relationship.', null, 'Click connection lines or leaf modules to explore');
    autoAdvanceTimer = setTimeout(() => { if (state === 'CONNECTED') transitionToComplete(); }, 6000);
  }

  function transitionToComplete() {
    state = 'COMPLETE'; resetFilter();
    updateProgress(100, 'Discovery complete!');
    updateHint('Click connection lines or modules to explore \u2022 Scroll down for 30 workflows \u2193');
    info.classList.remove('show');
    Object.values(pillarLeaves).flat().forEach(l => l.classList.add('clickable'));
    svg.querySelectorAll('.mm-line').forEach(l => l.classList.add('clickable'));
    finale.innerHTML = `<div class="mm-finale-title">Business Impact</div><div class="mm-finale-grid">${MIND_MAP.businessValue.map(bv => `<div class="mm-bv-card"><div class="mm-bv-icon">${bv.icon}</div><div class="mm-bv-metric">${bv.metric}</div><div class="mm-bv-desc">${bv.desc}</div></div>`).join('')}</div>`;
    finale.classList.add('show');
    centerEl.style.boxShadow = '0 0 50px rgba(255,125,0,0.6), 0 0 100px rgba(255,125,0,0.3)';
    setTimeout(() => { centerEl.style.boxShadow = '0 0 30px rgba(255,125,0,0.4), 0 0 60px rgba(255,125,0,0.15)'; }, 800);
  }

  function handleConnectionClick(idx) {
    const conn = MIND_MAP.connections[idx]; if (!conn) return;
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    stage.querySelectorAll('.mm-conn-label').forEach(l => l.remove());
    const fromEl = pillarNodes[conn.from], toEl = pillarNodes[conn.to];
    const f = getNodeCenter(fromEl), t = getNodeCenter(toEl), sr = stage.getBoundingClientRect();
    const label = document.createElement('div'); label.className = 'mm-conn-label'; label.textContent = conn.label;
    label.style.left = ((f.x + t.x) / 2 / sr.width * 100) + '%'; label.style.top = ((f.y + t.y) / 2 / sr.height * 100) + '%';
    stage.appendChild(label); requestAnimationFrame(() => label.classList.add('show'));
    setTimeout(() => label.classList.remove('show'), 2500);
    activateConnection(idx);
  }

  stage.addEventListener('click', (e) => {
    const node = e.target.closest('.mm-node'), line = e.target.closest('.mm-line');
    if (node) {
      const role = node.dataset.role;
      if (role === 'center' && state === 'IDLE') transitionToExploring();
      else if (role === 'pillar' && state === 'EXPLORING' && node.classList.contains('clickable')) discoverPillar(node.dataset.pillar);
      else if (role === 'leaf' && (state === 'CONNECTED' || state === 'COMPLETE')) {
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        if (state === 'COMPLETE') { info.classList.add('show'); finale.classList.remove('show'); }
        showModuleInfo(node.dataset.module, node.dataset.pillar);
      }
    }
    if (line && line.classList.contains('clickable') && (state === 'CONNECTED' || state === 'COMPLETE')) {
      const idx = parseInt(line.dataset.connIndex);
      if (state === 'COMPLETE') { info.classList.add('show'); finale.classList.remove('show'); }
      handleConnectionClick(idx);
    }
  });

  svg.addEventListener('click', (e) => {
    const line = e.target.closest('.mm-line');
    if (line && line.classList.contains('clickable') && (state === 'CONNECTED' || state === 'COMPLETE')) {
      e.stopPropagation();
      const idx = parseInt(line.dataset.connIndex);
      if (state === 'COMPLETE') { info.classList.add('show'); finale.classList.remove('show'); }
      handleConnectionClick(idx);
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const cPos = getPos(MIND_MAP.center); centerEl.style.left = cPos.x + '%'; centerEl.style.top = cPos.y + '%';
      MIND_MAP.pillars.forEach((p, i) => {
        const pos = getPos(p, i); const el = pillarNodes[p.id];
        el.style.left = pos.x + '%'; el.style.top = pos.y + '%';
        const leaves = pillarLeaves[p.id];
        p.modules.forEach((mod, mi) => {
          const angle = (Math.PI * 2 / p.modules.length) * mi - Math.PI / 2;
          const radius = isMobile() ? 9 : 8;
          const lx = pos.x + Math.cos(angle) * radius;
          const ly = pos.y + Math.sin(angle) * (isMobile() ? 5 : 8);
          leaves[mi].style.left = Math.max(3, Math.min(97, lx)) + '%';
          leaves[mi].style.top = Math.max(2, Math.min(98, ly)) + '%';
        });
      });
      if (state !== 'IDLE') {
        svg.innerHTML = '';
        discovered.forEach(pid => {
          const pil = MIND_MAP.pillars.find(p => p.id === pid); const el = pillarNodes[pid];
          const c = getNodeCenter(centerEl), p = getNodeCenter(el);
          const line = drawLine(c.x, c.y, p.x, p.y, pil.color + '80', false); line.classList.add('drawn');
        });
        if (state === 'CONNECTED' || state === 'COMPLETE') {
          MIND_MAP.connections.forEach((conn, i) => {
            const fe = pillarNodes[conn.from], te = pillarNodes[conn.to];
            const f = getNodeCenter(fe), t = getNodeCenter(te);
            const pf = MIND_MAP.pillars.find(p => p.id === conn.from);
            const line = drawLine(f.x, f.y, t.x, t.y, pf.color + '60', true); line.classList.add('drawn'); line.dataset.connIndex = i;
          });
          if (activeConnection !== null) { const s = activeConnection; activeConnection = null; activateConnection(s); }
        }
      }
    }, 250);
  });
}

} // end browser guard
