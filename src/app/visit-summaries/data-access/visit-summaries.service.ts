import { Injectable, signal, computed } from '@angular/core';
import { VisitSummary } from '../../shared/data-access/models';

@Injectable({ providedIn: 'root' })
export class VisitSummariesService {
  private _visits = signal<VisitSummary[]>([]);
  private _loading = signal(false);
  private _selectedVisitId = signal<string | null>(null);

  readonly visits = this._visits.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selectedVisitId = this._selectedVisitId.asReadonly();

  readonly newVisitsCount = computed(() =>
    this._visits().filter(v => v.status === 'new').length
  );

  readonly selectedVisit = computed(() => {
    const id = this._selectedVisitId();
    return id ? this._visits().find(v => v.id === id) ?? null : null;
  });

  constructor() {
    this.loadMockData();
  }

  selectVisit(id: string | null): void {
    this._selectedVisitId.set(id);
    if (id) {
      this._visits.update(visits =>
        visits.map(v => v.id === id ? { ...v, status: 'reviewed' as const } : v)
      );
    }
  }

  private loadMockData(): void {
    this._loading.set(true);
    setTimeout(() => {
      const now = new Date();
      const weeksAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n * 7);
        return d;
      };

      const visits: VisitSummary[] = [
        {
          id: 'vs-001',
          visitDate: weeksAgo(2),
          providerName: 'Dr. Sarah Chen',
          providerSpecialty: 'Internal Medicine',
          visitType: 'Annual Physical Exam',
          locationName: 'AuraHealth Primary Care — Downtown',
          locationAddress: '400 Westlake Ave N, Seattle, WA 98109',
          durationMinutes: 60,
          status: 'new',
          chiefComplaint: 'Annual wellness exam; no acute complaints',
          diagnoses: [
            {
              icdCode: 'Z00.00',
              description: 'Encounter for general adult medical examination without abnormal findings',
              plainLanguage: 'Annual physical — everything looks healthy',
              type: 'primary'
            },
            {
              icdCode: 'E11.9',
              description: 'Type 2 diabetes mellitus without complications',
              plainLanguage: 'Type 2 diabetes — currently well-controlled',
              type: 'secondary'
            },
            {
              icdCode: 'I10',
              description: 'Essential (primary) hypertension',
              plainLanguage: 'High blood pressure — stable on current medication',
              type: 'secondary'
            }
          ],
          treatmentPlan: 'Continue current diabetes management plan. Blood pressure is well-controlled on lisinopril 10mg. Ordered HbA1c and comprehensive metabolic panel to review at next visit. Recommended increasing aerobic exercise to 150 minutes per week. Influenza vaccine administered today.',
          medicationChanges: [
            {
              name: 'Lisinopril 10mg',
              dosage: '10mg',
              frequency: 'Once daily',
              instructions: 'Take in the morning with or without food',
              changeType: 'continued'
            },
            {
              name: 'Metformin 1000mg',
              dosage: '1000mg',
              frequency: 'Twice daily with meals',
              instructions: 'Take with breakfast and dinner to reduce GI side effects',
              changeType: 'continued'
            },
            {
              name: 'Aspirin 81mg',
              dosage: '81mg',
              frequency: 'Once daily',
              instructions: 'Take with food',
              changeType: 'new'
            }
          ],
          labOrders: [
            { testName: 'HbA1c', reason: 'Diabetes monitoring — quarterly check', status: 'ordered' },
            { testName: 'Comprehensive Metabolic Panel', reason: 'Annual wellness screening', status: 'ordered' },
            { testName: 'Lipid Panel', reason: 'Cardiovascular risk assessment', status: 'ordered' },
            { testName: 'TSH', reason: 'Thyroid function screening', status: 'ordered' }
          ],
          followUpInstructions: 'Schedule follow-up in 3 months to review lab results and diabetes management. Call our office if you experience any of the warning signs listed below.',
          warningSignsToWatch: [
            'Blood sugar consistently above 250 mg/dL',
            'Chest pain or shortness of breath',
            'Severe headache with vision changes',
            'Unexplained weight loss of more than 5 lbs in a month',
            'Signs of infection: fever above 101°F, increased redness or swelling'
          ],
          referrals: [
            {
              specialty: 'Ophthalmology',
              reason: 'Annual diabetic eye exam',
              urgency: 'routine',
              status: 'pending'
            }
          ],
          vitals: {
            bloodPressure: '128/82 mmHg',
            heartRate: 72,
            temperature: '98.4°F',
            weight: '182 lbs',
            height: '5\'9"',
            bmi: 26.9,
            oxygenSaturation: 99,
            respiratoryRate: 16
          },
          providerNotes: 'Patient is engaged and asks good questions about their health. Overall doing well managing two chronic conditions. Encouraged continued use of the patient portal for results.'
        },
        {
          id: 'vs-002',
          visitDate: weeksAgo(4),
          providerName: 'Dr. Michael Park',
          providerSpecialty: 'Cardiology',
          visitType: 'Cardiology Follow-Up',
          locationName: 'Seattle Heart & Vascular Center',
          locationAddress: '1100 9th Ave, Seattle, WA 98101',
          durationMinutes: 45,
          status: 'reviewed',
          chiefComplaint: 'Follow-up for hypertension and mild aortic stenosis identified on last echo',
          diagnoses: [
            {
              icdCode: 'I35.0',
              description: 'Nonrheumatic aortic (valve) stenosis',
              plainLanguage: 'Mild narrowing of the aortic heart valve — being monitored closely',
              type: 'primary'
            },
            {
              icdCode: 'I10',
              description: 'Essential (primary) hypertension',
              plainLanguage: 'High blood pressure — well-controlled',
              type: 'secondary'
            }
          ],
          treatmentPlan: 'Mild aortic stenosis remains stable; repeat echocardiogram in 12 months. Blood pressure is optimally controlled. No surgical intervention needed at this time. Continue current medications. Lifestyle modification counseling provided — sodium restriction and regular moderate exercise emphasized.',
          medicationChanges: [
            {
              name: 'Lisinopril 10mg',
              dosage: '10mg',
              frequency: 'Once daily',
              instructions: 'Morning dose with water',
              changeType: 'continued'
            },
            {
              name: 'Atorvastatin 40mg',
              dosage: '40mg',
              frequency: 'Once nightly',
              instructions: 'Take at bedtime. Avoid grapefruit juice.',
              changeType: 'modified'
            }
          ],
          labOrders: [
            { testName: 'BNP (B-Natriuretic Peptide)', reason: 'Heart failure screening with valve disease', status: 'resulted' },
            { testName: 'Troponin I', reason: 'Baseline cardiac enzyme', status: 'resulted' }
          ],
          followUpInstructions: 'Return in 12 months for repeat echocardiogram and cardiology follow-up. Sooner if symptoms develop.',
          warningSignsToWatch: [
            'New or worsening chest pain or pressure',
            'Shortness of breath with minimal exertion or at rest',
            'Unexplained fainting or near-fainting episodes',
            'Rapid or irregular heartbeat lasting more than a few minutes',
            'Swelling in legs or ankles that is new or worsening'
          ],
          referrals: [],
          vitals: {
            bloodPressure: '126/78 mmHg',
            heartRate: 68,
            temperature: '98.2°F',
            weight: '180 lbs',
            oxygenSaturation: 98
          }
        },
        {
          id: 'vs-003',
          visitDate: weeksAgo(8),
          providerName: 'Dr. Lisa Wong',
          providerSpecialty: 'Urgent Care',
          visitType: 'Urgent Care Visit',
          locationName: 'AuraHealth Urgent Care — Eastside',
          locationAddress: '15600 NE 8th St, Bellevue, WA 98008',
          durationMinutes: 30,
          status: 'reviewed',
          chiefComplaint: 'Right knee pain after hiking; difficulty bearing weight',
          diagnoses: [
            {
              icdCode: 'M79.361',
              description: 'Pain in right foot',
              plainLanguage: 'Acute right knee pain — likely muscle strain from overuse',
              type: 'primary'
            },
            {
              icdCode: 'M79.3',
              description: 'Panniculitis',
              plainLanguage: 'Soft tissue inflammation around the knee',
              type: 'secondary'
            }
          ],
          treatmentPlan: 'RICE protocol (Rest, Ice, Compression, Elevation) for 48-72 hours. Ibuprofen 400mg every 6 hours as needed for pain and inflammation. X-ray of right knee completed — no fracture identified. If pain not improving in 7-10 days, follow up with orthopedics for possible MRI.',
          medicationChanges: [
            {
              name: 'Ibuprofen 400mg',
              dosage: '400mg',
              frequency: 'Every 6 hours as needed',
              instructions: 'Take with food. Do not exceed 1600mg per day. Use for no more than 7 days.',
              changeType: 'new'
            }
          ],
          labOrders: [],
          followUpInstructions: 'Rest the knee and avoid high-impact activity for at least 1 week. Follow up with your primary care doctor if pain worsens or doesn\'t improve in 10 days.',
          warningSignsToWatch: [
            'Increased swelling or redness in the knee',
            'Fever above 100.4°F (could indicate joint infection)',
            'Inability to bear any weight at all',
            'Joint feels "locked" or gives way completely',
            'Numbness or tingling in the leg or foot'
          ],
          referrals: [
            {
              specialty: 'Orthopedics',
              reason: 'Evaluation if knee pain persists beyond 10 days',
              urgency: 'routine',
              status: 'pending'
            }
          ],
          vitals: {
            bloodPressure: '132/84 mmHg',
            heartRate: 88,
            temperature: '98.6°F',
            weight: '182 lbs',
            oxygenSaturation: 99
          }
        },
        {
          id: 'vs-004',
          visitDate: weeksAgo(13),
          providerName: 'Dr. James Rivera',
          providerSpecialty: 'Dermatology',
          visitType: 'Dermatology Consultation',
          locationName: 'Pacific Dermatology Associates',
          locationAddress: '2025 1st Ave, Suite 600, Seattle, WA 98121',
          durationMinutes: 40,
          status: 'reviewed',
          chiefComplaint: 'Several changing moles on the back; patient concerned about appearance',
          diagnoses: [
            {
              icdCode: 'D22.5',
              description: 'Melanocytic naevi of trunk',
              plainLanguage: 'Benign moles on the back — currently non-cancerous',
              type: 'primary'
            },
            {
              icdCode: 'L57.0',
              description: 'Actinic keratosis',
              plainLanguage: 'Sun-damaged skin patches that need monitoring (pre-cancerous)',
              type: 'secondary'
            }
          ],
          treatmentPlan: 'Two moles biopsied today — results expected in 5-7 business days. Actinic keratosis on left forearm treated with cryotherapy in-office. Sunscreen counseling provided — SPF 50+ daily use recommended. Full-body skin check completed. Annual skin screenings recommended given history.',
          medicationChanges: [
            {
              name: 'Tretinoin 0.025% Cream',
              dosage: '0.025%',
              frequency: 'Apply nightly to affected areas',
              instructions: 'Apply a pea-sized amount to clean, dry skin. Use sunscreen daily. May cause initial redness.',
              changeType: 'new'
            }
          ],
          labOrders: [
            { testName: 'Skin Biopsy — Lesion #1 (Upper back)', reason: 'Rule out melanoma in changing mole', status: 'resulted' },
            { testName: 'Skin Biopsy — Lesion #2 (Lower back)', reason: 'Rule out melanoma in changing mole', status: 'resulted' }
          ],
          followUpInstructions: 'Biopsy results sent via portal message. Return in 6 months for follow-up skin check. Use sunscreen daily, avoid tanning beds.',
          warningSignsToWatch: [
            'Any mole that rapidly changes in size, shape, or color',
            'New dark spots that appear suddenly',
            'Moles that bleed spontaneously',
            'Any skin sore that doesn\'t heal within 2-3 weeks',
            'Biopsy sites showing signs of infection: redness spreading, warmth, pus'
          ],
          referrals: [],
          vitals: {
            bloodPressure: '124/80 mmHg',
            heartRate: 74,
            temperature: '98.2°F',
            weight: '182 lbs'
          }
        },
        {
          id: 'vs-005',
          visitDate: weeksAgo(17),
          providerName: 'Dr. Sarah Chen',
          providerSpecialty: 'Internal Medicine',
          visitType: 'Lab Results Review',
          locationName: 'AuraHealth Primary Care — Downtown',
          locationAddress: '400 Westlake Ave N, Seattle, WA 98109',
          durationMinutes: 20,
          status: 'reviewed',
          chiefComplaint: 'Review of HbA1c and quarterly labs — patient-initiated visit',
          diagnoses: [
            {
              icdCode: 'E11.65',
              description: 'Type 2 diabetes mellitus with hyperglycemia',
              plainLanguage: 'Blood sugar levels were running slightly high this quarter — plan adjusted',
              type: 'primary'
            }
          ],
          treatmentPlan: 'HbA1c came back at 7.4% — slightly above our target of 7.0%. Increased Metformin from 500mg to 1000mg twice daily. Reinforced dietary changes: reduce refined carbohydrates, increase fiber intake. Referred to diabetes education program. Repeat HbA1c in 3 months.',
          medicationChanges: [
            {
              name: 'Metformin',
              dosage: '1000mg (increased from 500mg)',
              frequency: 'Twice daily with meals',
              instructions: 'Titrated up gradually — may cause temporary GI discomfort. Take with food.',
              changeType: 'modified'
            }
          ],
          labOrders: [
            { testName: 'HbA1c', reason: 'Diabetes monitoring — 3 month follow-up', status: 'ordered' }
          ],
          followUpInstructions: 'Repeat HbA1c in 3 months. Enroll in the AuraHealth Diabetes Education Program — a referral has been sent. Track blood glucose daily and log readings in the patient portal.',
          warningSignsToWatch: [
            'Blood glucose below 70 mg/dL (hypoglycemia): sweating, shakiness, confusion',
            'Blood glucose above 300 mg/dL on multiple readings',
            'Symptoms of DKA: nausea, vomiting, fruity breath, abdominal pain',
            'Signs of medication side effects: severe nausea, vomiting, or abdominal pain'
          ],
          referrals: [
            {
              specialty: 'Diabetes Education Program',
              providerName: 'Certified Diabetes Care and Education Specialist',
              reason: 'Improve diabetes self-management skills and nutrition counseling',
              urgency: 'routine',
              status: 'scheduled'
            }
          ],
          vitals: {
            bloodPressure: '130/82 mmHg',
            heartRate: 76,
            temperature: '98.6°F',
            weight: '184 lbs',
            bmi: 27.2
          }
        }
      ];

      this._visits.set(visits);
      this._loading.set(false);
    }, 600);
  }
}
