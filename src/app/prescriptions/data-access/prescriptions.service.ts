import { Injectable, signal, computed } from '@angular/core';

export interface Prescription {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  prescribedDate: Date;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'completed';
  refillsRemaining: number;
  refillsTotal: number;
  lastFilledDate?: Date;
  preferredPharmacyId?: string;
  pharmacyName?: string;
  instructions: string;
  isControlled: boolean;
  controlledSubstance: boolean;
  canRequestRefill: boolean;
  hasInteractionWarning: boolean;
  interactionNote?: string;
  sideEffects?: { common: string[]; serious: string[]; rare: string[] };
}

export interface RefillRequest {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  pharmacyId: string;
  pharmacy: string;
  pharmacyAddress: string;
  status: 'requested' | 'processing' | 'ready' | 'picked-up';
  requestedAt: Date;
  estimatedReady?: Date;
  notes?: string;
}

export interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  distance: string;
  isPreferred: boolean;
}

export interface AdherenceEntry {
  date: Date;
  medications: { medicationId: string; medicationName: string; taken: boolean }[];
}

export type RefillStep = 'select-med' | 'select-pharmacy' | 'confirm' | 'tracking';

// ─── Feature 11.1: Drug Interaction types ────────────────────────────────────

export type InteractionSeverity = 'HIGH' | 'MODERATE' | 'LOW';

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  description: string;
}

// ─── Feature 11.3: PBS Active Script types ───────────────────────────────────

export type PBSAuthorityStatus = 'General' | 'Authority Required';

export interface PBSScript {
  scriptNumber: string;
  drugName: string;
  pbsItemCode: string;
  authorityStatus: PBSAuthorityStatus;
  repeatsRemaining: number;
  expiryDate: Date;
}

