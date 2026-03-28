# Patient Portal ↔ EMR Frontend — Sync Gap Analysis

> Comparing features in `go-emr-patient-portal` vs `go-emr-fe` (EMR staff frontend)
> Generated: 2026-02-25

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Both portal and EMR have equivalent implementation |
| ⚠️ | EMR has partial/basic version — needs enhancement to match portal |
| ❌ | Portal has it, EMR is missing — needs to be built |

---

## 1. Family Management

**Portal:** Full implementation — 25+ files, 792KB, 11 components, genetic testing, pedigree chart, pet profiles, permission matrix, proxy management, jurisdiction settings, consent-age matrix, completeness tracker, risk calculation web worker.

**EMR:** Basic `FamilyRelation` interface (spouse/parent/child/sibling/guardian) + simple family relations UI in patient detail.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Basic family member list | ✅ `family-dashboard.component.ts` | ✅ `patients/ui/family-relations/` | — |
| Biological relation types (adopted/step/half/foster) | ✅ `family.models.ts` | ❌ Only: spouse/parent/child/sibling/guardian/other | **Build** |
| `FamilyGroup` model (group container, primary member) | ✅ `family.models.ts` | ❌ No group concept | **Build** |
| Pedigree/family tree chart | ✅ `family-chart.component.ts` + `chart-nodes.util.ts` | ❌ Missing | **Build** |
| Family conditions with SNOMED codes | ✅ `FamilyCondition` model | ❌ Missing | **Build** |
| Genetic test results (BRCA2, ACMG classification) | ✅ `genetic-tests.component.ts` | ❌ Missing | **Build** |
| Hereditary risk cards | ✅ `genetic-risk.component.ts` | ❌ Missing | **Build** |
| Permission matrix (10 categories × access levels) | ✅ `permission-management.component.ts` | ❌ Missing | **Build** |
| Pet profiles (zoonotic flags) | ✅ `pet-profile.component.ts` | ❌ Missing | **Build** (low priority) |
| Proxy account management | ✅ `proxy-management.component.ts` | ❌ Missing | **Build** |
| Member-by-generation grouping | ✅ `membersByGeneration` computed | ❌ Missing | **Build** |
| Data completeness tracker | ✅ `completeness.util.ts` | ❌ Missing | Optional |
| Consent-age matrix | ✅ `consent-age-matrix.component.ts` | ❌ Missing | Optional |
| Jurisdiction settings | ✅ `jurisdiction-settings.component.ts` | ❌ Missing | Optional |

