import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

interface ClinicalNote {
  id: string;
  date: string;
  provider: string;
  specialty: string;
  type: 'visit' | 'procedure' | 'consultation' | 'discharge';
  typeLabel: string;
  preview: string;
  fullText: string;
  isExpanded: boolean;
}

@Component({
  selector: 'app-open-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, DividerModule, SelectButtonModule, AnimateOnScrollModule],
  template: `
    <div class="open-notes-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <div>
            <h1>Clinical Notes (OpenNotes)</h1>
            <p>Your right to access clinical notes under the 21st Century Cures Act</p>
          </div>
        </div>
      </header>

      <!-- Patient Rights Banner -->
      <div class="rights-banner">
        <i class="pi pi-shield"></i>
        <div>
          <strong>Your Right to Access Your Clinical Notes</strong>
          <p>
            Under the 21st Century Cures Act (2021) and the ONC Information Blocking Rule, you have
            a federal right to access your clinical notes, including visit notes, procedure notes,
            consultation notes, and discharge summaries — at no cost and without delay. This supports
            better patient engagement and care transparency.
          </p>
        </div>
      </div>

      <!-- Filter Bar -->
      <p-card styleClass="filter-card">
        <div class="filter-row">
          <span class="filter-label">Filter by type:</span>
          <p-selectButton
            [options]="filterOptions"
            [(ngModel)]="selectedFilter"
            optionLabel="label"
            optionValue="value"
          ></p-selectButton>
          <div class="filter-actions">
            <button
              pButton
              label="Download All Notes"
              icon="pi pi-download"
              class="p-button-outlined"
              (click)="downloadAllNotes()"
            ></button>
          </div>
        </div>
        <div class="notes-meta">
          Showing <strong>{{ filteredNotes().length }}</strong> note(s)
          @if (selectedFilter !== 'all') {
            <span> — <a (click)="selectedFilter = 'all'" class="clear-filter">Show all</a></span>
          }
        </div>
      </p-card>

      <!-- Notes List -->
      <div class="notes-list">
        @for (note of filteredNotes(); track note.id) {
          <p-card styleClass="note-card">
            <div class="note-header" (click)="toggleNote(note)">
              <div class="note-meta">
                <div class="note-type-icon">
                  <i [class]="'pi ' + getNoteIcon(note.type)"></i>
                </div>
                <div class="note-info">
                  <div class="note-title-row">
                    <span class="note-date">{{ note.date }}</span>
                    <p-tag [value]="note.typeLabel" [severity]="getNoteTagSeverity(note.type)"></p-tag>
                  </div>
                  <span class="note-provider">{{ note.provider }}</span>
                  <span class="note-specialty">{{ note.specialty }}</span>
                  @if (!note.isExpanded) {
                    <p class="note-preview">{{ note.preview }}</p>
                  }
                </div>
              </div>
              <button
                pButton
                [icon]="note.isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                class="p-button-text p-button-rounded p-button-sm expand-btn"
              ></button>
            </div>

            @if (note.isExpanded) {
              <div class="note-full-content">
                <p-divider></p-divider>
                <div class="note-body">
                  <pre class="note-text">{{ note.fullText }}</pre>
                </div>
                <div class="note-actions">
                  <button pButton label="Print Note" icon="pi pi-print" class="p-button-outlined p-button-sm"></button>
                  <button pButton label="Download PDF" icon="pi pi-download" class="p-button-outlined p-button-sm"></button>
                </div>
              </div>
            }
          </p-card>
        }
      </div>

      @if (filteredNotes().length === 0) {
        <div class="empty-state">
          <i class="pi pi-file-edit"></i>
          <h3>No {{ selectedFilter === 'all' ? '' : selectedFilter }} notes found</h3>
          <p>No clinical notes of this type are currently available in your record.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .open-notes-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--purple-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--purple-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .rights-banner { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.25rem; background: var(--purple-50); border: 1px solid var(--purple-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--purple-900); }
    .rights-banner i { font-size: 1.25rem; color: var(--purple-500); flex-shrink: 0; margin-top: 0.1rem; }
    .rights-banner strong { display: block; margin-bottom: 0.3rem; }
    .rights-banner p { margin: 0; line-height: 1.6; }
    .filter-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .filter-label { font-size: 0.875rem; font-weight: 500; white-space: nowrap; }
    .filter-actions { margin-left: auto; }
    .notes-meta { margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .clear-filter { color: var(--primary-500); cursor: pointer; text-decoration: underline; }
    .notes-list { display: flex; flex-direction: column; gap: 0.875rem; margin-top: 1rem; }
    .note-header { display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; gap: 1rem; }
    .note-meta { display: flex; gap: 0.875rem; flex: 1; }
    .note-type-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--purple-50); }
    .note-type-icon i { font-size: 1.1rem; color: var(--purple-600); }
    .note-info { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; }
    .note-title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .note-date { font-weight: 600; font-size: 0.95rem; }
    .note-provider { font-size: 0.875rem; color: var(--text-color); }
    .note-specialty { font-size: 0.8rem; color: var(--text-color-secondary); }
    .note-preview { margin: 0.3rem 0 0; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.55; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .expand-btn { flex-shrink: 0; }
    .note-full-content { padding-top: 0.5rem; }
    .note-body { background: var(--surface-ground); border-radius: var(--border-radius); padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .note-text { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.82rem; line-height: 1.7; color: var(--text-color); margin: 0; }
    .note-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem 1rem; text-align: center; gap: 0.75rem; color: var(--text-color-secondary); }
    .empty-state i { font-size: 3rem; color: var(--surface-400); }
    .empty-state h3 { margin: 0; color: var(--text-color); }
    .empty-state p { margin: 0; font-size: 0.875rem; }
    @media (max-width: 640px) {
      .filter-row { flex-direction: column; align-items: flex-start; }
      .filter-actions { margin-left: 0; }
    }
  `]
})
export class OpenNotesComponent {
  selectedFilter = 'all';