// ─── Mock date helper ────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date(2026, 1, 21);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(2026, 1, 21);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    medicationName: 'Metformin HCl',
    genericName: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily with meals',
    route: 'Oral',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 3, 10),
    startDate: new Date(2025, 3, 12),
    status: 'active',
    refillsRemaining: 2,
    refillsTotal: 5,
    lastFilledDate: daysAgo(28),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take with meals to reduce stomach upset. Do not crush or chew.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: true,
    hasInteractionWarning: false,
    sideEffects: {
      common: ['Nausea', 'Diarrhea', 'Stomach pain', 'Loss of appetite'],
      serious: ['Lactic acidosis (rare but serious — seek emergency care)', 'Severe allergic reaction'],
      rare: ['Vitamin B12 deficiency with long-term use', 'Metallic taste in mouth']
    }
  },
  {
    id: 'rx-002',
    medicationName: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily',
    route: 'Oral',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 1, 5),
    startDate: new Date(2025, 1, 6),
    status: 'active',
    refillsRemaining: 4,
    refillsTotal: 6,
    lastFilledDate: daysAgo(14),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take at the same time each day. May cause dizziness when standing — rise slowly.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: true,
    hasInteractionWarning: true,
    interactionNote: 'Potential interaction with potassium supplements. Consult your pharmacist.',
    sideEffects: {
      common: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
      serious: ['Swelling of face, lips, or throat (angioedema)', 'Chest pain', 'Difficulty breathing'],
      rare: ['Liver problems', 'Low white blood cell count', 'Kidney function changes']
    }
  },
  {
    id: 'rx-003',
    medicationName: 'Atorvastatin',
    genericName: 'Atorvastatin calcium',
    dosage: '20 mg',
    frequency: 'Once daily at bedtime',
    route: 'Oral',
    prescribedBy: 'Dr. James Patel',
    prescribedDate: new Date(2025, 0, 18),
    startDate: new Date(2025, 0, 20),
    status: 'active',
    refillsRemaining: 1,
    refillsTotal: 3,
    lastFilledDate: daysAgo(60),
    preferredPharmacyId: 'ph-002',
    pharmacyName: 'Walgreens - Oak Ave',
    instructions: 'Take in the evening. Avoid large amounts of grapefruit juice.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: true,
    hasInteractionWarning: true,
    interactionNote: 'Avoid grapefruit — can increase statin levels in your blood significantly.',
    sideEffects: {
      common: ['Muscle aches or weakness', 'Joint pain', 'Diarrhea', 'Indigestion'],
      serious: ['Rhabdomyolysis (severe muscle breakdown)', 'Liver enzyme elevation', 'Unexplained muscle pain with dark urine'],
      rare: ['Memory problems or confusion', 'Type 2 diabetes risk increase', 'Peripheral neuropathy']
    }
  },
  {
    id: 'rx-004',
    medicationName: 'Sertraline',
    genericName: 'Sertraline HCl',
    dosage: '50 mg',
    frequency: 'Once daily in the morning',
    route: 'Oral',
    prescribedBy: 'Dr. Maria Gonzalez',
    prescribedDate: new Date(2024, 9, 3),
    startDate: new Date(2024, 9, 5),
    status: 'active',
    refillsRemaining: 3,
    refillsTotal: 6,
    lastFilledDate: daysAgo(20),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take in the morning with or without food. May take 4-6 weeks for full effect.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: true,
    hasInteractionWarning: false,
    sideEffects: {
      common: ['Nausea', 'Insomnia', 'Dry mouth', 'Increased sweating', 'Decreased appetite'],
      serious: ['Serotonin syndrome (with other serotonergic drugs)', 'Increased suicidal thoughts (especially in young adults)', 'Bleeding risk'],
      rare: ['Hyponatremia (low sodium)', 'Angle-closure glaucoma', 'Prolonged QT interval']
    }
  },
  {
    id: 'rx-005',
    medicationName: 'Albuterol Inhaler',
    genericName: 'Albuterol sulfate',
    dosage: '90 mcg/actuation',
    frequency: 'As needed for breathing',
    route: 'Inhalation',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 5, 22),
    startDate: new Date(2025, 5, 22),
    status: 'active',
    refillsRemaining: 5,
    refillsTotal: 5,
    lastFilledDate: daysAgo(90),
    preferredPharmacyId: 'ph-003',
    pharmacyName: 'Rite Aid - Center Plaza',
    instructions: '1-2 puffs every 4-6 hours as needed. Shake well before each use.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: true,
    hasInteractionWarning: false,
    sideEffects: {
      common: ['Tremor or shakiness', 'Rapid or pounding heartbeat', 'Headache', 'Nervousness'],
      serious: ['Severe paradoxical bronchospasm (worsening breathing)', 'Serious heart rhythm changes', 'Severe allergic reaction'],
      rare: ['Low potassium levels (hypokalemia)', 'High blood sugar', 'Chest pain with overuse']
    }
  },
  {
    id: 'rx-006',
    medicationName: 'Omeprazole',
    genericName: 'Omeprazole',
    dosage: '20 mg',
    frequency: 'Once daily before breakfast',
    route: 'Oral',
    prescribedBy: 'Dr. James Patel',
    prescribedDate: new Date(2025, 7, 11),
    startDate: new Date(2025, 7, 12),
    status: 'active',
    refillsRemaining: 0,
    refillsTotal: 2,
    lastFilledDate: daysAgo(35),
    preferredPharmacyId: 'ph-002',
    pharmacyName: 'Walgreens - Oak Ave',
    instructions: 'Take 30-60 minutes before eating. Swallow capsule whole — do not crush.',
    isControlled: false,
    controlledSubstance: false,
    canRequestRefill: false,
    hasInteractionWarning: false,
    sideEffects: {
      common: ['Headache', 'Diarrhea', 'Nausea', 'Stomach pain', 'Gas'],
      serious: ['Clostridium difficile infection with prolonged use', 'Severe skin reactions', 'Low magnesium (long-term use)'],
      rare: ['Bone fracture risk with long-term high-dose use', 'Vitamin B12 deficiency', 'Lupus-like symptoms']
    }
  },
  // ─── Feature 11.2: Controlled substance medication ───────────────────────
  {
    id: 'rx-007',
    medicationName: 'Alprazolam',
    genericName: 'Alprazolam',
    dosage: '0.5 mg',
    frequency: 'Twice daily as needed for anxiety',
    route: 'Oral',
    prescribedBy: 'Dr. Maria Gonzalez',
    prescribedDate: new Date(2025, 10, 5),
    startDate: new Date(2025, 10, 6),
    status: 'active',
    refillsRemaining: 1,
    refillsTotal: 2,
    lastFilledDate: daysAgo(45),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take as directed. Do not exceed prescribed dose. May cause drowsiness — avoid driving.',
    isControlled: true,
    controlledSubstance: true,
    canRequestRefill: true,
    hasInteractionWarning: false,
    sideEffects: {
      common: ['Drowsiness', 'Dizziness', 'Fatigue', 'Memory problems', 'Slurred speech'],
      serious: ['Respiratory depression (especially with opioids or alcohol)', 'Paradoxical reactions (agitation, hostility)', 'Dependency and withdrawal risk'],
      rare: ['Severe allergic reaction', 'Jaundice', 'Mania or hypomania']
    }
  }
];