**Priority tasks for EMR:**
1. ❌ Extend `FamilyRelation` model with biological relation, genetic data, conditions, linked patient IDs
2. ❌ Add `FamilyGroup` model with permission matrix
3. ❌ Build pedigree chart component (reference portal's `chart-nodes.util.ts`)
4. ❌ Build family conditions & genetic testing panels
5. ❌ Build permission management view (clinician-side override of portal permissions)
6. ❌ Add family member quick-add with patient search linking

---

## 2. Prescription Refills & Medication Management

**Portal:** Full refill wizard (medication select → pharmacy → confirm → track), 7 medications + 1 controlled substance, adherence calendar, drug interactions, PBS script support.

**EMR:** `RefillRequest` model exists in `portal-sync.service.ts` with approve/deny workflow. No dedicated refill queue UI component.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Refill request model | ✅ `RefillRequest` in prescriptions service | ✅ `RefillRequest` in `portal-sync.models.ts` | — |
| Refill request queue (clinician view) | — | ⚠️ Model exists, no dedicated UI component | **Build UI** |
| Drug interaction model & display | ✅ `DrugInteraction` (HIGH/MODERATE/LOW) | ❌ No `DrugInteraction` model on EMR side | **Build** |
| Medication adherence calendar/heatmap | ✅ 28-day adherence log, 87% tracking | ❌ Missing | **Build** |
| Controlled substance workflow | ✅ Warning dialog + verification | ❌ Missing | **Build** |
| Pharmacy selection/comparison | ✅ 3 pharmacies with distance/hours | ❌ Missing | Optional |
| PBS Active Script List (Australia) | ✅ `PBSScript` model | ❌ Missing | Country-specific |

**Priority tasks for EMR:**
1. ❌ Build refill request queue component (approve/deny/modify, notes)
2. ❌ Add `DrugInteraction` model + interaction alert display during refill processing
3. ❌ Build adherence view (calendar/heatmap) in patient medication tab
4. ❌ Add controlled substance flag handling

---

## 3. Insurance & Benefits Display

**Portal:** 3 insurance cards (medical/dental/vision) with flip animation, copay breakdown (4 tiers), deductible tracking, out-of-pocket max, RX BIN/PCN/Group, 5-category benefit usage.

**EMR:** Basic `Insurance` interface in patient model (payerId, planName, memberId, copay, deductible, coinsurance). No visual card display.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Insurance model (basic) | ✅ `InsuranceCard` | ✅ `Insurance` in patient model | — |
| Copay breakdown (primaryCare/specialist/urgent/emergency) | ✅ 4-tier copay object | ❌ Single `copay` number | **Extend model** |
| Insurance card flipcard UI | ✅ Card flip visualization | ❌ Missing | **Build** |
| Deductible progress tracking | ✅ Individual + family deductible, met amounts | ❌ Missing | **Build** |
| Out-of-pocket max tracking | ✅ `outOfPocketMax` with progress | ❌ Missing | **Build** |
| Benefit usage by category | ✅ 5 categories (visits, lab, Rx, PT, mental health) | ❌ Missing | **Build** |
| RX BIN/PCN/Group | ✅ Pharmacy benefit details | ❌ Missing | **Extend model** |
| Medical/Dental/Vision tabs | ✅ 3 card types | ❌ Single insurance type | **Extend model** |
| Dependent listing | ✅ Dependents on plan | ❌ Missing | Optional |

**Priority tasks for EMR:**
1. ❌ Extend `Insurance` model with copay tiers, deductible tracking, benefit usage, RX info, card type
2. ❌ Build insurance card display component (flipcard with front/back)
3. ❌ Build benefits & deductible progress tracker

---

## 4. Care Team & Messaging Integration

**Portal:** 6 care team members with online status, 3 message threads, threaded conversations with attachments, read receipts.

**EMR:** Portal messages component exists at `/portal/feature-messages/`. `PortalMessage` model with priority/category/assignment. Message viewing and response is functional.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Portal message inbox | ✅ Thread-based messaging | ✅ `portal-messages.component.ts` | — |
| Message thread viewer | ✅ Full thread with read receipts | ✅ Basic thread view | — |
| Provider online status | ✅ Real-time status (online/offline/busy) | ❌ No status indicator in message view | **Build** |
| Quick reply templates | ✅ N/A (patient side) | ❌ No canned responses for clinicians | **Build** |
| Message assignment to provider/dept | — | ⚠️ Model has `assignedTo`, no UI for reassignment | **Build UI** |
| Attachment support | ✅ Attachments in messages | ⚠️ Model supports, UI may be incomplete | Verify |

**Priority tasks for EMR:**
1. ❌ Add quick reply templates (appointment confirmation, lab explanation, refill status, etc.)
2. ❌ Add message assignment/routing UI (reassign to provider/department)
3. ❌ Show provider online status in message views

---

## 5. Patient Forms & Intake

**Portal:** Multi-section forms with progress tracking, field types (text, textarea, number, date, select, checkbox, radio, signature), completion workflow.

**EMR:** Portal forms component exists at `/portal/feature-forms/`. `FormSubmission` model in portal-sync with review status.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Form submission model | ✅ `PatientForm` with progress | ✅ `FormSubmission` in portal-sync models | — |
| Form review queue | — | ✅ `portal-forms.component.ts` | — |
| Consent management view | ✅ `ConsentItem` model | ⚠️ Model exists, display may be basic | Verify |
| Import form data into patient chart | — | ❌ No "import to chart" workflow | **Build** |
| Expired/missing consent alerts | ✅ Expiration tracking | ❌ No alert system for expired consents | **Build** |

**Priority tasks for EMR:**
1. ❌ Build "import to chart" workflow (map form fields → patient record)
2. ❌ Add expired/missing consent alert badges in patient detail

---

## 6. Connected Devices & Wearables

**Portal:** 4 connected devices (Apple Watch, Fitbit, Withings BP, Dexcom CGM), 7-day activity data (steps, HR, sleep, calories), 4 health goals with progress.

**EMR:** No wearable/health device integration. Device references are limited to telehealth session device info and admin device trust management.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Device data model (name, type, manufacturer, battery, sync) | ✅ `DeviceInfo` | ❌ Missing | **Build** |
| Activity data model (steps, HR, sleep, calories) | ✅ `ActivityData` with 7-day history | ❌ Missing | **Build** |
| Connected device panel in patient detail | ✅ `devices.component.ts` | ❌ Missing | **Build** |
| Activity trends (steps, HR, sleep charts) | ✅ Daily/weekly/monthly views | ❌ Missing | **Build** |
| Health goals display | ✅ 4 goals with progress bars | ❌ Missing | **Build** |
| Anomaly flagging (sudden HR changes, decreased activity) | ✅ Basic trending | ❌ Missing | **Build** |
| Device sync status | ✅ Connection toggle, battery, last sync | ❌ Missing | **Build** |

**Priority tasks for EMR:**
1. ❌ Create `DeviceInfo` and `ActivityData` models
2. ❌ Build device data panel in patient detail (connected devices list, sync status)
3. ❌ Build activity trend charts (steps, HR, sleep, calories)
4. ❌ Build health goals view with progress tracking

---

## 7. Health Timeline Sync

**Portal:** 20 historical events across 365 days, event types (appointment, lab, medication, immunization, vital, procedure), milestone markers.

**EMR:** Patient timeline exists at `/patients/feature-patient-timeline/` with domain types (encounter, lab, imaging, prescription, note, vital, procedure, referral, external). Timeline models in `timeline.model.ts`.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Timeline component | ✅ `health-timeline.component.ts` | ✅ `patient-timeline.component.ts` | — |
| Timeline event model | ✅ `HealthEvent` | ✅ `TimelineEvent` | — |
| Portal-originated events (form submissions, portal logins, refill requests) | ✅ Portal tracks these | ❌ No `source: 'portal'` flag on EMR timeline | **Extend** |
| Event type filtering | ✅ 6 types | ✅ Multiple domain filters | — |
| Milestone markers | ✅ Milestone flagging | ❌ No milestone concept in EMR timeline | Optional |

**Priority tasks for EMR:**
1. ❌ Add `source: 'emr' | 'portal'` field to `TimelineEvent` model
2. ❌ Merge portal events (form submissions, logins, messages, refill requests) into EMR timeline
3. ❌ Add portal event source filter in timeline view

---

## 8. Lab Trends & Visualizations

**Portal:** 9 test types with 2-year history, reference ranges, flagging, 6-8 data points per test, time range selector (6mo/1yr/2yr), statistics (latest, previous, change, min/max, average).

**EMR:** Lab result trending exists at `/labs/feature-result-trending/`. LIS models in `lis.model.ts`.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Lab trend charts | ✅ `lab-trends.component.ts` (9 tests) | ✅ `result-trending.component.ts` | — |
| Reference range bands | ✅ Visual reference ranges | ✅ In LIS model | — |
| Abnormal value markers | ✅ Flag system | ✅ In LIS model | — |
| Time range selector | ✅ 6mo/1yr/2yr | Verify if implemented | Verify |
| Multi-test comparison | ✅ Side-by-side test view | Verify if implemented | Verify |
| Statistical summary (min/max/avg/delta) | ✅ Full statistics | ❌ Likely missing | **Build** |

**Priority tasks for EMR:**
1. ⚠️ Verify existing trending component covers time range selection and stats
2. ❌ Add statistical summary (latest, previous, change, min, max, average) if missing

---

## 9. Symptom Checker Results

**Portal:** AI-powered symptom checker with conversational flow (body area → symptoms → severity → duration → triage), 4 severity levels, possible conditions, chatbot UI.

**EMR:** Chief complaint tracking in encounters and telehealth. No dedicated symptom assessment review from portal.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Symptom assessment model | ✅ `TriageResult` with conditions, urgency | ❌ No symptom assessment model | **Build** |
| Assessment review component (clinician view) | — | ❌ Missing | **Build** |
| Link assessment to encounter | — | ❌ Missing | **Build** |
| Override urgency level | — | ❌ Missing | **Build** |
| Symptom history per patient | ✅ `ChatBubble` conversation log | ❌ Missing | **Build** |

**Priority tasks for EMR:**
1. ❌ Create `SymptomAssessment` model (symptoms, AI triage result, urgency, recommended actions)
2. ❌ Build symptom assessment review component in patient detail
3. ❌ Allow clinicians to confirm/override urgency and link to encounters

---

## 10. Telehealth Session History

**Portal:** Full video call lifecycle (device-check → waiting-room → in-call → post-call), camera/mic toggle, screen sharing, in-call chat, dual timers.

**EMR:** `TelehealthSession` model exists with full lifecycle (scheduled → waiting_room → in_progress → completed). Session types (video/audio/chat/async), duration tracking, satisfaction rating.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Telehealth session model | ✅ `CallSession` | ✅ `TelehealthSession` | — |
| Session history list | ✅ In appointments | ✅ In telehealth domain | — |
| Session type tracking (video/chat) | ✅ Video + chat | ✅ video/audio/chat/async | — |
| Duration & timestamps | ✅ Call duration tracking | ✅ Duration tracking | — |
| Link to clinical notes | — | ⚠️ `encounterId` field exists, UI link may be missing | Verify |
| Session chat transcript | ✅ `ChatMessage` history | ⚠️ Chat interface exists, transcript storage unclear | Verify |

**Priority tasks for EMR:**
1. ⚠️ Verify encounter linking UI in telehealth session history
2. ⚠️ Verify chat transcript preservation and display

---

## 11. Notifications & Alerts Bridge

**Portal:** 6 notification types (lab_result, appointment, prescription, message), unread tracking, mark-as-read.

**EMR:** No dedicated portal notification trigger service found.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Notification model | ✅ `Notification` (4 types) | ❌ No `PortalNotification` trigger model | **Build** |
| Trigger notifications from EMR | — | ❌ Missing (lab ready, appointment reminder, Rx ready, message) | **Build** |
| Notification delivery tracking | ✅ Read/unread status | ❌ Missing | **Build** |

**Priority tasks for EMR:**
1. ❌ Create `PortalNotification` model (type, title, body, relatedId, deliveryStatus)
2. ❌ Build notification trigger service (push events to portal)
3. ❌ Add trigger points: lab result finalized → notify, appointment reminder → notify, Rx ready → notify

---

## 12. Patient-Reported Outcomes (PROs)

**Portal:** Health analytics dashboard with 6 category scores (cardiovascular 72, metabolic 68, nutrition 85, activity 82, preventive 90, mental health 75), 12-month longitudinal tracking (weight, BP, glucose, activity), PHQ-9 history (12→8→5), GAD-7 history (10→7→4).

**EMR:** No dedicated PRO models or dashboard. The scoring engine UI exists as a generic clinical scoring component but doesn't track patient-submitted PRO responses over time.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| PRO response model | ✅ PHQ-9 + GAD-7 with historical scores | ❌ Missing | **Build** |
| PRO score trending over time | ✅ 3+ measurements per instrument | ❌ Missing | **Build** |
| Health score categories | ✅ 6 categories with computed scores | ❌ Missing | **Build** |
| PRO dashboard in patient detail | ✅ `health-analytics.component.ts` | ❌ Missing | **Build** |
| Declining score alerts | ✅ Trend tracking (improving/declining) | ❌ Missing | **Build** |
| Weight/BP/glucose longitudinal tracking | ✅ 12-month history | ❌ Not in PRO context (vitals exist separately) | **Build** |

**Priority tasks for EMR:**
1. ❌ Create `PROResponse` model (questionnaire name, score, individual responses, timestamp, trend)
2. ❌ Build PRO dashboard showing scores over time (line charts with thresholds)
3. ❌ Highlight declining scores (PHQ-9 increasing, GAD-7 increasing)
4. ❌ Support common instruments (PHQ-9, GAD-7, integrate with existing scoring engine)

---

## 13. Portal Sync Infrastructure

**Portal:** Basic `EmrSyncService` with `pushChange()`, `requestRefill()`, `sendMessage()` — framework only, 30 lines.

**EMR:** Full `PortalSyncService` at `/core/services/portal-sync.service.ts` with signal-based state, mock data, and methods for `syncPatientData()`, `getPortalActivity()`, `pushToPortal()`, `getFormSubmissions()`, `getRefillRequests()`, `getPortalMessages()`, `getPortalStatus()`, `sendActivationInvite()`, etc.

| Feature | Portal | EMR | Gap |
|---------|--------|-----|-----|
| Sync service | ✅ `EmrSyncService` (basic) | ✅ `PortalSyncService` (full) | — |
| Portal activity feed | ✅ Events tracked | ✅ `getPortalActivity()` returns activity feed | — |
| Portal status indicator | ✅ Account status | ✅ `getPortalStatus()` with engagement level | — |
| Bidirectional sync for family data | ✅ Family models rich | ❌ No family sync methods | **Extend** |
| Bidirectional sync for device data | ✅ Device data available | ❌ No device sync methods | **Extend** |
| Bidirectional sync for PRO data | ✅ PRO scores available | ❌ No PRO sync methods | **Extend** |
| Conflict resolution | ❌ Missing | ❌ Missing | **Build (both sides)** |
| Real-time event streaming (WebSocket) | ❌ Not implemented | ❌ Not implemented | Future |

**Priority tasks:**
1. ❌ Add `syncFamilyData()`, `syncDeviceData()`, `syncPROData()` to EMR PortalSyncService
2. ❌ Add `getSymptomAssessments()` to EMR PortalSyncService
3. ❌ Add `triggerNotification()` to EMR PortalSyncService

---

## Summary: What Needs to Be Built on EMR Side

### High Priority (core clinical value)

| # | Task | Effort | Source |
|---|------|--------|--------|
| 1 | **Family model extension** — biological relations, genetic data, conditions, FamilyGroup, permissions | Medium | §1 |
| 2 | **Pedigree chart component** — interactive family tree in patient detail | High | §1 |
| 3 | **Family conditions & genetic testing panels** | Medium | §1 |
| 4 | **Refill request queue UI** — approve/deny/modify with notes | Medium | §2 |
| 5 | **Drug interaction model & alerts** | Medium | §2 |
| 6 | **Medication adherence view** (calendar/heatmap) | Medium | §2 |
| 7 | **PRO response model + dashboard** — PHQ-9/GAD-7 trending, declining score alerts | High | §12 |
| 8 | **Symptom assessment review** — view portal AI triage, override urgency | Medium | §9 |
| 9 | **Connected device models + panel** — wearable data, activity trends, health goals | High | §6 |
| 10 | **Portal notification trigger service** | Medium | §11 |

### Medium Priority (operational value)

| # | Task | Effort | Source |
|---|------|--------|--------|
| 11 | **Insurance model extension** — copay tiers, deductible tracking, benefit usage | Medium | §3 |
| 12 | **Insurance card display** — flipcard UI with front/back | Low | §3 |
| 13 | **Benefits & deductible progress tracker** | Low | §3 |
| 14 | **Quick reply templates** for portal messages | Low | §4 |
| 15 | **Message assignment/routing UI** | Low | §4 |
| 16 | **Import form data to chart** workflow | Medium | §5 |
| 17 | **Expired consent alerts** | Low | §5 |
| 18 | **Timeline portal event merge** — add `source` field, portal events | Low | §7 |
| 19 | **Lab trend statistics** — verify and add min/max/avg/delta if missing | Low | §8 |

### Low Priority (nice-to-have)

| # | Task | Effort | Source |
|---|------|--------|--------|
| 20 | **Permission management view** (clinician-side of portal permissions) | Medium | §1 |
| 21 | **Pet profiles** (zoonotic risk only) | Low | §1 |
| 22 | **Pharmacy comparison** in refill workflow | Low | §2 |
| 23 | **Provider online status** in message view | Low | §4 |
| 24 | **Data completeness tracker** for family | Low | §1 |
| 25 | **Conflict resolution** for bidirectional sync | High | §13 |
| 26 | **PortalSyncService extensions** (family, devices, PROs, symptoms) | Medium | §13 |

---

## Estimated Scope

| Priority | Tasks | Estimated Components | New Lines |
|----------|-------|---------------------|-----------|
| High | 10 tasks | ~12-15 components | ~8,000-12,000 |
| Medium | 9 tasks | ~8-10 components | ~4,000-6,000 |
| Low | 7 tasks | ~5-7 components | ~2,000-4,000 |
| **Total** | **26 tasks** | **~25-32 components** | **~14,000-22,000 lines** |

> Note: The portal project (`go-emr-patient-portal`) is fully implemented with rich features across all 13 areas. The main work is on the EMR staff frontend (`go-emr-fe`) to receive, display, and act on portal data from the clinician's perspective.
