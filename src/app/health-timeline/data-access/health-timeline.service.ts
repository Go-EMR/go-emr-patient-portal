import { Injectable, signal, computed } from '@angular/core';

export type HealthEventType = 'appointment' | 'lab' | 'medication' | 'immunization' | 'vital' | 'procedure';

export interface HealthEvent {
  id: string;
  date: Date;
  type: HealthEventType;
  title: string;
  description: string;
  provider: string;
  isMilestone?: boolean;
}

export interface EventTypeFilter {
  type: HealthEventType | 'all';
  label: string;
  icon: string;
}

export const EVENT_TYPE_META: Record<HealthEventType, { color: string; bgColor: string; icon: string; label: string }> = {
  appointment: { color: 'var(--blue-700)',   bgColor: 'var(--blue-100)',   icon: 'pi pi-calendar',       label: 'Appointment'   },
  lab:         { color: 'var(--purple-700)', bgColor: 'var(--purple-100)', icon: 'pi pi-chart-bar',      label: 'Lab Result'    },
  medication:  { color: 'var(--teal-700)',   bgColor: 'var(--teal-100)',   icon: 'pi pi-tablet',         label: 'Medication'    },
  immunization:{ color: 'var(--green-700)',  bgColor: 'var(--green-100)',  icon: 'pi pi-shield',         label: 'Immunization'  },
  vital:       { color: 'var(--orange-700)', bgColor: 'var(--orange-100)', icon: 'pi pi-heart',          label: 'Vital Signs'   },
  procedure:   { color: 'var(--red-700)',    bgColor: 'var(--red-100)',    icon: 'pi pi-bolt',           label: 'Procedure'     }
};

const now = new Date();
const daysAgo = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);

const MOCK_EVENTS: HealthEvent[] = [
  {
    id: 'EVT-001',
    date: daysAgo(3),
    type: 'vital',
    title: 'Vital Signs Recorded',
    description: 'BP 124/82 mmHg, HR 72 bpm, Weight 178 lbs, O2 Sat 98%. Readings within normal range.',
    provider: 'Dr. Sarah Johnson'
  },
  {
    id: 'EVT-002',
    date: daysAgo(7),
    type: 'lab',
    title: 'Complete Metabolic Panel',
    description: 'All metabolic markers within reference range. Fasting glucose 94 mg/dL, eGFR 88, creatinine 0.9 mg/dL.',
    provider: 'Quest Diagnostics'
  },
  {
    id: 'EVT-003',
    date: daysAgo(12),
    type: 'appointment',
    title: 'Annual Physical Examination',
    description: 'Comprehensive wellness visit. Reviewed current medications, updated preventive care plan, and ordered routine labs.',
    provider: 'Dr. Sarah Johnson'
  },
  {
    id: 'EVT-004',
    date: daysAgo(21),
    type: 'medication',
    title: 'Lisinopril 10mg Started',
    description: 'Initiated ACE inhibitor therapy for hypertension management. Take once daily in the morning. Monitor for dry cough.',
    provider: 'Dr. Sarah Johnson',
    isMilestone: true
  },
  {
    id: 'EVT-005',
    date: daysAgo(28),
    type: 'vital',
    title: 'Blood Pressure Monitoring',
    description: 'BP 138/90 mmHg — slightly elevated. Advised lifestyle modifications including reduced sodium intake and increased activity.',
    provider: 'Nurse Practitioner Lisa Torres'
  },
  {
    id: 'EVT-006',
    date: daysAgo(35),
    type: 'appointment',
    title: 'Cardiology Consultation',
    description: 'Referred for evaluation of elevated blood pressure. EKG normal. Echo ordered to rule out structural abnormalities.',
    provider: 'Dr. Michael Chen'
  },
  {
    id: 'EVT-007',
    date: daysAgo(45),
    type: 'lab',
    title: 'Lipid Panel',
    description: 'Total cholesterol 198 mg/dL, LDL 122 mg/dL, HDL 52 mg/dL, Triglycerides 120 mg/dL. LDL borderline — dietary counseling recommended.',
    provider: 'Quest Diagnostics'
  },
  {
    id: 'EVT-008',
    date: daysAgo(58),
    type: 'procedure',
    title: 'Echocardiogram',
    description: 'Transthoracic echo performed. Left ventricular function normal (EF 60%). No structural abnormalities detected.',
    provider: 'Dr. Michael Chen',
    isMilestone: true
  },
  {
    id: 'EVT-009',
    date: daysAgo(72),
    type: 'immunization',
    title: 'Influenza Vaccine',
    description: 'Annual influenza vaccine administered. Quadrivalent formulation (2025-2026 season). Site: Left deltoid. No adverse reaction.',
    provider: 'Walgreens Pharmacy'
  },
  {
    id: 'EVT-010',
    date: daysAgo(90),
    type: 'medication',
    title: 'Atorvastatin 20mg Added',
    description: 'Statin therapy initiated to address borderline LDL levels. Take once daily at bedtime. Avoid grapefruit juice.',
    provider: 'Dr. Sarah Johnson',
    isMilestone: true
  },
  {
    id: 'EVT-011',
    date: daysAgo(105),
    type: 'lab',
    title: 'Hemoglobin A1c',
    description: 'HbA1c 5.6% — within normal range (pre-diabetic threshold is 5.7%). Continue current diet and exercise habits.',
    provider: 'Quest Diagnostics'
  },
  {
    id: 'EVT-012',
    date: daysAgo(130),
    type: 'appointment',
    title: 'Follow-up Visit — Cholesterol',
    description: 'Discussed lipid panel results and dietary interventions. Mediterranean diet plan reviewed. Exercise goal set at 150 min/week.',
    provider: 'Dr. Sarah Johnson'
  },
  {
    id: 'EVT-013',
    date: daysAgo(160),
    type: 'vital',
    title: 'Routine Vitals Check',
    description: 'BP 132/84 mmHg, HR 68 bpm, Temp 98.6°F, Weight 182 lbs. Weight trend noted — nutrition referral offered.',
    provider: 'Nurse Practitioner Lisa Torres'
  },
  {
    id: 'EVT-014',
    date: daysAgo(195),
    type: 'procedure',
    title: 'Colonoscopy Screening',
    description: 'Routine screening colonoscopy performed. Two small polyps (< 5mm) removed and sent for pathology. Results benign.',
    provider: 'Dr. Amanda Rivers',
    isMilestone: true
  },
  {
    id: 'EVT-015',
    date: daysAgo(220),
    type: 'immunization',
    title: 'Tdap Booster',
    description: 'Tetanus, diphtheria, and acellular pertussis booster administered. Next booster due in 10 years.',
    provider: 'Dr. Sarah Johnson'
  },
  {
    id: 'EVT-016',
    date: daysAgo(255),
    type: 'lab',
    title: 'Complete Blood Count (CBC)',
    description: 'WBC 6.8 K/uL, RBC 4.9 M/uL, Hemoglobin 14.2 g/dL, Platelets 245 K/uL. All values within normal limits.',
    provider: 'Quest Diagnostics'
  },
  {
    id: 'EVT-017',
    date: daysAgo(290),
    type: 'medication',
    title: 'Metformin 500mg Discontinued',
    description: 'Metformin discontinued following normalization of fasting glucose levels over 6-month period. Continue dietary management.',
    provider: 'Dr. Sarah Johnson',
    isMilestone: true
  },
  {
    id: 'EVT-018',
    date: daysAgo(320),
    type: 'appointment',
    title: 'Dermatology Consultation',
    description: 'Skin check performed. Two benign seborrheic keratoses noted. No concerning lesions identified. Follow-up in 12 months.',
    provider: 'Dr. Priya Nair'
  },
  {
    id: 'EVT-019',
    date: daysAgo(350),
    type: 'lab',
    title: 'Thyroid Function Panel',
    description: 'TSH 2.1 mIU/L, Free T4 1.0 ng/dL — both within normal reference ranges. No thyroid dysfunction detected.',
    provider: 'Quest Diagnostics'
  },
  {
    id: 'EVT-020',
    date: daysAgo(365),
    type: 'appointment',
    title: 'Annual Physical — Previous Year',
    description: 'Annual wellness exam completed. Vaccinations reviewed, preventive screenings scheduled, and lab work ordered.',
    provider: 'Dr. Sarah Johnson'
  }
];