const MOCK_PHARMACIES: PharmacyInfo[] = [
  {
    id: 'ph-001',
    name: 'CVS Pharmacy',
    address: '1422 Main Street',
    city: 'Springfield, IL 62701',
    phone: '(217) 555-0124',
    hours: 'Mon–Fri 8am–10pm, Sat–Sun 9am–6pm',
    distance: '0.4 mi',
    isPreferred: true
  },
  {
    id: 'ph-002',
    name: 'Walgreens',
    address: '804 Oak Avenue',
    city: 'Springfield, IL 62702',
    phone: '(217) 555-0187',
    hours: 'Open 24 hours',
    distance: '1.1 mi',
    isPreferred: false
  },
  {
    id: 'ph-003',
    name: 'Rite Aid',
    address: '55 Center Plaza, Suite 100',
    city: 'Springfield, IL 62703',
    phone: '(217) 555-0231',
    hours: 'Mon–Sat 9am–9pm, Sun 10am–6pm',
    distance: '2.3 mi',
    isPreferred: false
  }
];

const MOCK_REFILL_REQUESTS: RefillRequest[] = [
  {
    id: 'rr-001',
    medicationId: 'rx-001',
    medicationName: 'Metformin HCl 500 mg',
    dosage: '500 mg',
    pharmacyId: 'ph-001',
    pharmacy: 'CVS Pharmacy',
    pharmacyAddress: '1422 Main Street, Springfield, IL 62701',
    status: 'ready',
    requestedAt: daysAgo(3),
    estimatedReady: daysAgo(1),
    notes: 'Ready for pickup at the pharmacy counter.'
  },
  {
    id: 'rr-002',
    medicationId: 'rx-004',
    medicationName: 'Sertraline 50 mg',
    dosage: '50 mg',
    pharmacyId: 'ph-001',
    pharmacy: 'CVS Pharmacy',
    pharmacyAddress: '1422 Main Street, Springfield, IL 62701',
    status: 'processing',
    requestedAt: daysAgo(1),
    estimatedReady: daysFromNow(1),
    notes: 'Being processed by the pharmacy.'
  }
];

// ─── Feature 11.1: Mock drug interactions ────────────────────────────────────

