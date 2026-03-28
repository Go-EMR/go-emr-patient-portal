# GoEMR Patient Portal — Web Application
## Family Management · Genetic History · Medicolegal Ruleset · Family Chart
### Feature Specification for Claude Code · India · Romania · Australia · USA
> v1.0 | GoEMR Startup

---

## Section 1 — Family Member Management

### 1.1 Family Group Dashboard

- Dedicated `/family` route rendered as a full-page dashboard
- Left sidebar: list of all family members with avatar, name, relationship badge, and access level indicator
- Main area: family chart (see Section 4) occupies 70% of screen; right panel (30%) shows selected member's detail
- Top toolbar: "Add Member" button · "Manage Permissions" button · "Export Chart" button · toggle switches for chart view modes (Genetics / Permissions / Risk)
- Each member card in sidebar shows:
  - Avatar (initials-based if no photo) with colored border indicating access level (green/amber/red/gray)
  - Full name + relationship
  - Age or year of birth
  - Quick access badge: 🔓 Full · 🔒 Partial · 🆘 Emergency · ✗ None
  - Hover reveals: "View Profile" / "Edit Access" / "View in Chart" quick-action buttons
- Family group stored via FHIR `Group` resource on GoEMR backend; each member linked as `Group.member.entity`

### 1.2 Add Family Member — Slide-Over Panel

- "Add Member" opens a right-side slide-over panel (not a modal — keeps chart visible)
- Step 1 — Relationship selection:
  - Visual card grid: Spouse/Partner · Child (Minor) · Child (Adult) · Parent · Grandparent · Sibling · Pet
  - Each card has an icon + label + short description ("Under 18 — parental access rules apply")
- Step 2 — Identification method:
  - **Invite via email or SMS**: send invite link → invitee registers/logs in → relationship confirmed by both parties
  - **Manual entry**: for offline, deceased, or non-digital family members (used for genetic history entries)
  - **ABHA match** (India): enter 14-digit ABHA number → call ABDM Verify API → auto-link if confirmed
  - **IHI match** (Australia): enter IHI + name + DOB → call ADHA IHI service
  - **CNP match** (Romania): enter CNP → flagged as `unverified` (no API available)
  - **MRN match** (USA): enter MRN within GoEMR network
- Step 3 — Relationship details:
  - Biological relationship toggle: Yes / No / Unknown (determines inclusion in genetic calculations)
  - Relationship type refinement (e.g., biological vs adoptive parent)
- Step 4 — Initial permissions:
  - Permission level selector with visual explanation of each level
  - Record category toggles (appointments, labs, medications, mental health, etc.)
  - Time limit toggle: enable expiry date picker for temporary access grants
- Each family member stored as FHIR `Patient` (if GoEMR user) or `RelatedPerson` (if not) linked via `Patient.link`

### 1.3 Spouse / Partner Management

- Partners linked via bidirectional `RelatedPerson` resources (`SPS` role code)
- Invite flow: system generates a unique token link valid for 72 hours; invitee must authenticate to accept
- After acceptance, both partners see each other in their family dashboard
- Default access on acceptance: **Partial** — appointments + medications visible; clinical notes, mental health, reproductive health, genetic data blocked by default
- Either party edits permissions independently from the Access Management panel
- Relationship status options: Married · Domestic Partner · De Facto · Common Law · Unmarried Partner
- Separation handling: "Remove Partner Access" button immediately revokes all permissions; audit log entry created

### 1.4 Minor Child Management (Under 18)