  readonly filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Visit Notes', value: 'visit' },
    { label: 'Procedure Notes', value: 'procedure' },
    { label: 'Consultation Notes', value: 'consultation' },
    { label: 'Discharge Notes', value: 'discharge' }
  ];

  readonly notes = signal<ClinicalNote[]>([
    {
      id: '1',
      date: '18 Feb 2026',
      provider: 'Dr. Emily Chen, MD',
      specialty: 'Internal Medicine',
      type: 'visit',
      typeLabel: 'Visit Note',
      preview: 'Patient presents for annual wellness exam. Blood pressure 122/78, heart rate 68 bpm. Reports occasional fatigue over the past month...',
      fullText: `VISIT NOTE - Annual Wellness Examination
Date: February 18, 2026
Provider: Dr. Emily Chen, MD - Internal Medicine
Patient: Demo Patient | DOB: 01/15/1980 | MRN: 00123456

CHIEF COMPLAINT:
Annual wellness exam. Patient reports occasional fatigue over the past month.

HISTORY OF PRESENT ILLNESS:
Patient is a 46-year-old male presenting for annual physical. Fatigue is mild, worse in afternoons,
no associated symptoms of dyspnea, chest pain, or syncope. Sleep 7 hours per night.
Diet: balanced with occasional fast food. Exercise: 3x/week moderate intensity.

PHYSICAL EXAMINATION:
Vitals: BP 122/78 mmHg | HR 68 bpm | Temp 98.4°F | SpO2 99% | Weight 178 lbs | BMI 24.3
General: Alert and oriented, no acute distress
HEENT: Normocephalic, atraumatic. PERRL. TMs intact bilaterally.
Cardiovascular: RRR, no murmurs, rubs, or gallops. No JVD.
Respiratory: CTAB, no wheezes or crackles.
Abdomen: Soft, non-tender, non-distended. No organomegaly.
Extremities: No edema. Peripheral pulses 2+ bilaterally.
Neurological: CN II-XII intact. DTRs 2+ symmetric.

ASSESSMENT & PLAN:
1. Annual wellness exam - within normal limits
2. Fatigue - likely due to increased work demands and mild dehydration
   - Increase water intake to 2-3L/day
   - Follow up in 6 weeks if persists
3. Preventive care:
   - Influenza vaccine administered today
   - Colonoscopy screening due (age 45) - referral placed
   - Lipid panel ordered, follow up in 2 weeks

MEDICATIONS REVIEWED: Metformin 500mg BID, Lisinopril 10mg QD
ALLERGIES VERIFIED: Penicillin (rash)

Follow-up: 6 months or sooner if symptoms worsen.
Electronically signed: Dr. Emily Chen, MD | 18 Feb 2026, 10:45 AM`,
      isExpanded: false
    },
    {
      id: '2',
      date: '02 Dec 2025',
      provider: 'Dr. Michael Torres, MD',
      specialty: 'Cardiology',
      type: 'consultation',
      typeLabel: 'Consultation Note',
      preview: 'Patient referred by primary care for evaluation of mild hypertension and family history of CAD. Echocardiogram performed. Left ventricular function within normal limits...',
      fullText: `CARDIOLOGY CONSULTATION NOTE
Date: December 2, 2025
Consulting Provider: Dr. Michael Torres, MD, FACC - Cardiology
Referring Provider: Dr. Emily Chen, MD - Internal Medicine
Patient: Demo Patient | DOB: 01/15/1980 | MRN: 00123456

REASON FOR CONSULTATION:
Evaluation of mild hypertension and family history of coronary artery disease.

HISTORY:
Patient referred for cardiology evaluation. BP has been mildly elevated (130-140 systolic) over the past
6 months on home monitoring. Father had MI at age 58. No chest pain, palpitations, or syncope.
Currently on Lisinopril 10mg for borderline HTN.

CARDIAC RISK FACTORS:
- Family history: Father - MI age 58
- Mild hypertension (controlled)
- Non-smoker
- Moderate exercise
- LDL: 118 mg/dL (borderline)

DIAGNOSTIC STUDIES:
EKG (12/2/2025): Normal sinus rhythm, rate 66 bpm. No ST or T-wave changes. No conduction abnormalities.
Echocardiogram (12/2/2025):
  - LVEF: 60-65% (normal)
  - LV dimensions: normal
  - Diastolic function: Grade I diastolic dysfunction (mild, common for age)
  - Valves: Mild mitral regurgitation (trace) - clinically insignificant
  - No wall motion abnormalities

ASSESSMENT & PLAN:
1. Mild hypertension - well controlled on current regimen
   - Continue Lisinopril 10mg QD
   - Target BP < 130/80
2. Family history CAD risk - intermediate risk by pooled cohort equations (7.5%)
   - Initiate low-dose aspirin 81mg QD discussed (patient to discuss with PCP)
   - Consider statin therapy given LDL 118 + family history - discussed with patient
3. Trace MR - benign, no intervention needed
   - Repeat echo in 3-5 years

PLAN: Follow up with primary care. Return to cardiology in 12 months or PRN.
Electronically signed: Dr. Michael Torres, MD, FACC | 02 Dec 2025, 02:30 PM`,
      isExpanded: false
    },
    {
      id: '3',
      date: '14 Aug 2025',
      provider: 'Dr. Patricia Wallace, MD',
      specialty: 'General Surgery',
      type: 'procedure',
      typeLabel: 'Procedure Note',
      preview: 'Procedure: Skin excision, left forearm. Pre-op diagnosis: Suspicious sebaceous cyst. Post-op diagnosis: Benign epidermal inclusion cyst confirmed by pathology...',
      fullText: `PROCEDURE NOTE - Skin Excision
Date: August 14, 2025
Surgeon: Dr. Patricia Wallace, MD, FACS - General Surgery
Assistant: RN Jasmine Park
Patient: Demo Patient | DOB: 01/15/1980 | MRN: 00123456

PRE-PROCEDURE DIAGNOSIS: Suspicious sebaceous cyst, left forearm (2.1 cm)
POST-PROCEDURE DIAGNOSIS: Benign epidermal inclusion cyst (confirmed pathology)
PROCEDURE: Elliptical excision, left forearm

PROCEDURE DETAILS:
Patient was prepped and draped in the usual sterile fashion.
Area infiltrated with 1% lidocaine with epinephrine for local anesthesia.
Elliptical excision performed around the lesion with 3mm margins.
Lesion excised in toto with intact capsule. Hemostasis achieved with electrocautery.
Wound closed in layers: 3-0 vicryl deep dermal sutures x3, 4-0 nylon interrupted sutures x5.
Specimen sent to pathology in formalin.

ESTIMATED BLOOD LOSS: Minimal (<5 mL)
COMPLICATIONS: None
PATHOLOGY: Epidermal inclusion cyst, completely excised, no dysplasia or malignancy

POST-PROCEDURE INSTRUCTIONS:
- Keep wound dry x48 hours
- Suture removal in 10-14 days
- Return to clinic if signs of infection (increasing redness, warmth, drainage, fever)

Electronically signed: Dr. Patricia Wallace, MD, FACS | 14 Aug 2025, 11:15 AM`,
      isExpanded: false
    },
    {
      id: '4',
      date: '22 Mar 2025',
      provider: 'Dr. James Richardson, MD',
      specialty: 'Hospital Medicine',
      type: 'discharge',
      typeLabel: 'Discharge Note',
      preview: 'Patient admitted for 2 days with community-acquired pneumonia. Completed IV antibiotics, transitioned to oral therapy. Discharged in improved condition...',
      fullText: `DISCHARGE SUMMARY
Admission Date: March 20, 2025
Discharge Date: March 22, 2025
Attending: Dr. James Richardson, MD - Hospital Medicine
Patient: Demo Patient | DOB: 01/15/1980 | MRN: 00123456
Admitting Diagnosis: Community-acquired pneumonia, right lower lobe

HOSPITAL COURSE:
Patient presented to the ED with 3-day history of productive cough, fever (38.8°C), and
right-sided pleuritic chest pain. CXR showed RLL consolidation consistent with pneumonia.
Admitted for IV antibiotics and monitoring.

Hospital Day 1-2:
- IV Ceftriaxone 1g q24h + Azithromycin 500mg PO QD initiated
- Fever resolved by HD2, SpO2 improved to 99% on room air
- Tolerating oral intake, ambulating independently
- Repeat CXR (HD2): Improving infiltrate

DISCHARGE CONDITION: Good, afebrile, hemodynamically stable

DISCHARGE MEDICATIONS:
1. Amoxicillin-clavulanate 875/125mg PO BID x 5 more days (total 7-day course)
2. Continue home medications: Metformin 500mg BID, Lisinopril 10mg QD

DISCHARGE INSTRUCTIONS:
- Rest, increased fluid intake
- Follow up with primary care in 5-7 days
- Return to ED if: fever returns, worsening dyspnea, chest pain, or SpO2 <94%
- Repeat CXR in 6 weeks to confirm resolution

FOLLOW-UP: Dr. Emily Chen, MD (PCP) - March 27, 2025
Electronically signed: Dr. James Richardson, MD | 22 Mar 2025, 10:30 AM`,
      isExpanded: false
    },
    {
      id: '5',
      date: '10 Jan 2025',
      provider: 'Dr. Emily Chen, MD',
      specialty: 'Internal Medicine',
      type: 'visit',
      typeLabel: 'Visit Note',
      preview: 'Patient presents for diabetes management follow-up. HbA1c 6.8%, improved from last visit (7.1%). Patient reports consistent medication adherence and dietary improvements...',
      fullText: `VISIT NOTE - Diabetes Management Follow-Up
Date: January 10, 2025
Provider: Dr. Emily Chen, MD - Internal Medicine
Patient: Demo Patient | DOB: 01/15/1980 | MRN: 00123456

CHIEF COMPLAINT: Diabetes management follow-up, 3-month interval.

INTERVAL HISTORY:
Patient reports good medication adherence to Metformin 500mg BID. Dietary changes implemented
per nutritionist recommendations: reduced carbohydrate intake, increased fiber. Home glucose
readings averaging 110-130 mg/dL fasting. No hypoglycemic episodes. No polyuria/polydipsia.

LABORATORY REVIEW:
HbA1c: 6.8% (prev: 7.1% - September 2024) - IMPROVED
Fasting Glucose: 108 mg/dL
BMP: BUN 15, Creatinine 0.9, eGFR >90 - Normal
Lipid Panel: TC 195, LDL 112, HDL 48, TG 140 - Borderline LDL

ASSESSMENT & PLAN:
1. Type 2 Diabetes Mellitus - IMPROVING
   - HbA1c at goal (<7%)
   - Continue Metformin 500mg BID
   - Continue dietary modifications and exercise program
   - Repeat HbA1c in 6 months
2. Microalbumin/creatinine ratio: ordered (annual screening)
3. Ophthalmology referral placed (annual diabetic eye exam)
4. Foot exam performed - monofilament intact bilaterally, no lesions

Return to clinic in 6 months for HbA1c recheck.
Electronically signed: Dr. Emily Chen, MD | 10 Jan 2025, 09:15 AM`,
      isExpanded: false
    }
  ]);

  readonly filteredNotes = computed(() => {
    const filter = this.selectedFilter;
    if (filter === 'all') return this.notes();
    return this.notes().filter(n => n.type === filter);
  });

  toggleNote(note: ClinicalNote): void {
    this.notes.update(notes =>
      notes.map(n => n.id === note.id ? { ...n, isExpanded: !n.isExpanded } : n)
    );
  }

  getNoteIcon(type: string): string {
    const icons: Record<string, string> = {
      visit: 'pi-calendar-check',
      procedure: 'pi-wrench',
      consultation: 'pi-comments',
      discharge: 'pi-home'
    };
    return icons[type] ?? 'pi-file';
  }

  getNoteTagSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      visit: 'success',
      procedure: 'warn',
      consultation: 'info',
      discharge: 'danger'
    };
    return severities[type] ?? 'info';
  }

  downloadAllNotes(): void {
    // Mock download action
  }
}