const MOCK_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: 'di-001',
    drugA: 'Lisinopril',
    drugB: 'Potassium Supplements',
    severity: 'HIGH',
    description: 'May cause dangerously high potassium levels (hyperkalemia). Monitor potassium levels regularly.'
  },
  {
    id: 'di-002',
    drugA: 'Metformin',
    drugB: 'Contrast Dye',
    severity: 'MODERATE',
    description: 'Hold metformin 48 hours before and after contrast imaging procedures.'
  },
  {
    id: 'di-003',
    drugA: 'Atorvastatin',
    drugB: 'Grapefruit',
    severity: 'LOW',
    description: 'Grapefruit may increase statin levels. Limit grapefruit consumption.'
  }
];

// ─── Feature 11.3: Mock PBS Active Script data ───────────────────────────────

const MOCK_PBS_SCRIPTS: PBSScript[] = [
  {
    scriptNumber: 'PBS-2026-00184371',
    drugName: 'Metformin Hydrochloride 500 mg tablet',
    pbsItemCode: '8382B',
    authorityStatus: 'General',
    repeatsRemaining: 4,
    expiryDate: daysFromNow(180)
  },
  {
    scriptNumber: 'PBS-2026-00184372',
    drugName: 'Atorvastatin 20 mg tablet',
    pbsItemCode: '8560K',
    authorityStatus: 'Authority Required',
    repeatsRemaining: 2,
    expiryDate: daysFromNow(90)
  },
  {
    scriptNumber: 'PBS-2026-00184373',
    drugName: 'Omeprazole 20 mg capsule',
    pbsItemCode: '2871B',
    authorityStatus: 'General',
    repeatsRemaining: 5,
    expiryDate: daysFromNow(240)
  },
  {
    scriptNumber: 'PBS-2026-00184374',
    drugName: 'Sertraline 50 mg tablet',
    pbsItemCode: '3572N',
    authorityStatus: 'Authority Required',
    repeatsRemaining: 1,
    expiryDate: daysFromNow(60)
  }
];

// ─── Mock adherence data (30 days, ~87% adherence) ───────────────────────────

function generateAdherenceData(): AdherenceEntry[] {
  const today = new Date(2026, 1, 21);
  const activeMeds = [
    { medicationId: 'rx-001', medicationName: 'Metformin HCl' },
    { medicationId: 'rx-002', medicationName: 'Lisinopril' },
    { medicationId: 'rx-003', medicationName: 'Atorvastatin' },
    { medicationId: 'rx-004', medicationName: 'Sertraline' },
    { medicationId: 'rx-005', medicationName: 'Albuterol Inhaler' },
    { medicationId: 'rx-006', medicationName: 'Omeprazole' },
  ];

  // Days in February 2026 that are missed or partial (to reach ~87% overall)
  // Fully missed days (all meds not taken):
  const missedDays = new Set([5, 12, 19]);
  // Partial days (some meds skipped — indices of meds NOT taken):
  const partialDays: Record<number, number[]> = {
    3: [2, 4],        // day 3: Atorvastatin + Albuterol skipped
    8: [1, 5],        // day 8: Lisinopril + Omeprazole skipped
    15: [0, 3],       // day 15: Metformin + Sertraline skipped
    17: [4],          // day 17: Albuterol skipped
    20: [2, 3, 5],    // day 20: Atorvastatin, Sertraline, Omeprazole skipped
  };

  const entries: AdherenceEntry[] = [];

  for (let dayNum = 1; dayNum <= 28; dayNum++) {
    const date = new Date(2026, 1, dayNum);
    const isFuture = date > today;

    if (isFuture) {
      entries.push({ date, medications: [] });
      continue;
    }

    const skippedIndices = partialDays[dayNum] ?? [];
    const allMissed = missedDays.has(dayNum);

    entries.push({
      date,
      medications: activeMeds.map((med, idx) => ({
        medicationId: med.medicationId,
        medicationName: med.medicationName,
        taken: allMissed ? false : !skippedIndices.includes(idx)
      }))
    });
  }

  return entries;
}