- Added by parent via manual entry or ABHA/IHI matching
- Child record shows in parent's dashboard with a 🧒 badge
- **Age-gated access control** — evaluated server-side on every access request:
  - **India**: Full parental access until age 18; binary cutoff
  - **Romania**: Full access until 14; restricted (child's opinion logged) 14–16; child can override at 16
  - **Australia**: Full access until **age 14**; on 14th birthday: all representative access auto-revoked; system sends email to parent ("Access to [name]'s records has been updated") and SMS to child ("You now control your own health records")
  - **USA**: State-specific rules loaded from country config; sensitive categories (STI, mental health, substance abuse, reproductive health, contraception) hidden from parent view from the state-configured age (12–16 range); state selector shown during setup
- Parent dashboard shows countdown: "Access to [child's name]'s records changes in **47 days** (turns 14 on [date])"
- Sensitive category filter: applied server-side before data reaches the browser — parent never receives sensitive records in API response, not just hidden in UI
- Parental controls panel: toggle individual record categories on/off within allowed scope

### 1.5 Adult Child (18+) Management

- Added via invite link only (no manual entry for active GoEMR users)
- On invite acceptance: default access is **No Access** — adult child must explicitly grant permissions
- Adult child manages their permissions from their own portal account
- Parent's view: shows adult child in family list with current access level; "Request Access" button sends a permission request notification to the adult child
- Emergency access option: adult child can pre-configure an emergency access profile for parent (blood type, allergies, active medications only)

### 1.6 Parent / Grandparent — Elderly Dependant Management

- "Assisted Account" mode for elderly members without digital access: a family admin manages on their behalf
- Setup requires uploading legal authorization:
  - Power of Attorney (general or healthcare-specific)
  - Court Guardianship Order
  - Nominated Representative form (Australia: downloaded from My Health Record system)
- Document upload: drag-and-drop PDF/image; stored as `DocumentReference` FHIR resource linked to the `RelatedPerson`
- Proxy status pipeline:
  - `pending-upload` → `pending-verification` → `verified` → `active`
  - During `pending-verification`: proxy can view (read-only) but cannot take actions
  - Verification done by GoEMR clinic staff; they mark status as `verified` from the EMR admin panel
- All proxy actions display a banner: "You are acting as proxy for [Name]. All actions are logged."
- Action log table: timestamp · action · record affected · proxy actor ID — downloadable as CSV

### 1.7 Pet Profile Management

- Pet added from "Add Member" → select "Pet"
- Pet profile page at `/family/pets/{id}`:
  - **Profile tab**: name · species · breed · DOB · sex · microchip number · primary vet clinic
  - **Vaccinations tab**: table with columns — vaccine name · date administered · next due date · administering vet · upload certificate (PDF/image)
  - **Medications tab**: active medications table — name · dose · frequency · prescribing vet · start date · end date; "+ Add Medication" button
  - **Allergies tab**: allergen · reaction · severity (mild/moderate/severe); tag-based input
  - **Weight Log tab**: line chart of weight over time with date-stamped entries; "+ Log Weight" opens inline form
  - **Zoonotic Flags tab**: checkboxes for reportable zoonotic conditions (ringworm · Lyme disease · toxoplasmosis · campylobacter · salmonella · rabies exposure · giardia · MRSA · Q fever); when any flagged: a red alert banner appears on all linked human family member dashboards
  - **Vet Visits tab**: chronological list of vet visit notes (date · reason · notes · vet name)
- Reminder system: browser notifications (with user permission) for upcoming vaccinations and medication refills
- Pet data excluded from all FHIR exports, ABDM sync, MHR API, and DES integration — GoEMR-only data

### 1.8 Permission Management — Full Control Panel

- Route: `/family/permissions`
- Two-axis permission matrix:
  - Rows: family members (with avatar + name)
  - Columns: record categories (Appointments · Lab Results · Medications · Clinical Notes · Imaging · Immunizations · Mental Health · Reproductive Health · Genetic Data · Billing)
  - Cell: dropdown selector — Full / Partial / None / Emergency; color-coded
- Bulk actions: "Grant Emergency Access to All" button for crisis situations
- Time-limited access: any cell can have an expiry date; expired permissions shown with red strikethrough
- Permission history: click any cell → drawer shows full audit log for that relationship+category pair
- Sensitivity lock: mental health, reproductive health, STI, genetic data show 🔒 icon; hovering shows "These categories can only be unlocked by the record owner"
- Export permissions report: download CSV of current permission matrix for compliance documentation

---

## Section 2 — Family Medical History & Genetic Inheritance

### 2.1 Family History Entry Interface

- Route: `/health/family-history`
- Split-pane layout: left pane shows interactive family tree (see Section 4); right pane shows entry/edit form for selected member
- Click any node in left pane → right pane loads that member's history form
- "Add Family Member (History Only)" button: adds a non-GoEMR family entry for genetic history purposes only
  - Required: relationship + sex assigned at birth
  - Optional: name/initials · birth year · death year · cause of death (SNOMED CT search)
  - Biological relationship toggle (determines inclusion in genetic risk calculations)
- Each entry creates a `FamilyMemberHistory` FHIR resource

### 2.2 Condition Entry — Web Form

- Within each family member's history form, "+ Add Condition" button opens an inline condition entry:
  - **Search field**: type-to-search across SNOMED CT coded condition list (minimum 2 characters triggers search; debounced 300ms)
  - **Quick-add chips**: pre-populated chips organized by disease category visible below search — click to add instantly:
    - Cardiac (Coronary artery disease · Heart attack · Cardiomyopathy · Arrhythmia · Congenital heart defect · Aortic aneurysm)
    - Cancer (Breast · Ovarian · Colorectal · Prostate · Melanoma · Lung · Stomach · Pancreatic · Uterine · Thyroid)
    - Metabolic (Type 2 Diabetes · Type 1 Diabetes · Obesity · High cholesterol)
    - Neurological (Alzheimer's · Parkinson's · Huntington's · Multiple sclerosis · Epilepsy)
    - Mental Health (Depression · Bipolar · Schizophrenia · Anxiety · Substance use · Suicide)
    - Blood Disorders (Thalassemia · Sickle cell · HbE disorder · Haemophilia · DVT)
    - Genetic Syndromes (Lynch syndrome · BRCA1/2 · FAP · Li-Fraumeni · PTEN · Marfan · Down syndrome)
    - Autoimmune (Rheumatoid arthritis · Lupus · Celiac · IBD · Type 1 Diabetes)
    - Kidney/Liver (PKD · CKD · Hemochromatosis · Alpha-1 antitrypsin deficiency)
  - **Status selector**: Affected · Carrier · Unaffected · Unknown (radio buttons)
  - **Age of onset**: number field (optional)
  - **Contributed to death**: Yes / No / Unknown (shown only if member is deceased)
  - **Notes**: free text (optional)
  - **Save** adds condition; it appears as a tag on the family member node in the left pane immediately (real-time update via WebSocket or optimistic UI)

### 2.3 Genetic Test Results Management

- Route: `/health/genetic-tests`
- Table view of all uploaded genetic test results (patient's own tests):
  - Columns: Gene · Variant · Classification · Test Date · Lab/Company · Source (self-reported / clinician-verified) · Actions
  - Classification badge colors: 🔴 Pathogenic · 🟠 Likely Pathogenic · 🟡 VUS · 🟢 Likely Benign · 🔵 Benign
  - "Self-reported" badge vs "✓ Clinician Verified" badge
- "+ Add Genetic Test Result" → slide-over panel:
  - Gene search: type-ahead from curated gene list (BRCA1, BRCA2, MLH1, MSH2, MSH6, PMS2, EPCAM, APC, MUTYH, TP53, PTEN, STK11, PALB2, ATM, CHEK2, CDH1, RET, MEN1, VHL, FH, HOXB13, HTT, CFTR, HBB, HBA1, HBA2, and more)
  - Variant field: HGVS notation (free text, optional)
  - Classification: 5-tier radio buttons with tooltips explaining each tier
  - Test date: date picker
  - Lab/company: free text
  - Report upload: drag-and-drop zone; accepts PDF; max 10MB; stored as `DocumentReference` FHIR resource
- GDPR consent gate (Romania / EU): before first submission, full-page overlay: "Genetic data is classified as Special Category data under GDPR Article 9. By proceeding, you explicitly consent to GoEMR storing your genetic information. You may withdraw this consent at any time." Two buttons: "I Consent — Proceed" / "Cancel". Consent logged as `Consent` FHIR resource.
- GINA notice (USA): persistent information callout on page: "Under GINA (Genetic Information Nondiscrimination Act), your health insurer and employer cannot use this genetic information against you."
- Filter/sort table: by gene name · classification · date · source
- Export: download table as CSV or PDF

### 2.4 Hereditary Risk Dashboard

- Route: `/health/genetic-risk`
- Dashboard layout: condition risk cards in a responsive grid (3 columns on desktop, 2 on tablet)
- Each card shows:
  - Condition name + category icon
  - Risk level: 🟢 Average · 🟡 Elevated · 🔴 High · ⬛ Insufficient Data
  - Summary sentence: "Based on 3 first-degree relatives with breast cancer and a BRCA1 pathogenic variant, your risk is classified as High."
  - "See Details" button → expands to show calculation inputs, model used, and country-specific screening recommendations
  - "Talk to Your Doctor" button → pre-fills a message to the care team about this specific risk
- Risk conditions tracked:
  - Breast/Ovarian Cancer (Tyrer-Cuzick model inputs)
  - Colorectal Cancer / Lynch Syndrome (Amsterdam II criteria)
  - Hereditary Cardiac Disease (premature CAD in first-degree relatives)
  - Type 2 Diabetes (first-degree relative affected)
  - Thalassemia Carrier Risk (India priority — Punnett square for couples where both are carriers)
  - Sickle Cell Disease Risk (India priority — same as above)
  - Huntington's Disease (autosomal dominant penetrance display)
  - BRCA1/2 Cancer Risk (penetrance percentages)
- Screening recommendation section per condition:
  - **India**: ICMR hemoglobinopathy carrier screening for partners; ICMR cancer screening intervals
  - **Romania**: EU SCREEN4CARE referral guidance; NHMRC-equivalent EU guidelines
  - **Australia**: Familial Cancer Centre referral link when Amsterdam II met; Medicare item numbers for funded genetic tests (73333, 73337, 73356)
  - **USA**: ACMG secondary findings genes list (SF v3.2 — 80 genes); NCCN guideline links; BRCA-positive → NCCN Cat 1 recommendation for risk-reducing surgery discussion
- Risk completeness panel on right: "Add more family history to improve your risk estimates" with specific prompts (e.g., "Add your mother's health history")
- Punnett square modal: triggered when both partners in GoEMR are carriers for the same autosomal recessive condition; shows 25% / 50% / 25% probability grid visually

### 2.5 Family History Completeness Tracker

- Progress widget on `/health/family-history` sidebar:
  - Progress bar: "Family history X% complete"
  - Checklist of expected relatives: Biological Mother · Biological Father · Maternal Grandmother · Maternal Grandfather · Paternal Grandmother · Paternal Grandfather · Siblings
  - Each item: ✓ complete / ○ partial / ✗ missing — click ✗ to jump to add form
- Shareable summary report:
  - "Generate Report" button → PDF download of family history in clinical pedigree format
  - Report uses initials only for non-GoEMR members (GDPR/privacy best practice)
  - Includes: pedigree diagram + condition table + risk summary
  - "Share with Doctor" button → sends secure link to care team valid 7 days

---

## Section 3 — Medicolegal Ruleset Engine (Web)

### 3.1 Country & Jurisdiction Settings

- Route: `/settings/jurisdiction`
- Primary country selector: India · Romania · Australia · USA (affects all ruleset behavior)
- Sub-jurisdiction selector:
  - USA: state dropdown (50 states + DC) — governs minor consent age, PDMP requirements, NP scope, and telehealth parity laws
  - Australia: state/territory dropdown (NSW · VIC · QLD · WA · SA · TAS · ACT · NT) — governs S8 permit requirements and Gillick competence statutory age
- Ruleset version display: "Currently applying GoEMR Ruleset v2.1 (India, last updated Feb 2026)" — reassures users rules are maintained
- Jurisdiction config stored in user profile; fetched via `/api/rulesets/{country}/{jurisdiction}` endpoint
- Admin panel (clinic admin only): ability to override default rules per clinic (e.g., a clinic that exclusively treats adults can set minorConsentAge override)

### 3.2 Medication Schedule Reference Panel

- Route: `/medications/schedule-reference`
- Searchable reference table of controlled substance schedules by country
- **India tab**:
  - Table: Drug Name · INN · Schedule (H / H1 / X / NDPS / OTC) · Refillable? · Telemedicine Permitted?
  - Schedule H1 list highlighted: fluoroquinolones, third-generation cephalosporins, anti-TB drugs, carbapenems
  - Schedule X list: ketamine, methylphenidate, amphetamine salts, etc.
  - Prohibited telemedicine list: NDPS drugs, most benzodiazepines, methylphenidate, strong opioids
- **Romania tab**:
  - Standard Rx vs Special Rx (benzodiazepines, zolpidem, buprenorphine requiring special secure forms)
  - Note: "Benzodiazepines and zolpidem require special secure prescription forms (Law 39/2005) — cannot be prescribed electronically under current SIPE system"
- **Australia tab**:
  - Table: Drug Name · Schedule (S4 / S4D / S8 / OTC) · PBS Authority Required? · S8 State Permit Required?
  - S4D highlights: benzodiazepines, gabapentinoids, non-alprazolam opioids — 6-month prescription validity
  - S8 highlights: oxycodone, morphine, fentanyl, alprazolam, medicinal cannabis — 6-month validity, state permit requirements listed by state
  - SafeScript note for VIC: "Victoria's SafeScript system requires a real-time check before every S8 prescription"
- **USA tab**:
  - Table: Drug Name · DEA Schedule (II / III / IV / V) · Refills Allowed · EPCS Required? · COVID Flexibility Status
  - Schedule II call-outs: no refills, written or EPCS required, 90-day supply via multiple prescriptions
  - COVID flexibility note: "Telemedicine prescribing of Schedules III–V controlled substances remains under extended flexibility through December 31, 2026 per DEA"
  - Ryan Haight Act notice: "Schedule II substances via telemedicine require at least one prior in-person evaluation"
- Each medication in the patient's active medication list shows its schedule badge when viewed in the Medications section

### 3.3 Telehealth Prescribing Rules Panel

- Pre-booking gate: before a telehealth appointment is confirmed, a prescribing intent step appears:
  - "What do you need from this appointment?" radio options:
    - General consultation / follow-up
    - Prescription renewal (known medication)
    - New prescription request
- If "Prescription renewal" or "New prescription" selected: inline drug search appears
- Drug entered → ruleset engine evaluates instantly and returns one of four outcomes displayed as a banner:

  **🔴 Hard Stop (cannot proceed via telehealth)**
  - India: "This medication is on the Prohibited Telemedicine List (India TPG 2020). An in-person appointment is required."
  - Romania: "Special prescription forms are required for this medication and cannot be issued electronically."
  - Australia: "Schedule 8 medications generally cannot be initiated via telehealth. Please see your GP in person."
  - USA: "DEA Schedule II substances require at least one prior in-person evaluation (Ryan Haight Act). Please book an in-person appointment."

  **🟡 Warning (can proceed with conditions)**
  - India List B: "This medication requires an established patient-doctor relationship. Available via video consultation only."
  - Australia S4D: "This medication has additional prescribing conditions. Available via telehealth only with established clinical relationship."
  - USA COVID flexibility: "Under current DEA telemedicine flexibility (extended through Dec 31, 2026), this may be prescribed via telehealth. Confirm with your doctor."

  **🟢 Permitted (proceed normally)**
  - India List A: "This medication can be prescribed via video consultation on a first visit. Proceed."
  - Australia S4: "Schedule 4 medications can be prescribed via telehealth. Proceed."
  - USA Schedules III–V (non-COVID): "This can be prescribed via telehealth under current regulations."

  **📋 Documentation Required**
  - India H1: "Your pharmacist must maintain a register for this medication. Inform your pharmacy when collecting."
  - Australia S8: "Your state may require a treatment permit. Your doctor will advise."
  - USA: "Your doctor will conduct a PDMP check before issuing this prescription."

### 3.4 Scope of Practice Guidance Panel

- Shown contextually when patient requests specialist booking or receives a referral
- **India panel** (no gatekeeper):
  - "In India, you can self-refer to any specialist. No GP referral required."
  - Specialist directory with direct booking available
  - Informational note: "While not required, a GP referral can help specialists understand your medical background."
- **Romania panel** (gatekeeper enforced):
  - Red information box: "CNAS insurance covers specialist visits only with a family doctor referral."
  - "Book Family Doctor Appointment" CTA button
  - Exception note: "Emergency situations do not require a referral."
- **Australia panel** (gatekeeper with Medicare impact):
  - Yellow information box: "Medicare rebates for specialist visits require a valid GP referral (12 months; 3 months for specialist-to-specialist)."
  - Two options shown: "Book GP for Referral" (Medicare-covered path) vs "Book Specialist Directly" (self-pay path, cost estimate displayed)
  - Referral status tracker: if a referral exists in GoEMR records, show: "✓ Valid referral from [GP name] — valid until [date]"
- **USA panel** (insurance-dependent):
  - Check insurance type from patient profile
  - HMO: "Your HMO plan requires a PCP referral. Contact your PCP to obtain one."
  - PPO/EPO: "Your plan allows direct specialist access. Book directly."
  - Uninsured: "No referral required. Specialist fees apply."
- NP/Allied Health scope note: shown when a nurse practitioner is the assigned provider:
  - Australia: "This provider is an endorsed Nurse Practitioner (NMBA). NPs can prescribe Schedule 4 and some Schedule 8 medications within their endorsed scope."
  - USA (full-scope states): "This provider has full independent prescribing authority in [state] including controlled substances."
  - USA (restricted states): "This provider requires a collaborative practice agreement with a supervising physician in [state] for controlled substance prescribing."
  - India: "Nurse practitioners do not have independent prescribing authority in India. A registered medical practitioner must authorize all prescriptions."
  - Romania: "Nurse practitioners do not have independent prescribing authority in Romania."

### 3.5 Consent Age Matrix — Web Admin View

- Route: `/admin/consent-rules` (clinic admin only)
- Full matrix table showing all configured rules:
  - Rows: record categories (Appointments · Labs · Medications · Mental Health · Reproductive Health · STI · Substance Use · Genetic Data · Imaging · Clinical Notes)
  - Columns: age ranges (0–11 · 12–13 · 14–15 · 16–17 · 18+)
  - Cells: Access Level per country/state ruleset (Green = full / Yellow = restricted / Red = blocked)
- State override panel (USA): table of all 50 states showing configured sensitive category age for each (editable by GoEMR platform team, not clinic admin)
- Audit log: every access blocked or granted by the consent rules engine is logged with: timestamp · patient age · record category · access level granted · rule version applied

### 3.6 Proxy Management — Web Admin Panel

- Route: `/admin/proxy-accounts`
- Table of all proxy relationships in the clinic:
  - Columns: Proxy Name · Acting For · Proxy Type · Status · Document Uploaded · Verified By · Verified Date · Expiry · Actions
  - Status badges: 🟡 Pending Upload · 🔵 Pending Verification · 🟢 Active · 🔴 Expired · ⬛ Revoked
- Document verification workflow:
  - Admin clicks "Review" → opens document side-by-side with proxy relationship details
  - Admin marks as "Verified" or "Rejected" with optional rejection reason
  - On verification: system activates proxy access + sends email to proxy holder: "Your proxy access for [patient name] is now active."
  - On rejection: email sent with reason + instructions to resubmit
- Proxy action audit trail: filterable table showing all actions taken by proxy actors
- Bulk export: download all proxy relationships as CSV for compliance audit

### 3.7 Cross-Border Telemedicine Checker

- Route: `/telehealth/jurisdiction-check`
- Interactive tool for both patients and admins:
  - Patient location selector: country + state/territory
  - Doctor location selector: country + state/territory (pre-filled if known)
  - "Check Compatibility" button → displays result:
    - **India–India**: "✓ Covered by India TPG 2020. Telemedicine is nationally regulated. No state-level barriers."
    - **Romania–EU**: "✓ Cross-border care within the EU is covered under Directive 2011/24/EU and the E-Commerce Directive country-of-origin principle."
    - **Romania–non-EU**: "⚠ Cross-border telemedicine outside the EU is not regulated under Romanian law. Proceed at own risk."
    - **Australia interstate**: "✓ AHPRA provides national registration — your doctor is licensed across all Australian states and territories."
    - **Australia–overseas**: "⚠ Medicare cannot be billed for consultations with patients outside Australia. This will be an out-of-pocket expense."
    - **USA–IMLC states**: load list of 41 IMLC member states; if both states in list: "✓ Both states participate in IMLC." If one is not: "⚠ [State] is not an IMLC member. Your doctor needs a separate [State] license."
    - **USA–overseas**: "⚠ Overseas consultations cannot be billed to Medicare/Medicaid."
- Doctor's license status widget (USA): enter doctor's NPI → display which states they hold active licenses (from NPI registry lookup)

---

## Section 4 — Family Chart & Tree Visualization (Web)

### 4.1 Chart Component

- Route: `/family/chart`
- Full-page SVG chart rendered via **pedigreejs** library (Cambridge BOADICEA group — clinical-grade pedigree, NSGC-standard symbols, D3.js-based SVG rendering)
- Fallback option: D3.js with `@solgenomics/d3-pedigree-tree` if pedigreejs integration proves complex
- Three-panel layout:
  - **Left toolbar** (60px wide): zoom controls · view mode toggles · add member button · search · legend toggle · export button
  - **Center canvas** (flex-fill): interactive SVG pedigree chart
  - **Right detail panel** (340px, collapsible): selected node details, conditions, access permissions

### 4.2 Node Design — NSGC 2022 Standard

- All symbols rendered as SVG elements following NSGC 2022 pedigree nomenclature:
  - **Male**: `<rect>` 40×40px, `border-radius: 0`, stroke `#374151`, stroke-width 1.5
  - **Female**: `<circle>` r=20px, stroke `#374151`, stroke-width 1.5
  - **Unknown / Non-binary**: `<polygon>` diamond shape (rotated square), same dimensions
  - **Deceased**: `<line>` diagonal slash from bottom-left to top-right of bounding box
  - **Proband**: `<polygon>` arrowhead pointing to node from lower-left
  - **Carrier**: center `<circle>` r=4px filled solid `#374151` inside the symbol
  - **Affected**: full symbol fill using condition color (from color scale)
  - **Multiple conditions**: SVG `<clipPath>` quadrant fills — each quadrant a distinct hue + crosshatch pattern overlay for colorblind users (4 max per node)
  - **Adopted**: `<rect>` bracket lines added left and right of the symbol
  - **Consanguinity**: double horizontal line between partners
  - **Twins (monozygotic)**: inverted V with horizontal bar; dizygotic: inverted V without bar
- All SVG elements include ARIA attributes: `role="img"`, `aria-label="[name], [relationship], [age], [condition summary], [access level]"`
- WCAG 2.1 AA compliant: all condition colors meet 4.5:1 contrast ratio on white; pattern fills available as color-blind alternative

### 4.3 Node Design — Pet Members

- Pet node: `<rect>` rounded-rectangle (40×28px, `rx=8`), teal stroke (`#0D9488`), white fill
- Species icon: inline SVG silhouette centered in the rectangle (dog / cat / bird / paw print for other)
- Connection to family: **dashed SVG line** `stroke-dasharray="5,3"`, color `#0D9488`
- Label below: pet name (bold) · species (regular)
- Positioned in the household block, separate from genetic lineage rows
- Hover: tooltip showing vaccination status (✓ current / ⚠ due / 🔴 overdue) and any active zoonotic flags

### 4.4 Relationship Lines

- All lines: SVG `<path>` elements, stroke `#374151`, stroke-width 1.5
- Horizontal couple line: single = relationship; double = consanguineous
- Single slash: separated; double slash: divorced (SVG `<line>` segments overlaid)
- Vertical descent lines to offspring
- Sibship line: horizontal line with vertical drops
- Generation rows: horizontal guide lines in light gray `#E5E7EB` (optional, toggled by user preference)

### 4.5 Three View Mode Toggles

Accessible from left toolbar as segmented button control:

**Mode 1: 🧬 Genetics View (default)**
- Standard NSGC pedigree display
- Condition fills visible using color legend
- Generation labels (Roman numerals) on left margin
- Hover any node → tooltip: name · age · conditions list

**Mode 2: 🔐 Permissions View**
- Each node gains an outer ring indicating the logged-in user's access to that member:
  - 🟢 Full Access: solid green ring 4px, `#22C55E` + open padlock SVG icon in corner
  - 🟡 Partial Access: solid amber ring 4px, `#F59E0B` + half-open padlock icon
  - 🔴 Emergency Only: solid red ring 4px, `#EF4444` + red cross icon
  - ⬛ No Access: solid gray ring 4px, `#6B7280` + closed padlock icon
  - 🔵 Pending: dashed blue ring `stroke-dasharray="3,2"`, `#3B82F6` + hourglass icon
- Directional arrows on relationship lines: ↔ / → / ← indicating data sharing direction
- Hover any ring → tooltip: "Full access · Expires: never" or "Partial access · Mental health blocked · Expires: 15 Mar 2026"
- Click any ring → right detail panel switches to Access tab for that relationship
- Legend panel (bottom-left): ring color + icon key

**Mode 3: 🔬 Risk View**
- Condition selector dropdown above chart: Breast Cancer · Colorectal Cancer / Lynch · Cardiac Disease · Type 2 Diabetes · Thalassemia · Sickle Cell · Huntington's · BRCA1/2 (custom)
- Node fill changes to risk level for selected condition:
  - 🟢 Average risk: light green fill `#D1FAE5`
  - 🟡 Elevated risk: amber fill `#FEF3C7`
  - 🔴 High risk: red fill `#FEE2E2`
  - ⬛ Unknown/insufficient data: gray fill `#F3F4F6`
- Inheritance pattern annotation: banner shows "Autosomal Dominant" / "Autosomal Recessive" / "X-linked" / "Multifactorial" for selected condition
- Hover node → tooltip: "[Name]'s contribution to your risk: [condition] · Affected · Onset age 48"
- Risk gradient visible across generations, making inheritance patterns visually apparent

### 4.6 Chart Interaction — Desktop

- **Hover**: tooltip with name, age, conditions summary, access level
- **Click**: selects node; right panel loads full detail
- **Right-click**: context menu:
  - Add partner to [name]
  - Add child of [name]
  - Add parent of [name]
  - Edit [name]'s details
  - Edit access permissions for [name]
  - Remove [name] from chart
- **Ctrl+click**: multi-select (up to 5 nodes) → "Bulk Edit Permissions" appears in toolbar
- **Scroll wheel**: zoom in/out centered on cursor position
- **Click + drag on canvas**: pan
- **Double-click on node**: zoom to that subtree (show node + immediate relatives, rest fades to 20% opacity)
- **Escape**: deselect / return to full chart view

### 4.7 Zoom, Pan, and Minimap

- D3 zoom behavior with `scaleExtent([0.2, 4])`
- Zoom buttons: `+` / `-` / `Fit All` in left toolbar
- "Center on Me" button: animated pan+zoom to proband node
- **Minimap**: fixed 200×130px panel in bottom-right corner:
  - Shows complete chart at miniature scale
  - Semi-transparent blue rectangle shows current viewport
  - Click or drag rectangle in minimap to pan the main view
  - Toggle minimap visibility with button
- Generation label column: Roman numeral labels (I, II, III...) in left margin, sticky as user pans horizontally
- Semantic zoom levels:
  - Scale < 0.5: show symbol shapes only, no labels
  - Scale 0.5–1.0: show symbols + names
  - Scale > 1.0: show symbols + names + condition tags as chips
  - Scale > 2.0: show full inline detail (age, conditions, access level text)

### 4.8 Right Detail Panel

Content when a node is selected:

**Header section**: NSGC symbol large (60×60px) + name (h2) + relationship tag + age/years

**Tabs: Health · Access · History · Edit**

**Health tab**:
- Conditions list: each as a badge chip — condition name · status (Affected/Carrier/Unaffected) · onset age
- Genetic test results: gene · variant · classification badge (color-coded)
- If deceased: death year + cause of death
- Risk contribution: "Contributes to your [condition] risk calculation" with risk impact indicator (↑ raises / — neutral)
- For pets: vaccination status table + medication list + zoonotic flags

**Access tab** (for GoEMR-linked members):
- Current access level with colored badge
- Access direction
- Expiry date if set
- Per-category access grid: small table showing each record category and its access level for this relationship
- "Edit Permissions" button → opens permission management slide-over
- Access history: last 5 permission change events with timestamp

**History tab**:
- Timeline of all entries in this member's `FamilyMemberHistory` record
- Condition changes, genetic test additions, notes edits — with date and acting user

**Edit tab** (own node or proxy-managed):
- Inline form to edit conditions, genetic tests, relationship type, biological status
- "Remove from Chart" button (red, with confirmation dialog)
- "Move to History Only" button (converts GoEMR-linked member to history-only entry if they leave the platform)

### 4.9 Add Member from Chart

- "+" FAB in left toolbar → "Add Family Member" opens slide-over panel
- Alternatively: right-click a node → "Add partner/child/parent"
- Slide-over panel follows same 4-step flow as Section 1.2
- After member is added, chart re-renders with animation (new node fades in + connecting lines draw progressively)

### 4.10 Genetic Risk Visualization on Chart

- In Risk View, risk overlay is computed client-side from loaded `FamilyMemberHistory` data
- Risk calculation runs in a Web Worker to keep UI thread responsive
- Progress indicator: "Calculating family risk..." spinner shown during computation (typically < 500ms)
- If data is insufficient for calculation: node shows ⬛ + tooltip "Add more family history to calculate risk for this member"
- Punnett Square modal: triggered when both partners are carriers for same autosomal recessive condition
  - Modal shows: 2×2 Punnett square SVG diagram + probability labels (25% affected / 50% carrier / 25% unaffected)
  - "Learn more" link to condition-specific information
  - "Discuss with your doctor" button

### 4.11 Legend Panel

- Collapsible panel in bottom-left of chart canvas (always accessible)
- Genetics View legend:
  - Symbol shapes: square (male) · circle (female) · diamond (unknown) · filled (affected) · dot in center (carrier) · slash (deceased) · arrow (proband)
  - Condition color swatches with labels (cancer / cardiac / metabolic / neurological / etc.)
  - Relationship lines: single (couple) · double (consanguineous) · slash variants (separated/divorced) · dashed (pet)
- Permissions View legend:
  - Ring colors + icons: full (green lock) · partial (amber lock) · emergency (red cross) · none (gray lock) · pending (blue hourglass)
  - Arrow directions: ↔ bidirectional · → outbound · ← inbound
- Risk View legend:
  - Color fills: average (light green) · elevated (amber) · high (red) · unknown (gray)
  - Inheritance pattern icons

### 4.12 Export and Share

- "Export" button in left toolbar → dropdown menu:
  - **Export SVG**: full chart as scalable SVG file (pedigreejs native export)
  - **Export PNG**: rasterized chart at 2x resolution
  - **Export PDF**: chart + condition table + risk summary in clinical report format
  - **Export CanRisk format**: pedigree data as `.canrisk` file for BOADICEA/Tyrer-Cuzick risk tools
  - **Export PED file**: PLINK PED format for genomics analysis (advanced)
  - **Share with Doctor**: generate time-limited read-only link (configurable: 24h / 48h / 7 days) — doctor opens in browser with no login required; watermarked "Shared for clinical review only"
  - **Print**: browser print dialog with chart formatted for A4/Letter
- Export options: include/exclude deceased member names (default: initials only for GDPR compliance)
- Watermark on all exports: "GoEMR Family Health Chart — For personal and clinical reference only"

### 4.13 Chart Accessibility (Web)

- Full keyboard navigation: Tab to cycle through nodes; Enter to select; arrow keys to navigate to related nodes (parent/child/partner)
- Screen reader: ARIA live region announces node changes; each node reads: "[Name], [relationship] of [proband name], age [X], conditions: [list], access level: [level]"
- High-contrast mode toggle in toolbar: switches all fills to WCAG AAA compliant patterns (crosshatch, dots, stripes) without relying on color alone
- Focus visible: clear focus ring on all interactive elements (3px `#3B82F6` outline)
- Zoom keyboard shortcuts: `+` / `-` / `0` (reset zoom) / `F` (fit all)
- Tab order follows generational hierarchy: Generation I left-to-right, then Generation II, etc.
- Export includes alt-text description of pedigree structure for accessibility compliance

---

## Section 5 — Integration Points and API Architecture

### 5.1 FHIR Resources Used

| Feature | FHIR Resource | Key Fields |
|---------|--------------|-----------|
| Family member (GoEMR user) | `Patient` | `identifier`, `name`, `birthDate`, `link` |
| Family member (non-user) | `RelatedPerson` | `patient`, `relationship` (v3-RoleCode), `period` |
| Family group | `Group` | `member.entity`, `member.period` |
| Access permission | `Consent` | `scope`, `provision.actor`, `provision.period`, `category` |
| Family history entry | `FamilyMemberHistory` | `relationship`, `condition.code`, `condition.onsetAge`, `condition.outcome` |
| Genetic test result | `Observation` | `code` (LOINC), `component.code` (gene), `component.valueCodeableConcept` (classification) |
| Proxy document | `DocumentReference` | `subject`, `category`, `content.attachment` |
| Genetic consent (GDPR) | `Consent` | `category = GDPR-Art9`, `provision.type`, `dateTime` |

### 5.2 Backend Ruleset API

- `GET /api/rulesets/{country}` — returns country ruleset JSON
- `GET /api/rulesets/{country}/{state}` — returns state override ruleset
- `POST /api/rulesets/check-prescribing` — body: `{drug, country, state, channel, prescriberType, priorVisit: boolean}` → returns `{permitted, level, message, hardStop: boolean}`
- `POST /api/rulesets/check-consent` — body: `{patientAge, country, state, recordCategory}` → returns `{accessGranted, accessLevel, reason}`
- `GET /api/rulesets/telehealth-check?patientCountry=&patientState=&doctorCountry=&doctorState=` → returns `{compatible, notes, restrictions[]}`

### 5.3 Real-Time Age-Gate Enforcement

- Server-side middleware intercepts all FHIR data requests for patients under 25
- For each request: `CHECK age + country + recordCategory → apply ruleset → filter or serve data`
- Age is always calculated from `Patient.birthDate` at request time (not cached)
- Sensitive category filter runs server-side: records tagged with sensitive SNOMED codes never reach the browser if access is blocked
- Age-gate events are written to an immutable audit log: `{timestamp, requestorId, patientId, patientAge, recordCategory, decision, ruleVersion}`

---

## Technology Stack Notes for Claude Code

### Web App

- **Framework**: React 18 + TypeScript
- **Chart library**: pedigreejs (D3.js-based SVG) — import via npm or CDN
- **State management**: Zustand or React Context for family tree state
- **FHIR client**: `fhirclient` npm package for SMART on FHIR authorization and resource CRUD
- **PDF generation**: `react-pdf` or `jsPDF` for chart and report exports
- **Drag-and-drop**: `react-dropzone` for document uploads
- **Styling**: Tailwind CSS
- **Risk calculations**: Web Worker (`worker.js`) for Tyrer-Cuzick and Amsterdam II calculations to keep UI thread unblocked
- **Accessibility**: `@radix-ui/react` primitives for accessible dropdown menus, dialogs, and tooltips
- **Country ruleset**: JSON config files per country loaded dynamically; cached in memory; refreshed on user session start
- **Date library**: `date-fns` for age calculation and transition date countdown

### Folder Structure Suggestion

```
src/
  components/
    family/
      FamilyChart.tsx           # pedigreejs wrapper
      FamilyChart.css
      FamilyNode.tsx            # node detail logic
      PetNode.tsx
      FamilyMemberList.tsx      # sidebar list
      AddMemberPanel.tsx        # slide-over panel
      PermissionMatrix.tsx      # 2-axis permission grid
      PermissionRing.tsx        # SVG ring overlay component
    genetic/
      FamilyHistoryForm.tsx
      ConditionSearch.tsx
      GeneticTestTable.tsx
      RiskDashboard.tsx
      PunnettSquare.tsx
      RiskCard.tsx
    medicolegal/
      PrescribingGate.tsx
      ScheduleBadge.tsx
      ScopeOfPracticePanel.tsx
      ConsentAgeMatrix.tsx
      CrossBorderChecker.tsx
  workers/
    riskCalculation.worker.ts   # Web Worker for risk models
  services/
    fhirService.ts              # FHIR REST calls
    rulesetService.ts           # Medicolegal ruleset API
    familyService.ts            # Family relationship CRUD
  config/
    rulesets/
      india.json
      romania.json
      australia.json
      usa_base.json
      usa_states/
        california.json
        texas.json
        # ... all 50 states
  types/
    family.types.ts
    genetic.types.ts
    ruleset.types.ts
```