export const FILTER_OPTIONS: EventTypeFilter[] = [
  { type: 'all',          label: 'All Events',    icon: 'pi pi-list'      },
  { type: 'appointment',  label: 'Appointments',  icon: 'pi pi-calendar'  },
  { type: 'lab',          label: 'Labs',          icon: 'pi pi-chart-bar' },
  { type: 'medication',   label: 'Medications',   icon: 'pi pi-tablet'    },
  { type: 'immunization', label: 'Immunizations', icon: 'pi pi-shield'    },
  { type: 'vital',        label: 'Vitals',        icon: 'pi pi-heart'     },
  { type: 'procedure',    label: 'Procedures',    icon: 'pi pi-bolt'      }
];

@Injectable({ providedIn: 'root' })
export class HealthTimelineService {
  private readonly _events = signal<HealthEvent[]>(
    [...MOCK_EVENTS].sort((a, b) => b.date.getTime() - a.date.getTime())
  );

  private readonly _activeFilter = signal<HealthEventType | 'all'>('all');

  readonly activeFilter = this._activeFilter.asReadonly();

  readonly filteredEvents = computed(() => {
    const filter = this._activeFilter();
    const events = this._events();
    return filter === 'all' ? events : events.filter(e => e.type === filter);
  });

  readonly eventCountByType = computed(() => {
    const events = this._events();
    const counts: Partial<Record<HealthEventType | 'all', number>> = { all: events.length };
    for (const type of Object.keys(EVENT_TYPE_META) as HealthEventType[]) {
      counts[type] = events.filter(e => e.type === type).length;
    }
    return counts;
  });

  setFilter(filter: HealthEventType | 'all'): void {
    this._activeFilter.set(filter);
  }

  getMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