const MOCK_ADHERENCE: AdherenceEntry[] = generateAdherenceData();

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PrescriptionsService {
  private readonly _prescriptions = signal<Prescription[]>(MOCK_PRESCRIPTIONS);
  private readonly _pharmacies = signal<PharmacyInfo[]>(MOCK_PHARMACIES);
  private readonly _refillRequests = signal<RefillRequest[]>(MOCK_REFILL_REQUESTS);
  private readonly _selectedMedicationId = signal<string | null>(null);
  private readonly _selectedPharmacyId = signal<string | null>(null);
  private readonly _refillStep = signal<RefillStep>('select-med');
  private readonly _dialogOpen = signal<boolean>(false);
  private readonly _adherenceLog = signal<AdherenceEntry[]>(MOCK_ADHERENCE);

  // ─── Feature 11.1: Drug interactions ─────────────────────────────────────
  private readonly _drugInteractions = signal<DrugInteraction[]>(MOCK_DRUG_INTERACTIONS);

  // ─── Feature 11.3: PBS scripts ───────────────────────────────────────────
  private readonly _pbsScripts = signal<PBSScript[]>(MOCK_PBS_SCRIPTS);

  readonly prescriptions = this._prescriptions.asReadonly();
  readonly pharmacies = this._pharmacies.asReadonly();
  readonly refillRequests = this._refillRequests.asReadonly();
  readonly selectedMedicationId = this._selectedMedicationId.asReadonly();
  readonly selectedPharmacyId = this._selectedPharmacyId.asReadonly();
  readonly refillStep = this._refillStep.asReadonly();
  readonly dialogOpen = this._dialogOpen.asReadonly();
  readonly adherenceLog = this._adherenceLog.asReadonly();
  readonly drugInteractions = this._drugInteractions.asReadonly();
  readonly pbsScripts = this._pbsScripts.asReadonly();

  readonly activeMedications = computed(() =>
    this._prescriptions().filter(rx => rx.status === 'active')
  );

  readonly pendingRefills = computed(() =>
    this._refillRequests().filter(rr => rr.status !== 'picked-up')
  );

  readonly selectedMedication = computed(() => {
    const id = this._selectedMedicationId();
    return id ? this._prescriptions().find(rx => rx.id === id) ?? null : null;
  });

  readonly selectedPharmacy = computed(() => {
    const id = this._selectedPharmacyId();
    return id ? this._pharmacies().find(ph => ph.id === id) ?? null : null;
  });

  readonly interactionWarnings = computed(() =>
    this._prescriptions().filter(rx => rx.hasInteractionWarning && rx.status === 'active')
  );

  // ─── Feature 11.1: Computed interaction summary ──────────────────────────

  readonly interactionCountBySevertiy = computed(() => {
    const interactions = this._drugInteractions();
    return {
      high: interactions.filter(i => i.severity === 'HIGH').length,
      moderate: interactions.filter(i => i.severity === 'MODERATE').length,
      low: interactions.filter(i => i.severity === 'LOW').length,
      total: interactions.length
    };
  });

  /** Monthly adherence percentage (past days only). */
  readonly monthlyAdherencePercent = computed(() => {
    const today = new Date(2026, 1, 21);
    const pastEntries = this._adherenceLog().filter(e => e.date <= today && e.medications.length > 0);
    if (pastEntries.length === 0) return 0;
    const totalDoses = pastEntries.reduce((sum, e) => sum + e.medications.length, 0);
    const takenDoses = pastEntries.reduce(
      (sum, e) => sum + e.medications.filter(m => m.taken).length,
      0
    );
    return totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);
  });

  openRefillDialog(medicationId: string): void {
    const med = this._prescriptions().find(rx => rx.id === medicationId);
    // ─── Feature 11.2: Controlled substance triage ───────────────────────
    if (med?.controlledSubstance) {
      this._selectedMedicationId.set(medicationId);
      this._dialogOpen.set(true);
      this._refillStep.set('controlled-warning' as RefillStep);
      return;
    }
    this._selectedMedicationId.set(medicationId);
    this._selectedPharmacyId.set(med?.preferredPharmacyId ?? null);
    this._refillStep.set('select-pharmacy');
    this._dialogOpen.set(true);
  }

  closeRefillDialog(): void {
    this._dialogOpen.set(false);
    this._selectedMedicationId.set(null);
    this._selectedPharmacyId.set(null);
    this._refillStep.set('select-med');
  }

  selectPharmacy(pharmacyId: string): void {
    this._selectedPharmacyId.set(pharmacyId);
  }

  goToConfirm(): void {
    if (this._selectedPharmacyId()) {
      this._refillStep.set('confirm');
    }
  }

  goBackToPharmacy(): void {
    this._refillStep.set('select-pharmacy');
  }

  // ─── Feature 11.2: Proceed past controlled warning to normal refill ──────
  proceedFromControlledWarning(): void {
    const med = this.selectedMedication();
    this._selectedPharmacyId.set(med?.preferredPharmacyId ?? null);
    this._refillStep.set('select-pharmacy');
  }

  confirmRefill(): void {
    const med = this.selectedMedication();
    const pharmacy = this.selectedPharmacy();
    if (!med || !pharmacy) return;

    const newRequest: RefillRequest = {
      id: `rr-${Date.now()}`,
      medicationId: med.id,
      medicationName: `${med.medicationName} ${med.dosage}`,
      dosage: med.dosage,
      pharmacyId: pharmacy.id,
      pharmacy: pharmacy.name,
      pharmacyAddress: `${pharmacy.address}, ${pharmacy.city}`,
      status: 'requested',
      requestedAt: new Date(2026, 1, 21),
      estimatedReady: daysFromNow(2),
      notes: 'Refill request submitted. You will be notified when ready.'
    };

    this._refillRequests.update(requests => [newRequest, ...requests]);

    this._prescriptions.update(rxs =>
      rxs.map(rx =>
        rx.id === med.id
          ? { ...rx, refillsRemaining: Math.max(0, rx.refillsRemaining - 1) }
          : rx
      )
    );

    this.closeRefillDialog();
  }

  getRefillProgress(status: RefillRequest['status']): number {
    const map: Record<RefillRequest['status'], number> = {
      'requested': 1,
      'processing': 2,
      'ready': 3,
      'picked-up': 4
    };
    return map[status];
  }

  getStatusLabel(status: RefillRequest['status']): string {
    const labels: Record<RefillRequest['status'], string> = {
      'requested': 'Requested',
      'processing': 'Processing',
      'ready': 'Ready for Pickup',
      'picked-up': 'Picked Up'
    };
    return labels[status];
  }

  getStatusSeverity(status: RefillRequest['status']): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<RefillRequest['status'], 'success' | 'info' | 'warn' | 'danger'> = {
      'requested': 'info',
      'processing': 'warn',
      'ready': 'success',
      'picked-up': 'success'
    };
    return map[status];
  }

  getRefillBarWidth(refillsRemaining: number, refillsTotal: number): number {
    if (refillsTotal === 0) return 0;
    return Math.round((refillsRemaining / refillsTotal) * 100);
  }

  getRefillBarClass(refillsRemaining: number): string {
    if (refillsRemaining === 0) return 'bar-empty';
    if (refillsRemaining === 1) return 'bar-low';
    return 'bar-ok';
  }

  /** Returns the adherence status for a calendar day cell. */
  getDayAdherenceStatus(entry: AdherenceEntry): 'all-taken' | 'partial' | 'missed' | 'future' | 'none' {
    if (entry.medications.length === 0) return 'future';
    const taken = entry.medications.filter(m => m.taken).length;
    const total = entry.medications.length;
    if (taken === 0) return 'missed';
    if (taken === total) return 'all-taken';
    return 'partial';
  }
}
